 package it.filippetti.jarvis.safemap;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import it.filippetti.jarvis.safemap.BluetoothBridge;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {


        registerPlugin(BluetoothBridge.class);

        registerPlugin(ZipExtractorPlugin.class);

        super.onCreate(savedInstanceState);
        // Aggiungi la registrazione del plugin qui
    }
}
