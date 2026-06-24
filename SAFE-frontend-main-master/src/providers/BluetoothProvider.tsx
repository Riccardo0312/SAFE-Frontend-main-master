import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PluginListenerHandle } from "@capacitor/core";
import { bluetoothGateway } from "../repositories/BluetoothRepositoryFactory";
import type {
  TransferStartEvent,
  TransferProgressEvent,
  TransferEndEvent,
  TransferErrorEvent,
  ValueReadResult,
} from "../plugins/bluetooth-ble";

import {
  SensorsContext,
} from "./SensorsProvider";

import type {
  ContextSensorsType,
} from "./types";

import {
  samplingRepository,
} from "../repositories/SamplingRepository";

type RemoveHandle = { remove: () => Promise<void> | void };

export type BluetoothContextType = {
  isScanning: boolean;
  isConnected: boolean;
  logs: string[];
  values: ValueReadResult[];
  lastWriteOk: boolean | null;

  sessionListJson: string;
  sessionNumber: number;
  sessionJson: string;

  transferActive: boolean;
  transferLabel: string;
  transferSessionId: number | null;
  transferReceived: number;
  transferTotal: number;
  transferError: string;
  transferPct: number;

  isBusy: boolean;
  canConnect: boolean;
  canStopScan: boolean;
  canDisconnect: boolean;
  canSendCmd: boolean;

  setSessionNumber: (value: number) => void;

  clearLogs: () => void;
  clearOutput: () => void;

  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  disconnect: () => Promise<void>;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  readSessionList: () => Promise<void>;
  getSession: () => Promise<void>;
};

const BluetoothContext = createContext<BluetoothContextType | undefined>(
  undefined
);

function prettyJson(raw: string): string {
  try {
    const obj = JSON.parse(raw);
    return JSON.stringify(obj, null, 2);
  } catch {
    return raw;
  }
}

export const useBluetooth = (): BluetoothContextType => {
  const context = useContext(BluetoothContext);

  if (!context) {
    throw new Error("useBluetooth must be used inside BluetoothProvider");
  }

  return context;
};

const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [logs, setLogs] = useState<string[]>([]);
  const [values, setValues] = useState<ValueReadResult[]>([]);
  const [lastWriteOk, setLastWriteOk] = useState<boolean | null>(null);

  const [sessionListJson, setSessionListJson] = useState("");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionJson, setSessionJson] = useState("");

  const [transferActive, setTransferActive] = useState(false);
  const [transferLabel, setTransferLabel] = useState("—");
  const [transferSessionId, setTransferSessionId] = useState<number | null>(
    null
  );
  const [transferReceived, setTransferReceived] = useState(0);
  const [transferTotal, setTransferTotal] = useState(0);
  const [transferError, setTransferError] = useState("");

  const removeHandlesRef = useRef<RemoveHandle[]>([]);

  const {
    refreshSensorsFromSampling,
  } = useContext(
    SensorsContext
  ) as ContextSensorsType;

  const pushLog = useCallback((line: string) => {
    setLogs((prev) => {
      const next = [...prev, line];
      return next.length > 250 ? next.slice(next.length - 250) : next;
    });
  }, []);

  const pushValue = useCallback((value: ValueReadResult) => {
    setValues((prev) => {
      const next = [...prev, value];
      return next.length > 250 ? next.slice(next.length - 250) : next;
    });
  }, []);

  const transferPct = useMemo(() => {
    if (!transferActive || transferTotal <= 0) {
      return 0;
    }

    const pct = Math.floor((transferReceived / transferTotal) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [transferActive, transferReceived, transferTotal]);

  const isBusy = transferActive;
  const canConnect = !isConnected && !isScanning;
  const canStopScan = isScanning;
  const canDisconnect = isConnected;
  const canSendCmd = isConnected && !isBusy;

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const clearOutput = useCallback(() => {
    setValues([]);
    setSessionListJson("");
    setSessionJson("");

    setTransferActive(false);
    setTransferLabel("—");
    setTransferSessionId(null);
    setTransferReceived(0);
    setTransferTotal(0);
    setTransferError("");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const setupListeners = async () => {
      try {
        const handles: PluginListenerHandle[] = [];

        handles.push(
          await bluetoothGateway.onLogUpdate((data : { log: string }) => {
            if (!cancelled) {
              pushLog(data.log);
            }
          })
        );

        handles.push(
          await bluetoothGateway.onConnected(() => {
            if (cancelled) {
              return;
            }

            setIsConnected(true);
            setIsScanning(false);
            pushLog("Connesso");
          })
        );

        handles.push(
          await bluetoothGateway.onDisconnected(() => {
            if (cancelled) {
              return;
            }

            setIsConnected(false);
            setIsScanning(false);
            setTransferActive(false);
            pushLog("Disconnesso");
          })
        );

        handles.push(
          await bluetoothGateway.onValueRead((data: ValueReadResult) => {
            if (!cancelled) {
              setValues((previous) => [...previous, data]);
            }
          })
        );

        handles.push(
          await bluetoothGateway.onCommandWritten(
            (data: { ok: boolean }) => {
              if (!cancelled) {
                setLastWriteOk(data.ok);
              }
            }
          )
        );

        handles.push(
          await bluetoothGateway.onTransferStart(
            (data: TransferStartEvent) => {
              if (!cancelled) {
                setTransferActive(true);
                setTransferLabel(data.requestType);
                setTransferSessionId(data.session_id);
                setTransferReceived(0);
                setTransferTotal(data.total_size);
                setTransferError("");
              }
            }
          )
        );

        handles.push(
          await bluetoothGateway.onTransferProgress(
            (data: TransferProgressEvent) => {
              if (!cancelled) {
                setTransferReceived(data.receivedBytes);
                setTransferTotal(data.total_size);
              }
            }
          )
        );

        handles.push(
          await bluetoothGateway.onTransferEnd(
            (data: TransferEndEvent) => {
              if (!cancelled) {
                setTransferActive(false);
                pushLog(
                  `Trasferimento completato: ${data.requestType}, sessione ${data.session_id}`
                );
              }
            }
          )
        );

        handles.push(
          await bluetoothGateway.onTransferError(
            (data: TransferErrorEvent) => {
              if (!cancelled) {
                setTransferActive(false);
                setTransferError(data.reason);
                pushLog(`Errore trasferimento: ${data.reason}`);
              }
            }
          )
        );

        removeHandlesRef.current = handles;
      } catch (error) {
        pushLog(`Errore setup listener: ${String(error)}`);
      }
    };

    void setupListeners();

    return () => {
      cancelled = true;

      const handles = removeHandlesRef.current;
      removeHandlesRef.current = [];

      Promise.all(handles.map((handle) => handle.remove())).catch(() => {});
    };
  }, [pushLog, pushValue]);

  const startScan = useCallback(async () => {
    try {
      await bluetoothGateway.startScan();

      setIsScanning(true);
      pushLog("Scan avviato");
    } catch (error) {
      pushLog(`Errore scan: ${String(error)}`);
    }
  }, [pushLog]);

  const stopScan = useCallback(async () => {
    try {
      await bluetoothGateway.stopScan();

      setIsScanning(false);
      pushLog("Scan fermato");
    } catch (error) {
      pushLog(`Errore stop scan: ${String(error)}`);
    }
  }, [pushLog]);

  const disconnect = useCallback(async () => {
    try {
      await bluetoothGateway.disconnectAndClose();

      setIsConnected(false);
      setIsScanning(false);
      setTransferActive(false);

      pushLog("Disconnessione richiesta (disconnectAndClose)");
    } catch (error) {
      pushLog(`Errore disconnect: ${String(error)}`);
    }
  }, [pushLog]);

  const startSession = useCallback(async () => {
    try {
      await bluetoothGateway.sendStartSession();

      pushLog("StartSession inviato");
    } catch (error) {
      pushLog(`Errore StartSession: ${String(error)}`);
    }
  }, [pushLog]);

  const stopSession = useCallback(async () => {
    try {
      await bluetoothGateway.sendStopSession();

      pushLog("StopSession inviato");
    } catch (error) {
      pushLog(`Errore StopSession: ${String(error)}`);
    }
  }, [pushLog]);

  const readSessionList = useCallback(async () => {
    try {
      setTransferError("");
      pushLog("Richiedo lista sessioni…");

      const result = await bluetoothGateway.getSessionList();

      setSessionListJson(prettyJson(result.json));
      pushLog("Lista sessioni ricevuta");
    } catch (error) {
      pushLog(`Errore getSessionList: ${String(error)}`);
    }
  }, [pushLog]);

  const getSession = useCallback(async () => {
    if (!Number.isInteger(sessionNumber) || sessionNumber <= 0) {
      const message = "Inserire un Session ID valido maggiore di zero";

      setTransferError(message);
      pushLog(message);

      return;
    }

    try {
      setTransferError("");

      pushLog(`Scarico sessione #${sessionNumber}…`);

      /*
       * Questo metodo usa automaticamente:
       *
       * - MockBluetoothRepository, se REACT_APP_BLE_MOCK=true
       * - BluetoothRepository reale, se REACT_APP_BLE_MOCK=false
       */
      const result = await bluetoothGateway.getSession(sessionNumber);

      /*
       * Mostra il JSON ricevuto nel Controller Bluetooth.
       */
      setSessionJson(prettyJson(result.json));

      /*
       * Converte il JSON della sessione nel formato sampling
       * e lo salva nello storage locale.
       */
      const measurements =
        await samplingRepository.saveSessionJson(result.json);

      /*
       * Rilegge i dati salvati e aggiorna la lista dei sensori
       * utilizzata dalla mappa e dalle heatmap.
       */
      await refreshSensorsFromSampling();

      pushLog(
        `Sessione #${sessionNumber} ricevuta e salvata`
      );

      pushLog(
        `${measurements.length} misurazioni importate`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      setTransferError(message);

      pushLog(
        `Errore download sessione #${sessionNumber}: ${message}`
      );
    }
  }, [
    pushLog,
    sessionNumber,
    refreshSensorsFromSampling,
  ]);

  return (
    <BluetoothContext.Provider
      value={{
        isScanning,
        isConnected,
        logs,
        values,
        lastWriteOk,

        sessionListJson,
        sessionNumber,
        sessionJson,

        transferActive,
        transferLabel,
        transferSessionId,
        transferReceived,
        transferTotal,
        transferError,
        transferPct,

        isBusy,
        canConnect,
        canStopScan,
        canDisconnect,
        canSendCmd,

        setSessionNumber,

        clearLogs,
        clearOutput,

        startScan,
        stopScan,
        disconnect,
        startSession,
        stopSession,
        readSessionList,
        getSession,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export default BluetoothProvider;