/*package com.example.ble;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import java.util.UUID;

public class MainActivity extends AppCompatActivity implements BluetoothService.Listener {

    private BluetoothService ble;
    private TextView logView;
    private Button btnScanStart, btnScanStop, btnStartSampling, btnStopSampling, btnReadAll;

    private static final String[] PERMS_12P = new String[] {
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT
    };
    private static final String[] PERMS_10_11 = new String[] {
            Manifest.permission.ACCESS_FINE_LOCATION
    };

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        logView = findViewById(R.id.logView);
        btnScanStart = findViewById(R.id.btnScanStart);
        btnScanStop = findViewById(R.id.btnScanStop);
        btnStartSampling = findViewById(R.id.btnStartSampling);
        btnStopSampling = findViewById(R.id.btnStopSampling);
        btnReadAll = findViewById(R.id.btnReadAll);

        ble = new BluetoothService(this, this);

        btnScanStart.setOnClickListener(v -> {
            if (hasBlePermissions()) ble.startScan();
            else requestBlePermissions();
        });

        btnScanStop.setOnClickListener(v -> ble.stopScan());
        btnStartSampling.setOnClickListener(v -> ble.sendStartSession());
        btnStopSampling.setOnClickListener(v -> ble.sendStopSession());
        btnReadAll.setOnClickListener(v -> ble.readAll());
    }

    @Override protected void onStart() {
        super.onStart();
        if (!hasBlePermissions()) requestBlePermissions();
    }

    @Override protected void onStop() {
        super.onStop();
        ble.stopScan();
    }

    @Override protected void onDestroy() {
        ble.disconnect();
        super.onDestroy();
    }

    // ---------- Permessi ----------
    private boolean hasBlePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN)    == PackageManager.PERMISSION_GRANTED
                    && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        } else {
            return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private void requestBlePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestPermissions(PERMS_12P, 1001);
        } else {
            requestPermissions(PERMS_10_11, 1002);
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        boolean granted = true;
        for (int r : grantResults) granted &= (r == PackageManager.PERMISSION_GRANTED);
        if (granted) ble.startScan();
        else appendLog("Permessi negati");
    }

    // ---------- BluetoothService.Listener ----------
    @Override public void onLog(String line) { appendLog(line); }

    @Override public void onConnected() { appendLog("UI: connesso al gateway"); }

    @Override public void onDisconnected() { appendLog("UI: disconnesso"); }

    @Override public void onValueRead(UUID characteristic, String valueText) {
        appendLog("UI value: " + characteristic + " = " + valueText);
    }

    @Override public void onCommandWritten(boolean ok) {
        appendLog("UI write command esito: " + ok);
    }

    private void appendLog(String s) {
        runOnUiThread(() -> {
            String prev = logView.getText().toString();
            logView.setText(prev + (prev.isEmpty() ? "" : "\n") + s);
        });
    }
}

 */
