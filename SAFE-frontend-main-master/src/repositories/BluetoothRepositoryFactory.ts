import { ENV } from "../env/env";
import { bluetoothRepository } from "./BluetoothRepository";
import { mockBluetoothRepository } from "./MockBluetoothRepository";
import { BluetoothRepositoryContract } from "./BluetoothRepositoryContract";

export const bluetoothGateway: BluetoothRepositoryContract =
  ENV.USE_BLE_MOCK
    ? mockBluetoothRepository
    : bluetoothRepository;