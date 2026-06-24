/*import React, { useContext, useState } from "react";
import {
  IonIcon,
  IonPopover,
  IonButton,
  IonInput,
  IonContent
} from "@ionic/react";
import { push } from "ionicons/icons";
import { ContextSensorsType } from "../../providers/types";
import { SensorsContext } from "../../providers/SensorsProvider";

const MESSAGES = {
  NEW_TEAM: "Inserisci nuovo team",
};

const TeamPopOver: React.FC = () => {
  const { teams, setTeams } = useContext(SensorsContext) as ContextSensorsType;

  const [showPopover, setShowPopover] = useState<{
    open: boolean;
    event: MouseEvent | undefined;
  }>({
    open: false,
    event: undefined,
  });

  const [newTeam, setNewTeam] = useState("");

  function insertTeam() {
    if (newTeam.trim() !== "") {
      setTeams([...teams, newTeam]);
      setNewTeam("");
    }
  }

  return (
    <>
      <IonPopover
        isOpen={showPopover.open}
        event={showPopover.event}
        onDidDismiss={() =>
          setShowPopover({ open: false, event: undefined })
        }
      >
        <IonContent className="ion-padding">
          <IonInput
            placeholder={MESSAGES.NEW_TEAM}
            value={newTeam}
            onIonChange={(e) => setNewTeam(e.detail.value!)}
          />
          <IonButton
            expand="block"
            onClick={(e) => {
              insertTeam();
              setShowPopover({ open: false, event: e.nativeEvent });
            }}
          >
            Inserisci
          </IonButton>
        </IonContent>
      </IonPopover>

      <IonButton
        onClick={(e) =>
          setShowPopover({ open: true, event: e.nativeEvent })
        }
      >
        {MESSAGES.NEW_TEAM}
        <IonIcon slot="end" icon={push} />
      </IonButton>
    </>
  );
};

export default TeamPopOver;
*/
import React, { useContext, useState } from "react";
import { IonIcon, IonPopover, IonButton, IonInput } from "@ionic/react";
import { push } from "ionicons/icons";
import { ContextSensorsType } from "../../providers/types";
import { SensorsContext } from "../../providers/SensorsProvider";

const MESSAGES = {
  NEW_TEAM: "Inserisci nuovo team",
};

const TeamPopOver: React.FC = () => {
  const { addTeam } = useContext(SensorsContext) as ContextSensorsType;

  const [teamName, setTeamName] = useState("");

  const [showPopover, setShowPopover] = useState<{
    open: boolean;
    event: Event | undefined;
  }>({
    open: false,
    event: undefined,
  });

  async function insertTeam() {
    await addTeam(teamName);
    setTeamName("");
  }

  return (
    <>
      <IonPopover
        isOpen={showPopover.open}
        event={showPopover.event}
        onDidDismiss={() => {
          setShowPopover({ open: false, event: undefined });
        }}
      >
        <IonInput
          placeholder={MESSAGES.NEW_TEAM}
          value={teamName}
          onIonChange={(event) =>
            setTeamName(String(event.detail.value ?? ""))
          }
        />

        <IonButton
          onClick={async (event) => {
            await insertTeam();
            setShowPopover({ open: false, event: event.nativeEvent });
          }}
        >
          inserisci
        </IonButton>
      </IonPopover>

      <IonButton
        size="default"
        onClick={(event) =>
          setShowPopover({ open: true, event: event.nativeEvent })
        }
      >
        {MESSAGES.NEW_TEAM}
        <IonIcon slot="end" icon={push} />
      </IonButton>
    </>
  );
};

export default TeamPopOver;