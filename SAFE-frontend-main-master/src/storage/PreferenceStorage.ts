import { Preferences } from '@capacitor/preferences';


export class PreferenceStorage {
    async get<T>(key: string, fallback: T): Promise<T> {
        const result = await Preferences.get({ key });

        if (result.value === null) {
          return fallback;
        }

        try {
          return JSON.parse(result.value) as T;
        } catch {
          return fallback;
        }
      }

      async set<T>(key: string, value: T): Promise<void> {
        await Preferences.set({
          key,
          value: JSON.stringify(value),
        });
      }

      async remove(key: string): Promise<void> {
        await Preferences.remove({ key });
      }

      async clear(): Promise<void> {
        await Preferences.clear();
      }

      async has(key: string): Promise<boolean> {
        const result = await Preferences.get({ key });
        return result.value !== null;
      }
  }
export const preferenceStorage = new PreferenceStorage();
