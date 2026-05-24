import {
  IonFab,
  IonFabButton,
  IonIcon,
  IonToggle,
} from "@ionic/react";
import React, { useContext } from "react";
import { location, locationOutline } from "ionicons/icons";
import { MapContext } from "../../providers/MapProvider";
import { ContextMapType } from "../../providers/types";

export const LocationFab: React.FC = () => {
  const { setFollowUser, toggleLocation, locationVisible } = useContext(
    MapContext
  ) as ContextMapType;

  return (
    <>
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <>
          <IonToggle
            checked={locationVisible}
            value="locationVisible"
            onIonChange={toggleLocation}
          />
          <IonFabButton onClick={setFollowUser} disabled={!locationVisible}>
            <IonIcon icon={locationVisible ? location : locationOutline} />
          </IonFabButton>
        </>
      </IonFab>
    </>
  );
};
