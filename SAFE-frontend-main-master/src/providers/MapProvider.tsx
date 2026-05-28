import { Geolocation, GeolocationPosition } from '@capacitor/geolocation';
import { Motion, MotionOrientationEventResult } from '@capacitor/motion';
import React, { useEffect } from "react";
import { FC, PropsWithChildren } from 'react';
import { LocationType, ContextMapType } from "./types";
import { toRadians } from 'ol/math';
import { mapRepository } from "../repositories/MapRepository";

export const MapContext = React.createContext<ContextMapType | null>(null);

class MapCenterListener {
    notify: (center: LocationType) => void;
    constructor(fun: (center: LocationType) => void) {
        this.notify = fun;
    }
}

const MapProvider: FC<PropsWithChildren> = ({ children }) => {
    const [locationVisible, setLocationVisible] = React.useState<boolean>(true);
    const [geolocation, setGeolocation] = React.useState<LocationType>({ lat: 0, lon: 0 });
    const [orientation, setOrientation] = React.useState<number>(0);
    const [followUser, setFollowUser] = React.useState<boolean>(true);
    const [centerChangeListeners] = React.useState<Array<MapCenterListener>>([]);


    const [downloadedCities, setDownloadedCitiesLocal] = React.useState<Array<string>>([]);

    const loadDataMap = React.useCallback(async () => {
      const downloadedCities = await mapRepository.getDownloadedCities();
      const locationVisible = await mapRepository.getLocationVisible();

      setDownloadedCitiesLocal(downloadedCities);
      setLocationVisible(locationVisible);
    }, []); // Dipendenza da storageService

    const downloadMap = React.useCallback(
      async (cityName: string, fileUrl: string) => {
        await mapRepository.downloadCityMap(cityName, fileUrl);

        const currentCities = await mapRepository.getDownloadedCities();

        const updatedCities = Array.from(
          new Set([...currentCities, cityName])
        );

        setDownloadedCitiesLocal(updatedCities);
        await mapRepository.saveDownloadedCities(updatedCities);
      },
      []
    );

    // Usa useCallback per definire deletAllMap in modo stabile
    const deletAllMap = React.useCallback(async () => {
      await mapRepository.clearDownloadedCities();
      setDownloadedCitiesLocal([]);
    }, []);

    // Ora l'useEffect è pulito e dipende da loadDataMap
    useEffect(() => {
        void loadDataMap();
    }, [loadDataMap]);

    const setDownloadedCities = async (cities: string[])=>{
        setDownloadedCitiesLocal(cities);
        await mapRepository.saveDownloadedCities(cities);
    }

    const startLocationListeners = () => {
        // Applica il tipo GeolocationPosition
        Geolocation.watchPosition({ enableHighAccuracy: true }, (position: GeolocationPosition | null) => {
            if (position)
                setGeolocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        });

        // Applica il tipo MotionOrientationEvent
        Motion.addListener('orientation', (values: MotionOrientationEventResult) => {
            setOrientation(toRadians(values.alpha));
        });
    }

    const addMapListener = (fun: (center: LocationType) => void) => {
        centerChangeListeners.push(new MapCenterListener(fun));
    }

    const goToLocation = (location: LocationType) => {
        setFollowUser(false);
        centerChangeListeners.forEach((it) => it.notify(location));
    }

    const toggleLocation = async () => {
        const newVisibility = !locationVisible;
        setLocationVisible(newVisibility);
        await mapRepository.saveLocationVisible(newVisibility);

        if(!newVisibility) { // Se era visibile e ora lo stai disattivando
            setFollowUser(false);
        }
    }


    return (
        <MapContext.Provider value={{
            locationVisible,
            geolocation,
            orientation,
            followUser,
            setFollowUser,
            setOrientation,
            setGeolocation,
            startLocationListeners,
            goToLocation,
            addMapListener,
            toggleLocation,
            downloadedCities,
            setDownloadedCities,
            loadDataMap,
            deletAllMap,
            downloadMap
        }}>
            {children}
        </MapContext.Provider>
    );
};

export default MapProvider;