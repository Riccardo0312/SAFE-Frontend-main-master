package it.filippetti.jarvis.safemap;

import android.Manifest;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresPermission;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import com.example.ble.BluetoothService;

@CapacitorPlugin(
        name = "BluetoothBLE",
        permissions = {
                @Permission(alias = "bluetoothScan", strings = { Manifest.permission.BLUETOOTH_SCAN }),
                @Permission(alias = "bluetoothConnect", strings = { Manifest.permission.BLUETOOTH_CONNECT }),
                @Permission(alias = "location", strings = { Manifest.permission.ACCESS_FINE_LOCATION })
        }
)
public class BluetoothBridge extends Plugin {

    private static final String TAG = "BLE_PLUGIN";
    private BluetoothService bleService;

    private enum PendingKind { SESSION_LIST, SESSION }
    private PluginCall pendingCall = null;
    private PendingKind pendingKind = null;

    @Override
    public void load() {
        bleService = new BluetoothService(getContext(), new BluetoothService.Listener() {

            @Override public void onLog(String line) {
                Log.d(TAG, line);
                JSObject ret = new JSObject();
                ret.put("log", line);
                notifyListeners("logUpdate", ret);
            }

            @Override public void onConnected() {
                notifyListeners("onConnected", new JSObject());
            }

            @Override public void onDisconnected() {
                notifyListeners("onDisconnected", new JSObject());
                failPending("Disconnected");
            }

            @Override public void onValueRead(java.util.UUID characteristic, String valueText) {
                JSObject ret = new JSObject();
                ret.put("uuid", characteristic.toString());
                ret.put("valueText", valueText);
                notifyListeners("onValueRead", ret);
            }

            @Override public void onCommandWritten(boolean ok) {
                JSObject ret = new JSObject();
                ret.put("ok", ok);
                notifyListeners("onCommandWritten", ret);

                // NOTA: ora la risposta arriva via NOTIFY; non facciamo più readAll qui.
                // Se vuoi: se ok==false e c'è pending, reject.
                if (!ok && pendingCall != null) {
                    PluginCall c = pendingCall;
                    pendingCall = null;
                    pendingKind = null;
                    c.setKeepAlive(false);
                    c.reject("Command write failed");
                }
            }

            @Override
            public void onTransferStart(String requestType, int sessionId, int totalSize, int expectedChunks) {
                JSObject ret = new JSObject();
                ret.put("requestType", requestType);
                ret.put("session_id", sessionId);
                ret.put("total_size", totalSize);
                ret.put("expected_chunks", expectedChunks);
                notifyListeners("transferStart", ret);
            }

            @Override
            public void onTransferProgress(String requestType, int sessionId, int receivedBytes, int totalSize) {
                JSObject ret = new JSObject();
                ret.put("requestType", requestType);
                ret.put("session_id", sessionId);
                ret.put("receivedBytes", receivedBytes);
                ret.put("total_size", totalSize);
                notifyListeners("transferProgress", ret);
            }

            @Override
            public void onTransferComplete(String requestType, int sessionId, String fullJsonUtf8) {
                JSObject ret = new JSObject();
                ret.put("requestType", requestType);
                ret.put("session_id", sessionId);
                notifyListeners("transferEnd", ret);

                // Risolvi la pending call (se presente)
                if (pendingCall != null) {
                    PluginCall c = pendingCall;
                    PendingKind kind = pendingKind;

                    pendingCall = null;
                    pendingKind = null;

                    JSObject out = new JSObject();
                    out.put("json", fullJsonUtf8);
                    out.put("session_id", sessionId);
                    out.put("kind", kind.toString());

                    c.setKeepAlive(false);
                    c.resolve(out);
                }
            }

            @Override
            public void onTransferError(String requestType, int sessionId, String reason) {
                JSObject ret = new JSObject();
                ret.put("requestType", requestType);
                ret.put("session_id", sessionId);
                ret.put("reason", reason);
                notifyListeners("transferError", ret);

                failPending("TransferError: " + reason);
            }
        });
    }

    // -------- Permessi --------

    private boolean isAndroid12Plus() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S;
    }

    private boolean hasScanPermissions() {
        if (isAndroid12Plus()) {
            return getPermissionState("bluetoothScan") == PermissionState.GRANTED
                    && getPermissionState("bluetoothConnect") == PermissionState.GRANTED;
        } else {
            return getPermissionState("location") == PermissionState.GRANTED;
        }
    }

    private boolean hasGattPermissions() {
        if (isAndroid12Plus()) {
            return getPermissionState("bluetoothConnect") == PermissionState.GRANTED;
        } else {
            return true;
        }
    }

    private String[] requiredAliasesForScan() {
        return isAndroid12Plus()
                ? new String[] { "bluetoothScan", "bluetoothConnect" }
                : new String[] { "location" };
    }

    private String[] requiredAliasesForGatt() {
        return isAndroid12Plus()
                ? new String[] { "bluetoothConnect" }
                : new String[0];
    }

    private static String stateToString(PermissionState s) {
        return s == null ? "prompt" : s.toString().toLowerCase();
    }

    private void failPending(String reason) {
        if (pendingCall != null) {
            PluginCall c = pendingCall;
            pendingCall = null;
            pendingKind = null;
            c.setKeepAlive(false);
            c.reject(reason);
        }
    }

    // -------- Plugin Methods --------

    @PluginMethod
    public void startScan(PluginCall call) {
        if (bleService == null) { call.reject("BLE service not initialized"); return; }

        if (!hasScanPermissions()) {
            requestPermissionForAliases(requiredAliasesForScan(), call, "startScanPermissionsCallback");
            return;
        }

        try {
            bleService.startScan();
            call.resolve();
        } catch (SecurityException se) {
            call.reject("Missing permissions (SecurityException)", se);
        } catch (Exception e) {
            call.reject("startScan failed: " + e.getMessage(), e);
        }
    }

    @PermissionCallback
    private void startScanPermissionsCallback(PluginCall call) {
        if (!hasScanPermissions()) { call.reject("Permissions denied"); return; }
        startScan(call);
    }

    @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
    @PluginMethod
    public void stopScan(PluginCall call) {
        if (bleService == null) { call.reject("BLE service not initialized"); return; }
        try {
            bleService.stopScan();
            call.resolve();
        } catch (Exception e) {
            call.reject("stopScan failed: " + e.getMessage(), e);
        }
    }

    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    @PluginMethod
    public void disconnectAndClose(PluginCall call) {
        if (bleService == null) { call.reject("BLE service not initialized"); return; }

        if (!hasGattPermissions()) {
            String[] aliases = requiredAliasesForGatt();
            if (aliases.length == 0) { call.reject("Permissions denied"); return; }
            requestPermissionForAliases(aliases, call, "disconnectPermissionsCallback");
            return;
        }

        // cancella pending in modo deterministico
        failPending("Cancelled by disconnect");

        try {
            bleService.disconnectAndClose();
            call.resolve();
        } catch (Exception e) {
            call.reject("disconnectAndClose failed: " + e.getMessage(), e);
        }
    }

    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    @PermissionCallback
    private void disconnectPermissionsCallback(PluginCall call) {
        if (!hasGattPermissions()) { call.reject("Permissions denied"); return; }
        disconnectAndClose(call);
    }

    @PluginMethod
    public void sendStartSession(PluginCall call) {
        if (bleService == null) { call.reject("BLE service not initialized"); return; }

        if (!hasGattPermissions()) {
            String[] aliases = requiredAliasesForGatt();
            if (aliases.length == 0) { call.reject("Permissions denied"); return; }
            requestPermissionForAliases(aliases, call, "sendStartSessionPermissionsCallback");
            return;
        }

        try {
            bleService.sendStartSession();
            call.resolve();
        } catch (Exception e) {
            call.reject("sendStartSession failed: " + e.getMessage(), e);
        }
    }

    @PermissionCallback
    private void sendStartSessionPermissionsCallback(PluginCall call) {
        if (!hasGattPermissions()) { call.reject("Permissions denied"); return; }
        sendStartSession(call);
    }

    @PluginMethod
    public void sendStopSession(PluginCall call) {
        if (bleService == null) { call.reject("BLE service not initialized"); return; }

        if (!hasGattPermissions()) {
            String[] aliases = requiredAliasesForGatt();
            if (aliases.length == 0) { call.reject("Permissions denied"); return; }
            requestPermissionForAliases(aliases, call, "sendStopSessionPermissionsCallback");
            return;
        }

        try {
            bleService.sendStopSession();
            call.resolve();
        } catch (Exception e) {
            call.reject("sendStopSession failed: " + e.getMessage(), e);
        }
    }

    @PermissionCallback
    private void sendStopSessionPermissionsCallback(PluginCall call) {
        if (!hasGattPermissions()) { call.reject("Permissions denied"); return; }
        sendStopSession(call);
    }

    @PluginMethod
    public void getSessionList(PluginCall call) {
        if (bleService == null) { call.reject("BLE service not initialized"); return; }

        if (!hasGattPermissions()) {
            String[] aliases = requiredAliasesForGatt();
            if (aliases.length == 0) { call.reject("Permissions denied"); return; }
            requestPermissionForAliases(aliases, call, "getSessionListPermissionsCallback");
            return;
        }

        if (pendingCall != null) { call.reject("Another request already running"); return; }

        call.setKeepAlive(true);
        pendingCall = call;
        pendingKind = PendingKind.SESSION_LIST;

        try {
            bleService.sendGetSessionList();
        } catch (Exception e) {
            pendingCall = null;
            pendingKind = null;
            call.setKeepAlive(false);
            call.reject("getSessionList failed: " + e.getMessage(), e);
        }

        // timeout globale (se vuoi tenerlo anche qui, oltre a quello chunk-level)
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (pendingCall != null && pendingKind == PendingKind.SESSION_LIST) {
                failPending("Timeout waiting for session list");
            }
        }, 15000);
    }

    @PermissionCallback
    private void getSessionListPermissionsCallback(PluginCall call) {
        if (!hasGattPermissions()) { call.reject("Permissions denied"); return; }
        getSessionList(call);
    }

    @PluginMethod
    public void getSession(PluginCall call) {
        if (bleService == null) { call.reject("BLE service not initialized"); return; }

        if (!hasGattPermissions()) {
            String[] aliases = requiredAliasesForGatt();
            if (aliases.length == 0) { call.reject("Permissions denied"); return; }
            requestPermissionForAliases(aliases, call, "getSessionPermissionsCallback");
            return;
        }

        Integer sessionNumber = call.getInt("sessionNumber");
        if (sessionNumber == null) { call.reject("Missing sessionNumber"); return; }
        if (sessionNumber < 0) { call.reject("Invalid sessionNumber"); return; }

        if (pendingCall != null) { call.reject("Another request already running"); return; }

        call.setKeepAlive(true);
        pendingCall = call;
        pendingKind = PendingKind.SESSION;

        try {
            bleService.sendGetSession(sessionNumber);
        } catch (Exception e) {
            pendingCall = null;
            pendingKind = null;
            call.setKeepAlive(false);
            call.reject("getSession failed: " + e.getMessage(), e);
        }

        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (pendingCall != null && pendingKind == PendingKind.SESSION) {
                failPending("Timeout waiting for session");
            }
        }, 15000);
    }

    @PermissionCallback
    private void getSessionPermissionsCallback(PluginCall call) {
        if (!hasGattPermissions()) { call.reject("Permissions denied"); return; }
        getSession(call);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("bluetoothScan", stateToString(getPermissionState("bluetoothScan")));
        ret.put("bluetoothConnect", stateToString(getPermissionState("bluetoothConnect")));
        ret.put("location", stateToString(getPermissionState("location")));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        requestPermissionForAliases(
                isAndroid12Plus()
                        ? new String[] { "bluetoothScan", "bluetoothConnect" }
                        : new String[] { "location" },
                call,
                "permissionCallback"
        );
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("bluetoothScan", stateToString(getPermissionState("bluetoothScan")));
        ret.put("bluetoothConnect", stateToString(getPermissionState("bluetoothConnect")));
        ret.put("location", stateToString(getPermissionState("location")));
        call.resolve(ret);
    }
}
