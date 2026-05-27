import { Capacitor } from "@capacitor/core";

const BROWSER_ENDPOINT = "http://127.0.0.1:8000";
const ANDROID_EMULATOR_ENDPOINT = "http://10.0.2.2:8000";

export const ENV = {
  BASE_ENDPOINT:
    Capacitor.getPlatform() === "android"
      ? ANDROID_EMULATOR_ENDPOINT
      : BROWSER_ENDPOINT,
};