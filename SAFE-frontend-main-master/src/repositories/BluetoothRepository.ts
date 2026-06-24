import { PluginListenerHandle } from "@capacitor/core";
import BluetoothBLE, {
  BluetoothPermissionResult,
  GetJsonResult,
  TransferEndEvent,
  TransferErrorEvent,
  TransferProgressEvent,
  TransferStartEvent,
  ValueReadResult,
} from "../plugins/bluetooth-ble";

import { BluetoothRepositoryContract } from "./BluetoothRepositoryContract";

class BluetoothRepository implements BluetoothRepositoryContract{
  async checkPermissions(): Promise<BluetoothPermissionResult> {
    return BluetoothBLE.checkPermissions();
  }

  async requestPermissions(): Promise<BluetoothPermissionResult> {
    return BluetoothBLE.requestPermissions();
  }

  async startScan(): Promise<void> {
    await BluetoothBLE.startScan();
  }

  async stopScan(): Promise<void> {
    await BluetoothBLE.stopScan();
  }

  async disconnectAndClose(): Promise<void> {
    await BluetoothBLE.disconnectAndClose();
  }

  async sendStartSession(): Promise<void> {
    await BluetoothBLE.sendStartSession();
  }

  async sendStopSession(): Promise<void> {
    await BluetoothBLE.sendStopSession();
  }

  async getSessionList(): Promise<GetJsonResult> {
    return BluetoothBLE.getSessionList();
  }

  async getSession(sessionNumber: number): Promise<GetJsonResult> {
    return BluetoothBLE.getSession({ sessionNumber });
  }

  async onLogUpdate(
    listener: (data: { log: string }) => void
  ): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("logUpdate", listener);
  }

  async onConnected(listener: () => void): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("onConnected", listener);
  }

  async onDisconnected(listener: () => void): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("onDisconnected", listener);
  }

  async onValueRead(
    listener: (data: ValueReadResult) => void
  ): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("onValueRead", listener);
  }

  async onCommandWritten(
    listener: (data: { ok: boolean }) => void
  ): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("onCommandWritten", listener);
  }

  async onTransferStart(
    listener: (data: TransferStartEvent) => void
  ): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("transferStart", listener);
  }

  async onTransferProgress(
    listener: (data: TransferProgressEvent) => void
  ): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("transferProgress", listener);
  }

  async onTransferEnd(
    listener: (data: TransferEndEvent) => void
  ): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("transferEnd", listener);
  }

  async onTransferError(
    listener: (data: TransferErrorEvent) => void
  ): Promise<PluginListenerHandle> {
    return BluetoothBLE.addListener("transferError", listener);
  }
}

export const bluetoothRepository = new BluetoothRepository();