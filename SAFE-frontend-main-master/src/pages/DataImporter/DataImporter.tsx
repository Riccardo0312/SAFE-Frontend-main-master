import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import React from "react";
import FileSelector from "../../components/FileSelector/FileSelector";

const MESSAGES = {
  HEADER: "Gestione rilevazioni"
};
const DataSettings: React.FC = () => {

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
        <FileSelector />
      </IonContent>
    </IonPage>
  );
};

export default DataSettings;
