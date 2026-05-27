import {
  IonItem,
  IonLabel,
  IonToggle,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { trashOutline } from "ionicons/icons";
import { useContext, useState } from "react";
import { Sensor } from "../../models/sensors";
import { SensorsContext } from "../../providers/SensorsProvider";
import { ContextSensorsType } from "../../providers/types";

interface TeamItemProps {
  team: string;
}

const TeamSensors: React.FC<TeamItemProps> = ({ team }) => {
  const { sensors, setSensors, teams, setTeams } = useContext(
    SensorsContext
  ) as ContextSensorsType;

  const [searchText, setSearchText] = useState("");
  const [viewAviable, setViewAviable] = useState(true);

  function checkTeam(check: CustomEvent, sensor: Sensor, team: string) {
    check.detail.checked ? (sensor.team = team) : (sensor.team = "");
    setSensors(sensors);
  }

  function removeTeam() {
    sensors.forEach((e) => {
      if (e.team === team) e.team = "";
    });
    setSensors(sensors);
    teams.splice(teams.indexOf(team), 1);
    var newArray: any[] = [];
    newArray = newArray.concat(teams);
    setTeams(newArray);
  }

  return (
    <>
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonSearchbar
              value={searchText}
              placeholder="Cerca sensore"
              onIonChange={(e) => setSearchText(e.detail.value!)}
              showCancelButton="focus"
              animated
            />
          </IonCol>
          <IonCol>
            <IonItem>
              <IonLabel>nascondi già assegnati</IonLabel>
              <IonToggle
                checked={viewAviable}
                onIonChange={() => setViewAviable(!viewAviable)}
              />
            </IonItem>
          </IonCol>
          <IonCol>
            <IonButton onClick={() => removeTeam()}>
              Elimina team
              <IonIcon slot="end" icon={trashOutline} />
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
      {viewAviable
        ? sensors.map((e) =>
            e.id.toUpperCase().startsWith(searchText.toUpperCase()) &&
            (e.team===team || e.team==="") ? (
              <IonItem>
                <IonLabel>{e.id}</IonLabel>
                <IonToggle
                  checked={e.team===team}
                  onIonChange={(check) => {
                    checkTeam(check, e, team);
                  }}
                />
              </IonItem>
            ) : null
          )
        : sensors.map((e) =>
            e.id.toUpperCase().startsWith(searchText.toUpperCase()) ? (
              <IonItem>
                <IonLabel>{e.id}</IonLabel>
                <IonToggle
                  disabled={e.team !== team && e.team !== ""}
                  checked={e.team===team}
                  onIonChange={(check) => {
                    checkTeam(check, e, team);
                  }}
                />
              </IonItem>
            ) : null
          )}
    </>
  );
};

export default TeamSensors;
