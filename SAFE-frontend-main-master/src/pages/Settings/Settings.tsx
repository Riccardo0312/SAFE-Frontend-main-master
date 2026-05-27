import React, { useContext, useEffect } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRouterLink,
  IonTitle,
  IonToolbar,
  useIonRouter,
  UseIonRouterResult,
} from "@ionic/react";
import {mapOutline, folderOutline, navigateOutline, peopleOutline, bluetoothOutline} from "ionicons/icons";

import { Filesystem } from '@capacitor/filesystem';

import "./Settings.css"
import { SensorsContext } from "../../providers/SensorsProvider";
import { ContextSensorsType } from "../../providers/types";
import { App } from '@capacitor/app';

function enableHardwareBackButton(ionRouter: UseIonRouterResult) {
  document.addEventListener("ionBackButton", (ev: any) => {
    ev.detail.register(-1, () => {
      if (!ionRouter.canGoBack()) {
        App.exitApp();
      }
    });
  });
}

const MESSAGES = {
  MAPS: "Gestisci le mappe scaricabili/scaricate",
  IMPORT_DATA: "Inserisci dati di una rilevazione",
  TEAM: "Gestisci team di ricerca",
  BLUETOOTH : "Configurazione Bluetooth BLE"
};

const BUTTONS_TEXT = {
  GO_TO_THE_MAP: "Vai alla mappa"
}

const Settings: React.FC = () => {
  const ionRouter = useIonRouter();

  const { clearAll, loadDataSensor } = useContext(
    SensorsContext
  ) as ContextSensorsType;

  useEffect(() => {
    enableHardwareBackButton(ionRouter);
    clearAll();
    loadDataSensor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <IonPage className="settings">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>S.A.F.E.</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="settings__content">
          <IonList className="settings__list">
            <IonRouterLink routerLink="/settings/maps">
              <IonItem>
                <IonIcon className="settings__icon" slot="start" icon={mapOutline}/>
                <IonLabel>{MESSAGES.MAPS}</IonLabel>
              </IonItem>
            </IonRouterLink>
            <IonRouterLink routerLink="/settings/data">
              <IonItem>
                <IonIcon className="settings__icon" slot="start" icon={folderOutline}/>
                <IonLabel>{MESSAGES.IMPORT_DATA}</IonLabel>
              </IonItem>
            </IonRouterLink>
            <IonRouterLink routerLink="/teams">
              <IonItem>
                <IonIcon className="settings__icon" slot="start" icon={peopleOutline}/>
                <IonLabel>{MESSAGES.TEAM}</IonLabel>
              </IonItem>
            </IonRouterLink>
            <IonRouterLink routerLink="/settings/ble">
                <IonItem>
                  <IonIcon className="settings__icon" slot="start" icon={bluetoothOutline}/>
                  <IonLabel>{MESSAGES.BLUETOOTH}</IonLabel>
                </IonItem>
              </IonRouterLink>
          </IonList>
          <IonButton className="settings__mainButton" routerDirection="root" routerLink="/home" shape="round">
            <IonIcon slot="start" icon={navigateOutline}></IonIcon>
            {BUTTONS_TEXT.GO_TO_THE_MAP.toUpperCase()}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;