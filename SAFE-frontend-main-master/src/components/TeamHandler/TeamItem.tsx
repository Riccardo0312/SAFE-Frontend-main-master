import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
} from "@ionic/react";
import React, { useState } from "react";
import {
  arrowDownSharp,
  arrowUpSharp,
  information,
} from "ionicons/icons";
import TeamSensors from "./TeamSensors";

interface TeamItemProps {
  team: string;
}

const TeamItem: React.FC<TeamItemProps> = ({ team }) => {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  return (
    <>
      <IonItem onClick={() => setShowMenu(!showMenu)}>
        <IonLabel>{team}</IonLabel>
        <IonButton onClick={() => setShowMenu(!showMenu)}>
          <IonIcon slot="end" icon={information} />
          {showMenu ? (
            <IonIcon icon={arrowUpSharp} />
          ) : (
            <IonIcon icon={arrowDownSharp} />
          )}
        </IonButton>
        
      </IonItem>
      {showMenu
        ? (<TeamSensors team={team}/>)
        : null}
    </>
  );
};

export default TeamItem;
