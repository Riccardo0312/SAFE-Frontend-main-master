import React from "react";
import {
  IonContent,
  IonMenu,
  IonPage,
  IonSplitPane,
} from "@ionic/react";
import "./MapViewer.css";
import { Map } from "../../components/Map";
import { LocationFab } from "../../components/MapControls/LocationButton";
import SensorList from "../../components/sensorList/SensorList";

const Home: React.FC = () => {
  return (
    <IonPage className="mapviewer">
      <IonSplitPane contentId="map" when="xs">
        <IonMenu contentId="map" className="mapviewer__sideMenu">
          <SensorList />
        </IonMenu>
        <IonContent id="map">
          <Map />
          <LocationFab />
        </IonContent>
      </IonSplitPane>
    </IonPage>
  );
};

export default Home;
