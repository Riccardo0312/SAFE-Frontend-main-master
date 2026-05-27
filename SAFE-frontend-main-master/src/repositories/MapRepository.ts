import { preferenceStorage } from '../storage/PreferenceStorage';
import { StorageKeys } from '../storage/KeysStorage';

export class MapRepository {
    async getDownloadedCities(): Promise<string[]> {
        return preferenceStorage.get<string[]>(StorageKeys.downloadedCities, []);
    }

    async saveDownloadedCities(cities: string[]): Promise<void> {
        await preferenceStorage.set(StorageKeys.downloadedCities, cities);
    }

    async clearDownloadedCities(): Promise<void> {
        await preferenceStorage.remove(StorageKeys.downloadedCities);
    }

    async getLocationVisible(): Promise<boolean> {
        return preferenceStorage.get<boolean>(StorageKeys.locationVisible, true);
    }

    async saveLocationVisible(value: boolean): Promise<void> {
        await preferenceStorage.set(StorageKeys.locationVisible, value);
    }
}

export const mapRepository = new MapRepository();