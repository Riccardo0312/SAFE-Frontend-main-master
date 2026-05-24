import { IonApp, IonRouterOutlet, setupIonicReact} from "@ionic/react";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/structure.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

import React from "react";
import { Redirect, Route } from "react-router";
import { IonReactRouter } from "@ionic/react-router";
import MapProvider from "./providers/MapProvider";
import MapViewer from "./pages/MapViewer/MapViewer";
import Settings from "./pages/Settings/Settings";
import TeamHandler from "./pages/TeamHandler/TeamHandler";
import SensorsProvider from "./providers/SensorsProvider";
import MapsDownloader from "./pages/MapsDownloader/MapsDownloader";
import DataSettings from "./pages/DataImporter/DataImporter";
import BleController from './pages/BleController/BleController';
setupIonicReact();
const App: React.FC = () => {
  return (
    <MapProvider>
      <SensorsProvider>
        <IonApp>
          <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/settings">
              <Settings />
            </Route>
            <Route exact path="/settings/maps">
              <MapsDownloader />
            </Route>
            <Route exact path="/settings/data">
              <DataSettings />
            </Route>
            <Route exact path="/home">
              <MapViewer />
            </Route>
            <Route exact path="/teams">
              <TeamHandler />
            </Route>
            <Route exact path="/">
              <Redirect to="/settings" />
            </Route>
            <Route exact path="/settings/ble">
              <BleController />
            </Route>
            </IonRouterOutlet>
          </IonReactRouter>
        </IonApp>
      </SensorsProvider>
    </MapProvider>
  );
};

export default App;
