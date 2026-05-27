import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React from "react";

import MapsList from "../../components/MapsList/MapsList";

const MESSAGES = {
  HEADER: "Gestione mappe"
};

const MapsDownloader: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings"/>
          </IonButtons>
          <IonTitle>{MESSAGES.HEADER}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <MapsList />
      </IonContent>
    </IonPage>
  );
};

export default MapsDownloader;
