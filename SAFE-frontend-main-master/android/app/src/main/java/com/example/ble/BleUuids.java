package com.example.ble;

import java.util.UUID;

public final class BleUuids {
    public static final UUID SERVIZIO_UUID        = UUID.fromString("9657978c-87cc-4936-87f7-c59d1df66ff1");
    public static final UUID STATO_CAMPAGNA_UUID  = UUID.fromString("9657978c-87cc-4936-87f7-c59d1df66ff2");
    public static final UUID DATA_SIZE_UUID       = UUID.fromString("9657978c-87cc-4936-87f7-c59d1df66ff3");
    public static final UUID CONTENUTO_DATI_UUID  = UUID.fromString("9657978c-87cc-4936-87f7-c59d1df66ff4");
    public static final UUID COMANDO_GATEWAY_UUID = UUID.fromString("9657978c-87cc-4936-87f7-c59d1df66ff5");
    private BleUuids() {}
}