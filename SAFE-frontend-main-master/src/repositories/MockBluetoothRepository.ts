import { PluginListenerHandle } from "@capacitor/core";
import {
  BluetoothPermissionResult,
  GetJsonResult,
  TransferEndEvent,
  TransferErrorEvent,
  TransferProgressEvent,
  TransferStartEvent,
  ValueReadResult,
} from "../plugins/bluetooth-ble";
import { BluetoothRepositoryContract } from "./BluetoothRepositoryContract";

type Listener<T> = (data: T) => void;

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

type GeoPoint = {
  latitude: number;
  longitude: number;
};

const CENTER: GeoPoint = {
  latitude: 43.13949018030894,
  longitude: 13.06871045495453,
};

function offsetMeters(
  center: GeoPoint,
  eastMeters: number,
  northMeters: number
): GeoPoint {
  const latitudeOffset = northMeters / 111_320;

  const longitudeOffset =
    eastMeters /
    (111_320 * Math.cos((center.latitude * Math.PI) / 180));

  return {
    latitude: center.latitude + latitudeOffset,
    longitude: center.longitude + longitudeOffset,
  };
}

const SENSORS = {
  SAFE_A_01: offsetMeters(
    CENTER,
    -4,
    -3
  ),

  SAFE_A_02: offsetMeters(
    CENTER,
    0,
    0
  ),

  SAFE_A_03: offsetMeters(
    CENTER,
    4,
    3
  ),
} as const;
class MockBluetoothRepository implements BluetoothRepositoryContract {
  private connected = false;
  private scanning = false;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly logListeners = new Set<
    Listener<{ log: string }>
  >();

  private readonly connectedListeners = new Set<() => void>();
  private readonly disconnectedListeners = new Set<() => void>();

  private readonly valueReadListeners = new Set<
    Listener<ValueReadResult>
  >();

  private readonly commandWrittenListeners = new Set<
    Listener<{ ok: boolean }>
  >();

  private readonly transferStartListeners = new Set<
    Listener<TransferStartEvent>
  >();

  private readonly transferProgressListeners = new Set<
    Listener<TransferProgressEvent>
  >();

  private readonly transferEndListeners = new Set<
    Listener<TransferEndEvent>
  >();

  private readonly transferErrorListeners = new Set<
    Listener<TransferErrorEvent>
  >();

  async checkPermissions(): Promise<BluetoothPermissionResult> {
    return {
      bluetoothScan: "granted",
      bluetoothConnect: "granted",
      location: "granted",
    };
  }

  async requestPermissions(): Promise<BluetoothPermissionResult> {
    this.emitLog("Permessi Bluetooth simulati concessi");

    return {
      bluetoothScan: "granted",
      bluetoothConnect: "granted",
      location: "granted",
    };
  }

  async startScan(): Promise<void> {
    if (this.connected) {
      throw new Error("Il dispositivo simulato è già connesso");
    }

    if (this.scanning) {
      return;
    }

    this.scanning = true;
    this.emitLog("Scansione BLE simulata avviata");
    this.emitLog("Ricerca dispositivo SAFE_A_01...");

    this.scanTimer = setTimeout(() => {
      this.scanning = false;
      this.connected = true;

      this.emitLog("Dispositivo SAFE_A_01 trovato");
      this.emitLog("Connessione simulata completata");

      this.connectedListeners.forEach((listener) => listener());
    }, 1500);
  }

  async stopScan(): Promise<void> {
    this.scanning = false;

    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }

    this.emitLog("Scansione simulata arrestata");
  }

  async disconnectAndClose(): Promise<void> {
    await this.stopScan();

    if (!this.connected) {
      return;
    }

    this.connected = false;
    this.emitLog("Dispositivo simulato disconnesso");

    this.disconnectedListeners.forEach((listener) => listener());
  }

  async sendStartSession(): Promise<void> {
    this.assertConnected();

    await delay(300);

    this.commandWrittenListeners.forEach((listener) =>
      listener({ ok: true })
    );

    this.emitLog("Comando START_SESSION simulato");

    const syntheticValues: ValueReadResult[] = [
      {
        uuid: "SAFE_A_01",
        valueText: JSON.stringify({
          rssi: -48,
          latitude: SENSORS.SAFE_A_01.latitude,
          longitude: SENSORS.SAFE_A_01.longitude,
        }),
      },
      {
        uuid: "SAFE_A_02",
        valueText: JSON.stringify({
          rssi: -62,
          latitude: SENSORS.SAFE_A_02.latitude,
          longitude: SENSORS.SAFE_A_02.longitude,
        }),
      },
      {
        uuid: "SAFE_A_03",
        valueText: JSON.stringify({
          rssi: -75,
          latitude: SENSORS.SAFE_A_03.latitude,
          longitude: SENSORS.SAFE_A_03.longitude,
        }),
      },
    ];

    syntheticValues.forEach((value, index) => {
      setTimeout(() => {
        if (!this.connected) {
          return;
        }

        this.valueReadListeners.forEach((listener) =>
          listener(value)
        );
      }, 500 * (index + 1));
    });
  }

  async sendStopSession(): Promise<void> {
    this.assertConnected();

    await delay(300);

    this.commandWrittenListeners.forEach((listener) =>
      listener({ ok: true })
    );

    this.emitLog("Comando STOP_SESSION simulato");
  }

  async getSessionList(): Promise<GetJsonResult> {
    this.assertConnected();

    const json = JSON.stringify({
      sessions: [
        {
          session_id: 1,
          started_at: "2026-05-29T10:00:00",
          samples: 15,
        },
        {
          session_id: 2,
          started_at: "2026-05-29T11:00:00",
          samples: 20,
        },
      ],
    });

    await this.simulateTransfer("sessionList", 0, json);

    return {
      json,
      kind: "session_list",
    };
  }

async getSession(
  sessionNumber: number
): Promise<GetJsonResult> {
  this.assertConnected();

  const safeA01Point1 = offsetMeters(
    SENSORS.SAFE_A_01,
    -3,
    -3
  );

  const safeA01Point2 = offsetMeters(
    SENSORS.SAFE_A_01,
    3,
    3
  );

  const safeA02Point1 = offsetMeters(
    SENSORS.SAFE_A_02,
    -3,
    3
  );

  const safeA02Point2 = offsetMeters(
    SENSORS.SAFE_A_02,
    3,
    -3
  );

  const safeA03Point1 = offsetMeters(
    SENSORS.SAFE_A_03,
    -3,
    0
  );

  const safeA03Point2 = offsetMeters(
    SENSORS.SAFE_A_03,
    3,
    0
  );

  const json = JSON.stringify({
    session_id: sessionNumber,
    kind: "sampling",

    measurements: [
      {
        DEVICE_ID: "SAFE_A_01",
        RSSI: -45,
        LATITUDE: safeA01Point1.latitude,
        LONGITUDE: safeA01Point1.longitude,
        EVENT_TIME: "2026-05-29T10:00:00",
      },
      {
        DEVICE_ID: "SAFE_A_01",
        RSSI: -65,
        LATITUDE: safeA01Point2.latitude,
        LONGITUDE: safeA01Point2.longitude,
        EVENT_TIME: "2026-05-29T10:01:00",
      },

      {
        DEVICE_ID: "SAFE_A_02",
        RSSI: -50,
        LATITUDE: safeA02Point1.latitude,
        LONGITUDE: safeA02Point1.longitude,
        EVENT_TIME: "2026-05-29T10:02:00",
      },
      {
        DEVICE_ID: "SAFE_A_02",
        RSSI: -72,
        LATITUDE: safeA02Point2.latitude,
        LONGITUDE: safeA02Point2.longitude,
        EVENT_TIME: "2026-05-29T10:03:00",
      },

      {
        DEVICE_ID: "SAFE_A_03",
        RSSI: -55,
        LATITUDE: safeA03Point1.latitude,
        LONGITUDE: safeA03Point1.longitude,
        EVENT_TIME: "2026-05-29T10:04:00",
      },
      {
        DEVICE_ID: "SAFE_A_03",
        RSSI: -80,
        LATITUDE: safeA03Point2.latitude,
        LONGITUDE: safeA03Point2.longitude,
        EVENT_TIME: "2026-05-29T10:05:00",
      },
    ],
  });

  await this.simulateTransfer(
    "session",
    sessionNumber,
    json
  );

  return {
    json,
    session_id: sessionNumber,
    kind: "sampling",
  };
}

  async onLogUpdate(
    listener: Listener<{ log: string }>
  ): Promise<PluginListenerHandle> {
    return this.addListener(this.logListeners, listener);
  }

  async onConnected(
    listener: () => void
  ): Promise<PluginListenerHandle> {
    this.connectedListeners.add(listener);

    return this.createRemoveHandle(() => {
      this.connectedListeners.delete(listener);
    });
  }

  async onDisconnected(
    listener: () => void
  ): Promise<PluginListenerHandle> {
    this.disconnectedListeners.add(listener);

    return this.createRemoveHandle(() => {
      this.disconnectedListeners.delete(listener);
    });
  }

  async onValueRead(
    listener: Listener<ValueReadResult>
  ): Promise<PluginListenerHandle> {
    return this.addListener(this.valueReadListeners, listener);
  }

  async onCommandWritten(
    listener: Listener<{ ok: boolean }>
  ): Promise<PluginListenerHandle> {
    return this.addListener(
      this.commandWrittenListeners,
      listener
    );
  }

  async onTransferStart(
    listener: Listener<TransferStartEvent>
  ): Promise<PluginListenerHandle> {
    return this.addListener(
      this.transferStartListeners,
      listener
    );
  }

  async onTransferProgress(
    listener: Listener<TransferProgressEvent>
  ): Promise<PluginListenerHandle> {
    return this.addListener(
      this.transferProgressListeners,
      listener
    );
  }

  async onTransferEnd(
    listener: Listener<TransferEndEvent>
  ): Promise<PluginListenerHandle> {
    return this.addListener(
      this.transferEndListeners,
      listener
    );
  }

  async onTransferError(
    listener: Listener<TransferErrorEvent>
  ): Promise<PluginListenerHandle> {
    return this.addListener(
      this.transferErrorListeners,
      listener
    );
  }

  private assertConnected(): void {
    if (!this.connected) {
      throw new Error("Nessun dispositivo Bluetooth connesso");
    }
  }

  private emitLog(log: string): void {
    this.logListeners.forEach((listener) => listener({ log }));
  }

  private async simulateTransfer(
    requestType: string,
    sessionId: number,
    content: string
  ): Promise<void> {
    const totalSize = new TextEncoder().encode(content).length;
    const expectedChunks = 10;

    const startEvent: TransferStartEvent = {
      requestType,
      session_id: sessionId,
      total_size: totalSize,
      expected_chunks: expectedChunks,
    };

    this.transferStartListeners.forEach((listener) =>
      listener(startEvent)
    );

    for (let chunk = 1; chunk <= expectedChunks; chunk += 1) {
      await delay(150);

      if (!this.connected) {
        const errorEvent: TransferErrorEvent = {
          requestType,
          session_id: sessionId,
          reason: "Dispositivo disconnesso durante il trasferimento",
        };

        this.transferErrorListeners.forEach((listener) =>
          listener(errorEvent)
        );

        throw new Error(errorEvent.reason);
      }

      const receivedBytes = Math.min(
        totalSize,
        Math.ceil((totalSize / expectedChunks) * chunk)
      );

      const progressEvent: TransferProgressEvent = {
        requestType,
        session_id: sessionId,
        receivedBytes,
        total_size: totalSize,
      };

      this.transferProgressListeners.forEach((listener) =>
        listener(progressEvent)
      );
    }

    const endEvent: TransferEndEvent = {
      requestType,
      session_id: sessionId,
    };

    this.transferEndListeners.forEach((listener) =>
      listener(endEvent)
    );
  }

  private async addListener<T>(
    listeners: Set<Listener<T>>,
    listener: Listener<T>
  ): Promise<PluginListenerHandle> {
    listeners.add(listener);

    return this.createRemoveHandle(() => {
      listeners.delete(listener);
    });
  }

  private createRemoveHandle(
    removeListener: () => void
  ): PluginListenerHandle {
    return {
      remove: async () => {
        removeListener();
      },
    };
  }
}

export const mockBluetoothRepository =
  new MockBluetoothRepository();