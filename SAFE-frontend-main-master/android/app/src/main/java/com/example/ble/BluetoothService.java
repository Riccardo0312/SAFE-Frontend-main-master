package com.example.ble;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.*;
import android.bluetooth.le.*;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.util.Log;

import androidx.annotation.RequiresPermission;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

public class BluetoothService {

    public interface Listener {
        void onLog(String line);
        void onConnected();
        void onDisconnected();

        // Eventi generici (li puoi tenere)
        void onValueRead(UUID characteristic, String valueText);
        void onCommandWritten(boolean ok);

        // Eventi trasferimento streaming
        void onTransferStart(String requestType, int sessionId, int totalSize, int expectedChunks);
        void onTransferProgress(String requestType, int sessionId, int receivedBytes, int totalSize);
        void onTransferComplete(String requestType, int sessionId, String fullJsonUtf8);
        void onTransferError(String requestType, int sessionId, String reason);
    }

    private static final String TAG = "BluetoothService";

    // CCCD per NOTIFY/INDICATE
    private static final UUID CCCD_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    private static final byte[] ENABLE_NOTIFY_VALUE = new byte[]{0x01, 0x00};

    private final Context context;
    private final Listener listener;

    private BluetoothLeScanner bleScanner;
    private BluetoothGatt bluetoothGatt;
    private final AtomicBoolean isScanning = new AtomicBoolean(false);

    private final java.util.concurrent.atomic.AtomicInteger cmdId = new java.util.concurrent.atomic.AtomicInteger(1);

    // ---- GATT op queue ----
    private final ArrayDeque<Runnable> gattQueue = new ArrayDeque<>();
    private boolean gattBusy = false;

    // ---- NOTIFY characteristic reference ----
    private BluetoothGattCharacteristic notifyContentCharacteristic;

    // ---- Transfer state machine ----
    private enum TransferState { IDLE, RECEIVING }
    private TransferState transferState = TransferState.IDLE;

    private String currentRequestType = null;  // "SESSION_LIST" or "SESSION"
    private int currentSessionId = -1;
    private int totalSize = 0;
    private int expectedChunks = 0;

    private byte[] buffer = null;
    private int writeIndex = 0;

    // watchdog: timeout se non arrivano chunk dopo START
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final long CHUNK_TIMEOUT_MS = 2000;
    private final Runnable chunkTimeoutRunnable = new Runnable() {
        @Override public void run() {
            if (transferState == TransferState.RECEIVING) {
                String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
                int sid = currentSessionId;
                abortTransfer("Timeout: no chunks received within " + CHUNK_TIMEOUT_MS + "ms");
                if (listener != null) listener.onTransferError(req, sid, "Timeout");
            }
        }
    };

    public BluetoothService(Context ctx, Listener listener) {
        this.context  = ctx.getApplicationContext();
        this.listener = listener;
    }

    // ---------- Public API ----------

    @RequiresPermission(value = Manifest.permission.BLUETOOTH_SCAN)
    public void startScan() {
        log("Inizio scan...");
        if (!hasScanPerms()) {
            log("Permessi BLE mancanti (scan)");
            return;
        }
        BluetoothAdapter adapter = getAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            log("Bluetooth non disponibile o spento");
            return;
        }
        bleScanner = adapter.getBluetoothLeScanner();
        if (bleScanner == null) {
            log("BLEScanner non disponibile");
            return;
        }

        ScanFilter filter = new ScanFilter.Builder()
                .setServiceUuid(new ParcelUuid(BleUuids.SERVIZIO_UUID))
                .build();

        ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();

        if (isScanning.compareAndSet(false, true)) {
            bleScanner.startScan(Collections.singletonList(filter), settings, scanCallback);
            log("Scan avviato…");
        }
    }

    @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
    public void stopScan() {
        if (bleScanner != null && isScanning.compareAndSet(true, false)) {
            bleScanner.stopScan(scanCallback);
            log("Scan fermato");
        } else {
            log("Nessuno scan in esecuzione");
        }
    }

    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    public void disconnectAndClose() {
        if (!hasConnectPerms()) {
            log("disconnectAndClose: permessi mancanti");
            return;
        }

        abortTransfer("Disconnect");

        if (bluetoothGatt != null) {
            try {
                bluetoothGatt.disconnect();
            } catch (SecurityException ignored) {}
            try {
                bluetoothGatt.close();
            } catch (SecurityException ignored) {}
            bluetoothGatt = null;
            notifyContentCharacteristic = null;
        }

        log("Disconnessione + close richiesti");
    }

    // Comandi tipizzati
    public void sendStartSession() {
        sendCommandSimple("START_SAMPLING", "boot");
    }

    public void sendStopSession() {
        sendCommandSimple("STOP_SAMPLING", "boot");
    }

    // ---- STREAMING: session list ----
    public void sendGetSessionList() {
        if (bluetoothGatt == null) { log("Non connesso"); return; }
        BluetoothGattService svc = bluetoothGatt.getService(BleUuids.SERVIZIO_UUID);
        if (svc == null) { log("Servizio non trovato"); return; }

        try {
            JSONObject cmd = new JSONObject();
            cmd.put("type", "GET_SESSION_LIST");
            cmd.put("id", cmdId.getAndIncrement());
            cmd.put("payload", JSONObject.NULL);

            beginNewRequest("SESSION_LIST");

            writeJsonQueued(bluetoothGatt, svc, cmd.toString());
            log("Inviato GET_SESSION_LIST");
        } catch (Exception e) {
            log("Errore JSON GET_SESSION_LIST: " + e.getMessage());
        }
    }

    // ---- STREAMING: single session ----
    public void sendGetSession(int sessionNumber) {
        if (bluetoothGatt == null) { log("Non connesso"); return; }
        BluetoothGattService svc = bluetoothGatt.getService(BleUuids.SERVIZIO_UUID);
        if (svc == null) { log("Servizio non trovato"); return; }

        try {
            JSONObject payload = new JSONObject();
            payload.put("session_id", sessionNumber);

            JSONObject cmd = new JSONObject();
            cmd.put("type", "GET_SESSION");
            cmd.put("id", cmdId.getAndIncrement());
            cmd.put("payload", payload);

            beginNewRequest("SESSION");

            writeJsonQueued(bluetoothGatt, svc, cmd.toString());
            log("Inviato GET_SESSION session_id=" + sessionNumber);
        } catch (Exception e) {
            log("Errore JSON GET_SESSION: " + e.getMessage());
        }
    }

    // ---------- Internal helpers ----------

    private void sendCommandSimple(String type, String payloadString) {
        if (bluetoothGatt == null) { log("Non connesso"); return; }
        BluetoothGattService svc = bluetoothGatt.getService(BleUuids.SERVIZIO_UUID);
        if (svc == null) { log("Servizio non trovato"); return; }
        try {
            JSONObject cmd = new JSONObject();
            cmd.put("type", type);
            cmd.put("id", cmdId.getAndIncrement());
            cmd.put("payload", payloadString);
            writeJsonQueued(bluetoothGatt, svc, cmd.toString());
        } catch (Exception e) {
            log("Errore JSON: " + e.getMessage());
        }
    }

    private void beginNewRequest(String requestType) {
        // reset transfer machine for this request (actual start happens on TRANSFER_START notify)
        abortTransfer("New request");
        currentRequestType = requestType;
    }

    private void armChunkTimeout() {
        mainHandler.removeCallbacks(chunkTimeoutRunnable);
        mainHandler.postDelayed(chunkTimeoutRunnable, CHUNK_TIMEOUT_MS);
    }

    private void disarmChunkTimeout() {
        mainHandler.removeCallbacks(chunkTimeoutRunnable);
    }

    private void abortTransfer(String reason) {
        disarmChunkTimeout();
        transferState = TransferState.IDLE;
        buffer = null;
        writeIndex = 0;
        totalSize = 0;
        expectedChunks = 0;
        currentSessionId = -1;
        log("Transfer reset: " + reason);
    }

    // ------------------------------ Scan ------------------------------
    private final ScanCallback scanCallback = new ScanCallback() {
        @RequiresPermission(allOf = {Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT})
        @Override public void onScanResult(int callbackType, ScanResult result) {
            ScanRecord record = result.getScanRecord();
            if (record == null) return;

            List<ParcelUuid> uuids = record.getServiceUuids();
            if (uuids != null && uuids.contains(new ParcelUuid(BleUuids.SERVIZIO_UUID))) {
                BluetoothDevice device = result.getDevice();
                log("Gateway trovato: " + device.getAddress());
                stopScan();
                connect(device);
            }
        }

        @Override public void onScanFailed(int errorCode) {
            log("Scan fallito: " + errorCode);
        }
    };

    @SuppressLint("MissingPermission")
    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    private void connect(BluetoothDevice device) {
        if (!hasConnectPerms()) {
            log("connect: permessi connect mancanti");
            return;
        }

        synchronized (gattQueue) {
            gattQueue.clear();
            gattBusy = false;
        }

        notifyContentCharacteristic = null;
        abortTransfer("connect()");

        bluetoothGatt = device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE);
        log("Connessione GATT in corso…");
    }

    // ------------------------------ GATT Callback ------------------------------
    private final BluetoothGattCallback gattCallback = new BluetoothGattCallback() {

        @SuppressLint("MissingPermission")
        @Override public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            log("onConnectionStateChange status=" + status + " newState=" + newState);

            if (status != BluetoothGatt.GATT_SUCCESS) {
                log("Errore connessione: " + status);
                safeClose(gatt);
                if (listener != null) listener.onDisconnected();
                return;
            }

            if (newState == BluetoothProfile.STATE_CONNECTED) {
                bluetoothGatt = gatt;
                log("Connesso. Richiedo MTU...");
                if (listener != null) listener.onConnected();

                try {
                    boolean mtuOk = gatt.requestMtu(247);
                    log("requestMtu(247) -> " + mtuOk);
                    if (!mtuOk) {
                        boolean ok = gatt.discoverServices();
                        log("discoverServices() (fallback) -> " + ok);
                    }
                } catch (SecurityException se) {
                    log("SecurityException requestMtu/discoverServices");
                }

            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                log("Disconnesso");
                abortTransfer("disconnected");
                if (listener != null) listener.onDisconnected();
                bluetoothGatt = null;
                notifyContentCharacteristic = null;
                safeClose(gatt);
            }
        }

        @SuppressLint("MissingPermission")
        @Override public void onMtuChanged(BluetoothGatt gatt, int mtu, int status) {
            log("MTU: " + mtu + " (status=" + status + ")");
            try {
                boolean ok = gatt.discoverServices();
                log("discoverServices() dopo MTU -> " + ok);
            } catch (SecurityException se) {
                log("SecurityException discoverServices");
            }
        }

        @SuppressLint("MissingPermission")
        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            log("onServicesDiscovered status=" + status);

            if (status != BluetoothGatt.GATT_SUCCESS) {
                log("discoverServices fallito: " + status);
                return;
            }

            BluetoothGattService svc = gatt.getService(BleUuids.SERVIZIO_UUID);
            if (svc == null) {
                log("Servizio custom non trovato");
                for (BluetoothGattService s : gatt.getServices()) {
                    log("Service trovato: " + s.getUuid());
                }
                return;
            }

            notifyContentCharacteristic = svc.getCharacteristic(BleUuids.CONTENUTO_DATI_UUID);
            if (notifyContentCharacteristic == null) {
                log("CONTENUTO_DATI_UUID non trovata: non posso abilitare notifiche");
                return;
            }

            enableNotifyQueued(gatt, notifyContentCharacteristic);

            log("Servizio trovato. Notifiche abilitate (in coda).");
        }

        @Override
        public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic ch, int status) {
            try {
                boolean ok = (status == BluetoothGatt.GATT_SUCCESS);
                if (listener != null) listener.onCommandWritten(ok);
                log("Write " + ch.getUuid() + " status=" + status);
            } finally {
                doneOp();
            }
        }

        @Override
        public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
            try {
                log("DescriptorWrite " + descriptor.getUuid() + " status=" + status);
            } finally {
                doneOp();
            }
        }

        // NOTIFY callback (API < 33)
        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
            byte[] value = characteristic.getValue();
            handleNotify(characteristic.getUuid(), value);
        }

        // NOTIFY callback (API 33+)
        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, byte[] value) {
            handleNotify(characteristic.getUuid(), value);
        }
    };

    // ------------------------------ Notify handler (state machine) ------------------------------

    private void handleNotify(UUID uuid, byte[] data) {
        if (data == null || data.length == 0) return;

        if (!BleUuids.CONTENUTO_DATI_UUID.equals(uuid)) {
            return;
        }

        // IDLE: ci aspettiamo controllo JSON (START) oppure ERROR
        if (transferState == TransferState.IDLE) {
            if (!looksLikeJson(data)) {
                log("IDLE: ricevuto raw senza START, ignoro (len=" + data.length + ")");
                return;
            }

            JSONObject msg = tryParseJson(data);
            if (msg == null) {
                log("IDLE: JSON non parsabile, ignoro");
                return;
            }

            String type = msg.optString("type", "");

            // --- Gestione ERROR in IDLE (prima di START) ---
            if ("ERROR".equals(type)) {
                String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;

                String reason =
                        msg.optString("reason",
                                msg.optString("message",
                                        msg.optString("error", "Device returned ERROR")));

                int sid = msg.optInt("session_id", -1);

                log("IDLE: device ERROR for " + req + " session_id=" + sid + " reason=" + reason + " msg=" + msg.toString());

                abortTransfer("device error");
                if (listener != null) listener.onTransferError(req, sid, reason);
                return;
            }

            // --- Se non è START, meglio fallire subito (niente timeout) ---
            if (!"TRANSFER_START".equals(type)) {
                String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
                log("IDLE: JSON controllo inatteso type=" + type + " msg=" + msg.toString());
                abortTransfer("unexpected control json");
                if (listener != null) listener.onTransferError(req, -1, "Unexpected control message: " + type);
                return;
            }

            int sid = msg.optInt("session_id", -1);
            int size = msg.optInt("total_size", -1);
            int chunks = msg.optInt("expected_chunks", -1);

            if (size <= 0) {
                log("TRANSFER_START: total_size invalido: " + size + " msg=" + msg.toString());
                String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
                abortTransfer("invalid total_size");
                if (listener != null) listener.onTransferError(req, sid, "Invalid total_size");
                return;
            }

            currentSessionId = sid;
            totalSize = size;
            expectedChunks = chunks;

            buffer = new byte[totalSize];
            writeIndex = 0;
            transferState = TransferState.RECEIVING;

            armChunkTimeout();

            String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
            log("TRANSFER_START session_id=" + sid + " total_size=" + size + " expected_chunks=" + chunks);
            if (listener != null) listener.onTransferStart(req, sid, size, chunks);
            return;
        }

        // RECEIVING: raw chunks e/o JSON TRANSFER_END / ERROR
        if (transferState == TransferState.RECEIVING) {
            armChunkTimeout();

            if (looksLikeJson(data)) {
                JSONObject msg = tryParseJson(data);
                if (msg != null) {
                    String type = msg.optString("type", "");
                    String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;

                    if ("TRANSFER_END".equals(type)) {
                        int sid = msg.optInt("session_id", -1);

                        disarmChunkTimeout();

                        if (writeIndex != totalSize) {
                            String reason = "Corrupted: receivedBytes=" + writeIndex + " expected=" + totalSize;
                            log("TRANSFER_END mismatch: " + reason);
                            abortTransfer("mismatch");
                            if (listener != null) listener.onTransferError(req, sid, reason);
                            return;
                        }

                        String full = new String(buffer, 0, writeIndex, StandardCharsets.UTF_8);
                        log("TRANSFER_END ok session_id=" + sid + " bytes=" + writeIndex);

                        abortTransfer("complete");

                        if (listener != null) listener.onTransferComplete(req, sid, full);
                        return;
                    }

                    if ("ERROR".equals(type)) {
                        String reason =
                                msg.optString("reason",
                                        msg.optString("message",
                                                msg.optString("error", "Device returned ERROR during streaming")));

                        int sid = msg.optInt("session_id", currentSessionId);

                        disarmChunkTimeout();
                        log("RECEIVING: device ERROR sid=" + sid + " reason=" + reason + " msg=" + msg.toString());

                        abortTransfer("device error during streaming");
                        if (listener != null) listener.onTransferError(req, sid, reason);
                        return;
                    }

                    // altro JSON durante streaming: errore hard
                    String reason = "Unexpected JSON during streaming: type=" + type;
                    disarmChunkTimeout();
                    log(reason + " msg=" + msg.toString());
                    int sid = currentSessionId;
                    abortTransfer("unexpected json");
                    if (listener != null) listener.onTransferError(req, sid, reason);
                    return;
                }

                // looksLikeJson ma parse fallisce: più sicuro abortire
                String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
                String reason = "Looks like JSON but parse failed during streaming";
                log(reason);
                int sid = currentSessionId;
                abortTransfer("json parse fail");
                if (listener != null) listener.onTransferError(req, sid, reason);
                return;
            }

            // raw chunk
            if (buffer == null) {
                String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
                String reason = "Buffer null while receiving";
                log(reason);
                int sid = currentSessionId;
                abortTransfer("buffer null");
                if (listener != null) listener.onTransferError(req, sid, reason);
                return;
            }

            if (writeIndex + data.length > totalSize) {
                String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
                String reason = "Overflow: writeIndex=" + writeIndex + " +len=" + data.length + " > totalSize=" + totalSize;
                log(reason);
                int sid = currentSessionId;
                abortTransfer("overflow");
                if (listener != null) listener.onTransferError(req, sid, reason);
                return;
            }

            System.arraycopy(data, 0, buffer, writeIndex, data.length);
            writeIndex += data.length;

            String req = currentRequestType == null ? "UNKNOWN" : currentRequestType;
            if (listener != null) listener.onTransferProgress(req, currentSessionId, writeIndex, totalSize);
        }
    }

    private boolean looksLikeJson(byte[] data) {
        // Fast path: primo byte '{' (0x7B).
        if (data.length < 2) return false;
        if (data[0] != 0x7B) return false;

        // non pretendiamo che l'ultimo byte sia '}' perché alcuni server aggiungono \n o spazi
        // facciamo una check cheap: trova ultimo byte "significativo" e verifica '}'
        int i = data.length - 1;
        while (i >= 0) {
            byte b = data[i];
            if (b == 0x20 || b == 0x0A || b == 0x0D || b == 0x09) { // space, \n, \r, \t
                i--;
                continue;
            }
            return b == 0x7D; // '}'
        }
        return false;
    }

    private JSONObject tryParseJson(byte[] data) {
        try {
            String s = new String(data, StandardCharsets.UTF_8).trim();
            return new JSONObject(s);
        } catch (Exception e) {
            return null;
        }
    }

    // ------------------------------ Queue helpers ------------------------------

    private void enqueue(Runnable op) {
        synchronized (gattQueue) {
            gattQueue.add(op);
        }
        drainQueue();
    }

    private void drainQueue() {
        Runnable op;
        synchronized (gattQueue) {
            if (gattBusy) return;
            op = gattQueue.poll();
            if (op == null) return;
            gattBusy = true;
        }
        op.run();
    }

    private void doneOp() {
        synchronized (gattQueue) {
            gattBusy = false;
        }
        drainQueue();
    }

    // ------------------------------ GATT ops (queued) ------------------------------

    private void writeJsonQueued(BluetoothGatt gatt, BluetoothGattService svc, String json) {
        enqueue(() -> {
            BluetoothGattCharacteristic ch = svc.getCharacteristic(BleUuids.COMANDO_GATEWAY_UUID);
            if (ch == null) {
                log("COMANDO_GATEWAY non trovata");
                doneOp();
                return;
            }

            int props = ch.getProperties();
            boolean canWrite = (props & BluetoothGattCharacteristic.PROPERTY_WRITE) != 0
                    || (props & BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) != 0;
            if (!canWrite) {
                log("Caratteristica comando non scrivibile: props=" + props);
                doneOp();
                return;
            }

            ch.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
            ch.setValue(json.getBytes(StandardCharsets.UTF_8));

            try {
                boolean ok = gatt.writeCharacteristic(ch);
                log("writeCharacteristic(COMANDO_GATEWAY) -> " + ok);
                if (!ok) doneOp();
            } catch (SecurityException se) {
                log("SecurityException writeCharacteristic");
                doneOp();
            }
        });
    }

    private void enableNotifyQueued(BluetoothGatt gatt, BluetoothGattCharacteristic ch) {
        enqueue(() -> {
            try {
                boolean ok = gatt.setCharacteristicNotification(ch, true);
                log("setCharacteristicNotification -> " + ok);

                BluetoothGattDescriptor cccd = ch.getDescriptor(CCCD_UUID);
                if (cccd == null) {
                    log("CCCD (0x2902) non trovato sulla characteristic");
                    doneOp();
                    return;
                }

                if (Build.VERSION.SDK_INT >= 33) {
                    int res = gatt.writeDescriptor(cccd, ENABLE_NOTIFY_VALUE);
                    log("writeDescriptor(API33+) -> " + res);
                    if (res != BluetoothGatt.GATT_SUCCESS) doneOp();
                } else {
                    cccd.setValue(ENABLE_NOTIFY_VALUE);
                    boolean w = gatt.writeDescriptor(cccd);
                    log("writeDescriptor -> " + w);
                    if (!w) doneOp();
                }
            } catch (SecurityException se) {
                log("SecurityException enableNotify");
                doneOp();
            }
        });
    }

    // ------------------------------ Utils ------------------------------

    private void safeClose(BluetoothGatt gatt) {
        if (gatt == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT)
                    != PackageManager.PERMISSION_GRANTED) {
                log("safeClose: BLUETOOTH_CONNECT non concesso");
                return;
            }
        }

        try { gatt.close(); } catch (Exception ignored) {}
    }

    private BluetoothAdapter getAdapter() {
        BluetoothManager manager = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        return manager != null ? manager.getAdapter() : null;
    }

    private boolean hasScanPerms() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return context.checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED
                    && context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        } else {
            return context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private boolean hasConnectPerms() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        } else {
            return true;
        }
    }

    private void log(String msg) {
        Log.d(TAG, msg);
        if (listener != null) listener.onLog(msg);
    }
}
