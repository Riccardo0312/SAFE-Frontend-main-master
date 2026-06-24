import type { PluginListenerHandle } from "@capacitor/core";

import type {
  BluetoothPermissionResult,
  GetJsonResult,
  TransferEndEvent,
  TransferErrorEvent,
  TransferProgressEvent,
  TransferStartEvent,
  ValueReadResult,
} from "../plugins/bluetooth-ble";

export interface BluetoothRepositoryContract {
  checkPermissions(): Promise<BluetoothPermissionResult>;

  requestPermissions(): Promise<BluetoothPermissionResult>;

  startScan(): Promise<void>;

  stopScan(): Promise<void>;

  disconnectAndClose(): Promise<void>;

  sendStartSession(): Promise<void>;

  sendStopSession(): Promise<void>;

  getSessionList(): Promise<GetJsonResult>;

  getSession(sessionNumber: number): Promise<GetJsonResult>;

  onLogUpdate(
    listener: (data: { log: string }) => void
  ): Promise<PluginListenerHandle>;

  onConnected(
    listener: () => void
  ): Promise<PluginListenerHandle>;

  onDisconnected(
    listener: () => void
  ): Promise<PluginListenerHandle>;

  onValueRead(
    listener: (data: ValueReadResult) => void
  ): Promise<PluginListenerHandle>;

  onCommandWritten(
    listener: (data: { ok: boolean }) => void
  ): Promise<PluginListenerHandle>;

  onTransferStart(
    listener: (data: TransferStartEvent) => void
  ): Promise<PluginListenerHandle>;

  onTransferProgress(
    listener: (data: TransferProgressEvent) => void
  ): Promise<PluginListenerHandle>;

  onTransferEnd(
    listener: (data: TransferEndEvent) => void
  ): Promise<PluginListenerHandle>;

  onTransferError(
    listener: (data: TransferErrorEvent) => void
  ): Promise<PluginListenerHandle>;
}