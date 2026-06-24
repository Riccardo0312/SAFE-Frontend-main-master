import React, { useContext, useState } from "react";
import {
 IonButton,
   IonContent,
   IonIcon,
   IonItem,
   IonList,
   IonPage,
   IonSearchbar,
   IonHeader,
   IonToolbar,
   IonTitle,
   IonButtons ,
   IonBackButton
} from "@ionic/react";
import { ContextSensorsType } from "../../providers/types";
import { SensorsContext } from "../../providers/SensorsProvider";
import TeamItem from "../../components/TeamHandler/TeamItem";
import TeamPopOver from "../../components/TeamHandler/TeamPopOver";

//import "./TeamHandler.css";
import { navigateOutline } from "ionicons/icons";

const MESSAGES = {
  SEARCH_BAR_PLACEHOLER: "Cerca Team",
  GO_TO_THE_MAP: "Vai alla mappa",
};
const Team: React.FC = () => {
  const { teams } = useContext(SensorsContext) as ContextSensorsType;

  const [searchText, setSearchText] = useState("");

return (
  <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
          <IonButtons slot="start">
                      <IonBackButton defaultHref="/settings" />
                    </IonButtons>
            <IonTitle>Gestione team</IonTitle>
          </IonToolbar>
        </IonHeader>
    <IonHeader>
      <IonToolbar>
        <IonSearchbar
          placeholder={MESSAGES.SEARCH_BAR_PLACEHOLER}
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value!)}
          showCancelButton="focus"
          animated
        />
        <TeamPopOver />
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div className="teamhandler__content">

        <IonList>
          {teams.map((team) =>
            team.toUpperCase().startsWith(searchText.toUpperCase()) ? (
              <TeamItem key={team} team={team} />
            ) : null
          )}
        </IonList>

        <IonButton
          className="teamhandler__mainButton"
          routerDirection="root"
          routerLink="/home"
          shape="round"
        >
          <IonIcon slot="start" icon={navigateOutline}></IonIcon>
          {MESSAGES.GO_TO_THE_MAP.toUpperCase()}
        </IonButton>

      </div>
    </IonContent>

  </IonPage>
);
};

export default Team;
