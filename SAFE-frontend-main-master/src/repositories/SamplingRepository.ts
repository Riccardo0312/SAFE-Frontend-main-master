import { NativeStorage } from "@awesome-cordova-plugins/native-storage";
import { Preferences } from "@capacitor/preferences";

export interface SamplingRecord {
  DEVICE_ID: string;
  RSSI: number;
  LATITUDE: number;
  LONGITUDE: number;
  EVENT_TIME: string;
}

const SAMPLING_KEY = "sampling";
const LAST_UPDATE_KEY = "lastUpdate";

function toNumber(value: unknown, fieldName: string): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`Valore ${fieldName} non valido`);
  }

  return numberValue;
}

function extractMeasurements(parsedJson: unknown): unknown[] {
  if (Array.isArray(parsedJson)) {
    return parsedJson;
  }

  if (typeof parsedJson !== "object" || parsedJson === null) {
    throw new Error("Formato della sessione Bluetooth non valido");
  }

  const payload = parsedJson as Record<string, unknown>;

  const measurements =
    payload.measurements ??
    payload.samples ??
    payload.data;

  if (!Array.isArray(measurements)) {
    throw new Error(
      "La sessione non contiene un array measurements, samples o data"
    );
  }

  return measurements;
}

function normalizeMeasurement(
  value: unknown,
  index: number
): SamplingRecord {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Misurazione ${index + 1} non valida`);
  }

  const item = value as Record<string, unknown>;

  const deviceId =
    item.DEVICE_ID ??
    item.device_id ??
    item.deviceId ??
    item.uuid;

  if (typeof deviceId !== "string" || deviceId.trim() === "") {
    throw new Error(
      `DEVICE_ID mancante nella misurazione ${index + 1}`
    );
  }

  const eventTime =
    item.EVENT_TIME ??
    item.event_time ??
    item.eventTime ??
    new Date().toISOString();

  return {
    DEVICE_ID: deviceId.trim(),

    RSSI: toNumber(
      item.RSSI ?? item.rssi,
      "RSSI"
    ),

    LATITUDE: toNumber(
      item.LATITUDE ?? item.latitude,
      "LATITUDE"
    ),

    LONGITUDE: toNumber(
      item.LONGITUDE ?? item.longitude,
      "LONGITUDE"
    ),

    EVENT_TIME: String(eventTime),
  };
}

class SamplingRepository {
  parseSessionJson(rawJson: string): SamplingRecord[] {
    const parsedJson: unknown = JSON.parse(rawJson);
    const rawMeasurements = extractMeasurements(parsedJson);

    const measurements = rawMeasurements.map(
      normalizeMeasurement
    );

    if (measurements.length === 0) {
      throw new Error(
        "La sessione Bluetooth non contiene misurazioni"
      );
    }

    return measurements;
  }

  async getAll(): Promise<SamplingRecord[]> {
    try {
      const result = await NativeStorage.getItem(SAMPLING_KEY);

      if (!Array.isArray(result)) {
        return [];
      }

      return result;
    } catch {
      return [];
    }
  }

  async replaceAll(
    measurements: SamplingRecord[]
  ): Promise<void> {
    await NativeStorage.setItem(
      SAMPLING_KEY,
      measurements
    );

    await Preferences.set({
      key: LAST_UPDATE_KEY,
      value: new Date().toLocaleString(),
    });
  }

  async saveSessionJson(
    rawJson: string
  ): Promise<SamplingRecord[]> {
    const measurements = this.parseSessionJson(rawJson);

    await this.replaceAll(measurements);

    return measurements;
  }

  async clear(): Promise<void> {
    await NativeStorage.remove(SAMPLING_KEY);
    await Preferences.remove({ key: LAST_UPDATE_KEY });
  }
}

export const samplingRepository =
  new SamplingRepository();