import React, { useEffect, useMemo, useRef, useState } from 'react';
import{IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonInput, IonProgressBar, IonItem, IonLabel, IonRow, IonGrid, IonCol, IonPage, IonTitle, IonHeader, IonToolbar} from "@ionic/react";
import BluetoothBLE, {
  ValueReadResult,
  TransferStartEvent,
  TransferProgressEvent,
  TransferEndEvent,
  TransferErrorEvent,
} from '../../plugins/bluetooth-ble';

type RemoveHandle = { remove: () => Promise<void> | void };

export default function BluetoothControls() {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [logs, setLogs] = useState<string[]>([]);
  const [values, setValues] = useState<ValueReadResult[]>([]);
  const [lastWriteOk, setLastWriteOk] = useState<boolean | null>(null);

  const [sessionListJson, setSessionListJson] = useState<string>('');
  const [sessionNumber, setSessionNumber] = useState<number>(0);
  const [sessionJson, setSessionJson] = useState<string>('');

  // Transfer UI state
  const [transferActive, setTransferActive] = useState(false);
  const [transferLabel, setTransferLabel] = useState<string>('—');
  const [transferSessionId, setTransferSessionId] = useState<number | null>(null);
  const [transferReceived, setTransferReceived] = useState<number>(0);
  const [transferTotal, setTransferTotal] = useState<number>(0);
  const [transferError, setTransferError] = useState<string>('');

  const removeHandlesRef = useRef<RemoveHandle[]>([]);

  // ---------- Styles ----------
  const containerStyle: React.CSSProperties = {
    padding: 16,
    fontFamily: 'sans-serif',
    maxWidth: 1100,
    margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    padding: 12,
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    marginBottom: 12,
  };

  const sectionTitleStyle: React.CSSProperties = {
    margin: '0 0 10px 0',
    fontSize: 14,
    fontWeight: 700,
    color: '#222',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    border: '1px solid #ddd',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: '#fff',
  };

  const preStyle: React.CSSProperties = {
    height: 260,
    overflow: 'auto',
    border: '1px solid #ddd',
    padding: 10,
    background: '#fafafa',
    fontSize: 12,
    borderRadius: 10,
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const smallText: React.CSSProperties = { fontSize: 12, color: '#666' };

  // ---------- Helpers ----------
  const pushLog = (line: string) => {
    setLogs((prev) => {
      const next = [...prev, line];
      return next.length > 250 ? next.slice(next.length - 250) : next;
    });
  };

  const pushValue = (v: ValueReadResult) => {
    setValues((prev) => {
      const next = [...prev, v];
      return next.length > 250 ? next.slice(next.length - 250) : next;
    });
  };

  const prettyJson = (raw: string) => {
    try {
      const obj = JSON.parse(raw);
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  };

  const transferPct = useMemo(() => {
    if (!transferActive || transferTotal <= 0) return 0;
    const pct = Math.floor((transferReceived / transferTotal) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [transferActive, transferReceived, transferTotal]);

  // Disabilita comandi mentre stai scaricando per evitare overlap
  const isBusy = transferActive;

  const canConnect = !isConnected && !isScanning;
  const canStopScan = isScanning;
  const canDisconnect = isConnected;

  const canSendCmd = isConnected && !isBusy;

  const clearOutput = () => {
    setValues([]);
    setSessionListJson('');
    setSessionJson('');

    setTransferActive(false);
    setTransferLabel('—');
    setTransferSessionId(null);
    setTransferReceived(0);
    setTransferTotal(0);
    setTransferError('');
  };

  // ---------- Listeners ----------
  useEffect(() => {
    let cancelled = false;

    const setupListeners = async () => {
      try {
        const handles: RemoveHandle[] = [];

        handles.push(
          await BluetoothBLE.addListener('logUpdate', (data: { log: string }) => {
            if (!cancelled) pushLog(data.log);
          })
        );

        handles.push(
          await BluetoothBLE.addListener('onConnected', () => {
            if (cancelled) return;
            setIsConnected(true);
            setIsScanning(false);
            pushLog('Connesso');
          })
        );

        handles.push(
          await BluetoothBLE.addListener('onDisconnected', () => {
            if (cancelled) return;
            setIsConnected(false);
            setIsScanning(false);
            setTransferActive(false);
            pushLog('Disconnesso');
          })
        );

        handles.push(
          await BluetoothBLE.addListener('onValueRead', (data: ValueReadResult) => {
            if (cancelled) return;
            pushValue(data);
            pushLog(`ValueRead: ${data.uuid} = ${data.valueText}`);
          })
        );

        handles.push(
          await BluetoothBLE.addListener('onCommandWritten', (data: { ok: boolean }) => {
            if (cancelled) return;
            setLastWriteOk(data.ok);
            pushLog(`CommandWritten ok=${data.ok}`);
          })
        );

        // --- Streaming events ---
        handles.push(
          await BluetoothBLE.addListener('transferStart', (e: TransferStartEvent) => {
            if (cancelled) return;
            setTransferActive(true);
            setTransferError('');
            setTransferLabel(e.requestType);
            setTransferSessionId(e.session_id);
            setTransferReceived(0);
            setTransferTotal(e.total_size);
            pushLog(
              `TRANSFER_START ${e.requestType} session_id=${e.session_id} total=${e.total_size} chunks=${e.expected_chunks}`
            );
          })
        );

        handles.push(
          await BluetoothBLE.addListener('transferProgress', (e: TransferProgressEvent) => {
            if (cancelled) return;
            setTransferReceived(e.receivedBytes);
            setTransferTotal(e.total_size);
          })
        );

        handles.push(
          await BluetoothBLE.addListener('transferEnd', (e: TransferEndEvent) => {
            if (cancelled) return;
            // forza progress a 100% se il native non l'ha già fatto
            setTransferReceived((prev) => (transferTotal > 0 ? transferTotal : prev));
            setTransferActive(false);
            pushLog(`TRANSFER_END ${e.requestType} session_id=${e.session_id}`);
          })
        );

        handles.push(
          await BluetoothBLE.addListener('transferError', (e: TransferErrorEvent) => {
            if (cancelled) return;
            setTransferActive(false);
            setTransferError(e.reason || 'Errore trasferimento');
            pushLog(`TRANSFER_ERROR ${e.requestType} session_id=${e.session_id} reason=${e.reason}`);
          })
        );

        removeHandlesRef.current = handles.filter(Boolean) as RemoveHandle[];
      } catch (e) {
        pushLog(`Errore setup listener: ${String(e)}`);
      }
    };

    setupListeners();

    return () => {
      cancelled = true;
      const handles = removeHandlesRef.current;
      removeHandlesRef.current = [];
      Promise.all(handles.map((h) => Promise.resolve(h?.remove?.()))).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Handlers ----------
  const handleStartScan = async () => {
    try {
      await BluetoothBLE.startScan();
      setIsScanning(true);
      pushLog('Scan avviato');
    } catch (e) {
      pushLog(`Errore scan: ${String(e)}`);
    }
  };

  const handleStopScan = async () => {
    try {
      await BluetoothBLE.stopScan();
      setIsScanning(false);
      pushLog('Scan fermato');
    } catch (e) {
      pushLog(`Errore stop scan: ${String(e)}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await BluetoothBLE.disconnectAndClose();
      setIsConnected(false);
      setIsScanning(false);
      setTransferActive(false);
      pushLog('Disconnessione richiesta (disconnectAndClose)');
    } catch (e) {
      pushLog(`Errore disconnect: ${String(e)}`);
    }
  };

  const handleStartSession = async () => {
    try {
      await BluetoothBLE.sendStartSession();
      pushLog('StartSession inviato');
    } catch (e) {
      pushLog(`Errore StartSession: ${String(e)}`);
    }
  };

  const handleStopSession = async () => {
    try {
      await BluetoothBLE.sendStopSession();
      pushLog('StopSession inviato');
    } catch (e) {
      pushLog(`Errore StopSession: ${String(e)}`);
    }
  };

  const handleReadList = async () => {
    try {
      setTransferError('');
      pushLog('Richiedo lista sessioni…');
      const res = await BluetoothBLE.getSessionList();
      setSessionListJson(prettyJson(res.json));
      pushLog('Lista sessioni ricevuta');
    } catch (e) {
      pushLog(`Errore getSessionList: ${String(e)}`);
    }
  };

  const handleGetSession = async () => {
    try {
      setTransferError('');
      pushLog(`Scarico sessione #${sessionNumber}…`);
      const res = await BluetoothBLE.getSession({ sessionNumber });
      setSessionJson(prettyJson(res.json));
      pushLog(`Sessione #${sessionNumber} ricevuta`);
    } catch (e) {
      pushLog(`Errore getSession: ${String(e)}`);
    }
  };

  // ---------- UI ----------
  return (
      <IonPage>
     <IonHeader>
         <IonToolbar>
           <IonTitle>Controller Bluetooth</IonTitle>
         </IonToolbar>
       </IonHeader>
      <IonContent className="ion-padding" fullscreen>

        {/* STATUS */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>BLE Controller</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4">
                  <b>Connessione:</b> {isConnected ? "🟢 Connesso" : "🔴 Non connesso"}
                </IonCol>

                <IonCol size="12" sizeMd="4">
                  <b>Scan:</b> {isScanning ? "🔍 in corso" : "💤 fermo"}
                </IonCol>

                <IonCol size="12" sizeMd="4">
                  <b>Last write:</b>{" "}
                  {lastWriteOk === null ? "—" : lastWriteOk ? "✅ OK" : "❌ ERR"}
                </IonCol>
              </IonRow>
            </IonGrid>

            {transferActive && (
              <div style={{ marginTop: 10, fontWeight: 600 }}>
                ⬇️ Download in corso…
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <div style={{ marginBottom: 6 }}>
                <b>Transfer:</b> {transferLabel}
                {transferSessionId !== null && ` (session_id=${transferSessionId})`}
              </div>

              <IonProgressBar value={transferActive ? transferPct / 100 : 0} />

              <div style={{ marginTop: 6, fontSize: 12 }}>
                {transferActive
                  ? `${transferReceived}/${transferTotal} bytes • ${transferPct}%`
                  : transferError
                  ? `❌ ${transferError}`
                  : "—"}
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* AZIONI */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Azioni</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>

            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4">
                  <IonButton expand="block" onClick={handleStartScan} disabled={!canConnect}>
                    🔍 Avvia scan & connetti
                  </IonButton>
                </IonCol>

                <IonCol size="12" sizeMd="4">
                  <IonButton expand="block" color="danger" onClick={handleStopScan} disabled={!canStopScan}>
                    🛑 Stop scan
                  </IonButton>
                </IonCol>

                <IonCol size="12" sizeMd="4">
                  <IonButton expand="block" color="warning" onClick={handleDisconnect} disabled={!canDisconnect}>
                    🔌 Disconnetti
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4">
                  <IonButton expand="block" onClick={handleStartSession} disabled={!canSendCmd}>
                    ▶️ Avvia sessione
                  </IonButton>
                </IonCol>

                <IonCol size="12" sizeMd="4">
                  <IonButton expand="block" onClick={handleStopSession} disabled={!canSendCmd}>
                    ⏹️ Ferma sessione
                  </IonButton>
                </IonCol>

                <IonCol size="12" sizeMd="4">
                  <IonButton expand="block" onClick={handleReadList} disabled={!canSendCmd}>
                    📖 Lista sessioni
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonItem>
              <IonLabel position="stacked">Session ID</IonLabel>
              <IonInput
                type="number"
                value={sessionNumber}
                disabled={!isConnected || isBusy}
                onIonChange={(e) => setSessionNumber(Number(e.detail.value))}
              />
            </IonItem>

            <IonButton
              expand="block"
              onClick={handleGetSession}
              disabled={!canSendCmd}
            >
              ⬇️ Scarica sessione
            </IonButton>

            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" fill="outline" onClick={() => setLogs([])}>
                    🧹 Clear logs
                  </IonButton>
                </IonCol>

                <IonCol>
                  <IonButton expand="block" fill="outline" onClick={clearOutput}>
                    🧽 Clear output
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            <div style={{ marginTop: 10, fontSize: 12 }}>
              Durante un download i comandi vengono disabilitati per evitare sovrapposizioni.
            </div>

          </IonCardContent>
        </IonCard>

        {/* OUTPUT */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Output</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>

            <IonItem>
              <IonLabel>
                <b>Session List JSON</b>
                <pre>{sessionListJson || "—"}</pre>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <b>Session JSON</b>
                <pre>{sessionJson || "—"}</pre>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>
                <b>Valori letti ({values.length})</b>
                <pre>
                  {values.length > 0
                    ? values
                        .map((v: any, i: number) => `${i + 1}. ${v.uuid}\n↳ ${v.valueText}`)
                        .join("\n\n")
                    : "—"}
                </pre>
              </IonLabel>
            </IonItem>

          </IonCardContent>
        </IonCard>

        {/* LOGS */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Logs</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            <pre>{logs.join("\n") || "—"}</pre>
          </IonCardContent>
        </IonCard>
      </IonContent>
     </IonPage>
    );
}
