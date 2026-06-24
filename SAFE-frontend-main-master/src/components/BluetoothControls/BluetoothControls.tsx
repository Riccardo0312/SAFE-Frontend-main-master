import React from 'react';
import{IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonInput, IonProgressBar, IonItem, IonLabel, IonRow, IonGrid, IonCol, IonPage, IonTitle, IonHeader, IonToolbar} from "@ionic/react";
import { useBluetooth } from "../../providers/BluetoothProvider";
import "./BluetoothControls.css";

type RemoveHandle = { remove: () => Promise<void> | void };

export default function BluetoothControls() {
   const {
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

      startScan: handleStartScan,
      stopScan: handleStopScan,
      disconnect: handleDisconnect,
      startSession: handleStartSession,
      stopSession: handleStopSession,
      readSessionList: handleReadList,
      getSession: handleGetSession,
    } = useBluetooth();

  // ---------- UI ----------
return (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Controller Bluetooth</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent
      className="bluetooth-controls"
      scrollY={true}
    >
      <div className="bluetooth-controls__content">
      {/* STATUS */}
      <IonCard className="bluetooth-controls__card">
        <IonCardHeader>
          <IonCardTitle>BLE Controller</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4" className="bluetooth-controls__status-text">
                <b>Connessione:</b>{" "}
                {isConnected ? "🟢 Connesso" : "🔴 Non connesso"}
              </IonCol>

              <IonCol size="12" sizeMd="4" className="bluetooth-controls__status-text">
                <b>Scan:</b>{" "}
                {isScanning ? "🔍 in corso" : "💤 fermo"}
              </IonCol>

              <IonCol size="12" sizeMd="4" className="bluetooth-controls__status-text">
                <b>Last write:</b>{" "}
                {lastWriteOk === null ? "—" : lastWriteOk ? "✅ OK" : "❌ ERR"}
              </IonCol>
            </IonRow>
          </IonGrid>

          {transferActive && (
            <div className="bluetooth-controls__transfer-active">
              ⬇️ Download in corso…
            </div>
          )}

          <div className="bluetooth-controls__transfer-box">
            <div className="bluetooth-controls__transfer-title">
              <b>Transfer:</b> {transferLabel}
              {transferSessionId !== null && ` (session_id=${transferSessionId})`}
            </div>

            <IonProgressBar value={transferActive ? transferPct / 100 : 0} />

            <div className="bluetooth-controls__transfer-details">
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
      <IonCard className="bluetooth-controls__card">
        <IonCardHeader>
          <IonCardTitle>Azioni</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <IonButton
                  expand="block"
                  onClick={handleStartScan}
                  disabled={!canConnect}
                >
                  🔍 Avvia scan & connetti
                </IonButton>
              </IonCol>

              <IonCol size="12" sizeMd="4">
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={handleStopScan}
                  disabled={!canStopScan}
                >
                  🛑 Stop scan
                </IonButton>
              </IonCol>

              <IonCol size="12" sizeMd="4">
                <IonButton
                  expand="block"
                  color="warning"
                  onClick={handleDisconnect}
                  disabled={!canDisconnect}
                >
                  🔌 Disconnetti
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <IonButton
                  expand="block"
                  onClick={handleStartSession}
                  disabled={!canSendCmd}
                >
                  ▶️ Avvia sessione
                </IonButton>
              </IonCol>

              <IonCol size="12" sizeMd="4">
                <IonButton
                  expand="block"
                  onClick={handleStopSession}
                  disabled={!canSendCmd}
                >
                  ⏹️ Ferma sessione
                </IonButton>
              </IonCol>

              <IonCol size="12" sizeMd="4">
                <IonButton
                  expand="block"
                  onClick={handleReadList}
                  disabled={!canSendCmd}
                >
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
                <IonButton expand="block" fill="outline" onClick={clearLogs}>
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

          <div className="bluetooth-controls__help-text">
            Durante un download i comandi vengono disabilitati per evitare sovrapposizioni.
          </div>
        </IonCardContent>
      </IonCard>

      {/* OUTPUT */}
      <IonCard className="bluetooth-controls__card">
        <IonCardHeader>
          <IonCardTitle>Output</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonItem>
            <IonLabel>
              <b>Session List JSON</b>
              <pre className="bluetooth-controls__pre">
                {sessionListJson || "—"}
              </pre>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <b>Session JSON</b>
              <pre className="bluetooth-controls__pre">
                {sessionJson || "—"}
              </pre>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <b>Valori letti ({values.length})</b>
              <pre className="bluetooth-controls__pre">
                {values.length > 0
                  ? values
                      .map(
                        (v: any, i: number) =>
                          `${i + 1}. ${v.uuid}\n↳ ${v.valueText}`
                      )
                      .join("\n\n")
                  : "—"}
              </pre>
            </IonLabel>
          </IonItem>
        </IonCardContent>
      </IonCard>

      {/* LOGS */}
      <IonCard className="bluetooth-controls__card">
        <IonCardHeader>
          <IonCardTitle>Logs</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <pre className="bluetooth-controls__pre bluetooth-controls__logs">
            {logs.join("\n") || "—"}
          </pre>
        </IonCardContent>
      </IonCard>
      </div>
    </IonContent>
  </IonPage>
);
}
