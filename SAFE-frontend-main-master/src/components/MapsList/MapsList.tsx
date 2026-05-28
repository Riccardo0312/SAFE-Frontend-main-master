import React, { useContext, useLayoutEffect, useState } from "react";
import {
  IonItem,
  IonList,
  IonLabel,
  IonButton,
  IonIcon,
  useIonToast,
  IonPopover,
  IonCard,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import { MapContext } from "../../providers/MapProvider";
import { ContextMapType } from "../../providers/types";
import {
  cloudDoneOutline,
  downloadOutline
} from "ionicons/icons";
import { Capacitor } from "@capacitor/core";
import { ENV } from "../../env/env";
import "./MapsList.css";
import { RefresherEventDetail } from "@ionic/core";
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const MESSAGES = {
  OK: "Ok",
  DOWNLOADED: "Mappa scaricata con successo.",
  DATA_REMOVED: "Rimossi tutti i dati.",
  ERROR_WHILE_REMOVING_DATA: "Impossibile rimuovere i dati.",
  ERROR_WHILE_DOWNLOADING_AVAILABLE_MAPS:
    "Non è stato possibile contattare il server in cui sono presenti le mappe da scaricare. Assicurati di avere internet abilitato nel dispositivo e che il server stia funzionando.",
  INTERNET_ATTIVATION_NEEDED: "Attivare internet per scaricare le mappe.",
  DONE: "Fatto",
  REMOVE_EVERY_MAP: "Elimina mappe",
};

const MapsList: React.FC = () => {
  const [toastPresent, toastDismiss] = useIonToast();

  const [popoverState, setShowPopover] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const { downloadedCities, setDownloadedCities, loadDataMap, deletAllMap, downloadMap} =
    useContext(MapContext) as ContextMapType;

  useLayoutEffect (() => {
    loadAvailableCities();
    /*
    Network.addListener("networkStatusChange", (status) => {
      if (status.connected) loadAvailableCities();
    });
    */
  }, []);

function loadAvailableCities() {
  const request = `${ENV.BASE_ENDPOINT}/list/available`;
  fetch(request)
    .then((response) => response.json())
    .then((data) => {
      // Check if the data is a valid array
      if (Array.isArray(data)) {
        setAvailableCities(data);
        setLoadError(false);
      } else {
        // If it's not an array, set it to an empty array to prevent the crash
        setAvailableCities([]);
        setLoadError(true);
        console.error("Received data is not an array:", data);
      }
    })
    .catch((e) => {
      // This part handles a complete fetch failure (e.g., server is down)
      setLoadError(true);
      setAvailableCities([]); // Ensure state is an array
      console.error("Fetch failed:", e);
    });
}

async function downloadCity(cityName: string) {
  const fileUrl = `${ENV.BASE_ENDPOINT}/download/${cityName}`;

  try {
    if (Capacitor.isNativePlatform()) {
      await downloadMap(cityName, fileUrl);

      toastPresent({
        buttons: [{ text: MESSAGES.OK, handler: () => toastDismiss() }],
        message: MESSAGES.DOWNLOADED,
        duration: 10000,
      });

      return;
    }

    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Errore download mappa: ${response.status}`);
    }

    const updatedCities = Array.from(
      new Set([...downloadedCities, cityName])
    );

    await setDownloadedCities(updatedCities);

    window.open(fileUrl, "_blank");

    toastPresent({
      buttons: [{ text: MESSAGES.OK, handler: () => toastDismiss() }],
      message: MESSAGES.DOWNLOADED,
      duration: 10000,
    });
  } catch (e) {
    console.error("Errore nel download della mappa:", e);

    toastPresent({
      buttons: [{ text: MESSAGES.OK, handler: () => toastDismiss() }],
      message: `Errore nel download della mappa: ${String(e)}`,
      duration: 10000,
    });
  }
}

async function reset() {
  try {
    if (Capacitor.isNativePlatform()) {
      await Filesystem.rmdir({
        path: "maps",
        directory: Directory.Data,
        recursive: true,
      }).catch(() => {
        // Se la cartella non esiste, non è un errore grave
      });
    }

    await deletAllMap();

    toastPresent({
      buttons: [{ text: MESSAGES.OK, handler: () => toastDismiss() }],
      message: MESSAGES.DATA_REMOVED,
      duration: 10000,
    });
  } catch (e) {
    console.error("Errore reset mappe:", e);

    toastPresent({
      buttons: [{ text: MESSAGES.OK, handler: () => toastDismiss() }],
      message: MESSAGES.ERROR_WHILE_REMOVING_DATA,
      duration: 10000,
    });
  }
}

  function doRefresh(event: CustomEvent<RefresherEventDetail>) {
    loadAvailableCities();
    setTimeout(() => event.detail.complete(), 2000);
  }

  return (
    <div className="mapslist">
      <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      {loadError ? (
        <IonCard color="danger">
          <IonCardContent>
            {MESSAGES.ERROR_WHILE_DOWNLOADING_AVAILABLE_MAPS}
          </IonCardContent>
        </IonCard>
      ) : (
        <>
          <IonList className="mapslist__citiesList">
            {availableCities.map((cityName: string, index: number) => (
              <IonItem key={index}>
                <IonLabel className="mapslist__cityName">
                  {cityName.toUpperCase()}
                </IonLabel>
                {!downloadedCities.includes(cityName) ? (
                  <IonButton
                    className="mapslist__downloadButton"
                    onClick={() => downloadCity(cityName)}
                    size="default"
                  >
                    <IonIcon icon={downloadOutline} />
                  </IonButton>
                ) : (
                  <IonIcon className="mapslist__downloadButton" icon={cloudDoneOutline} size="large" />
                )}
              </IonItem>
            ))}
          </IonList>

          <IonPopover
            event={undefined}
            isOpen={popoverState}
            backdropDismiss={false}
          >
            <IonLabel>{MESSAGES.INTERNET_ATTIVATION_NEEDED}</IonLabel>
            <IonButton onClick={() => setShowPopover(false)}>{MESSAGES.OK}</IonButton>
          </IonPopover>

          <IonButton
            className="mapslist__resetButton"
            shape="round"
            color="danger"
            fill="solid"
            onClick={() => reset()}
          >
            {MESSAGES.REMOVE_EVERY_MAP}
          </IonButton>
          {/*
              <IonButtons slot="end">
              <IonButton
                disabled={downloadedCities.length === 0}
                color="primary"
                fill="solid"
                routerLink="/settings"
                routerDirection="back"
                onClick={() => Network.removeAllListeners()}
              >
                {MESSAGES.DONE}
              </IonButton>
              </IonButtons>
            */}
        </>
      )}
    </div>
  );
};

export default MapsList;
