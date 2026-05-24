import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export interface BluetoothPermissionResult {
  bluetoothScan?: PermissionState;
  bluetoothConnect?: PermissionState;
  location?: PermissionState;
}

export interface ValueReadResult {
  uuid: string;
  valueText: string;
}

export interface GetJsonResult {
  json: string;
  session_id?: number;
  kind?: string;
}

export interface TransferStartEvent {
  requestType: string;
  session_id: number;
  total_size: number;
  expected_chunks: number;
}

export interface TransferProgressEvent {
  requestType: string;
  session_id: number;
  receivedBytes: number;
  total_size: number;
}

export interface TransferEndEvent {
  requestType: string;
  session_id: number;
}

export interface TransferErrorEvent {
  requestType: string;
  session_id: number;
  reason: string;
}

export interface BluetoothBLEPlugin {
  checkPermissions(): Promise<BluetoothPermissionResult>;
  requestPermissions(): Promise<BluetoothPermissionResult>;

  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  disconnectAndClose(): Promise<void>;

  sendStartSession(): Promise<void>;
  sendStopSession(): Promise<void>;

  getSessionList(): Promise<GetJsonResult>;
  getSession(options: { sessionNumber: number }): Promise<GetJsonResult>;

  addListener(eventName: 'logUpdate', listenerFunc: (data: { log: string }) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(eventName: 'onConnected', listenerFunc: () => void): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(eventName: 'onDisconnected', listenerFunc: () => void): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(eventName: 'onValueRead', listenerFunc: (data: ValueReadResult) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(eventName: 'onCommandWritten', listenerFunc: (data: { ok: boolean }) => void): Promise<PluginListenerHandle> & PluginListenerHandle;

  // streaming events
  addListener(eventName: 'transferStart', listenerFunc: (data: TransferStartEvent) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(eventName: 'transferProgress', listenerFunc: (data: TransferProgressEvent) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(eventName: 'transferEnd', listenerFunc: (data: TransferEndEvent) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(eventName: 'transferError', listenerFunc: (data: TransferErrorEvent) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
}

const BluetoothBLE = registerPlugin<BluetoothBLEPlugin>('BluetoothBLE');
export default BluetoothBLE;
