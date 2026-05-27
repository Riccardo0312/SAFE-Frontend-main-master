import React, {FC, PropsWithChildren, useContext, useEffect, useState } from "react";
import { ContextMapType, ContextSensorsType } from "./types";
import StorageService from "../services/storage";
import { Sensor } from "../models/sensors";
import ApiService from "../services/api-service";
import { IonButton, IonPopover } from "@ionic/react";
import { MapContext } from "./MapProvider";

export const SensorsContext = React.createContext<ContextSensorsType | null>(null);

const SensorsProvider: FC<PropsWithChildren> = ({ children }) => {
    const { downloadedCities } = useContext(MapContext) as ContextMapType;
    const [popoverState, setShowPopover] = useState({ showPopover: false, event: undefined });
    const [apiService] = React.useState<ApiService>(new ApiService());
    const [sensors, setSensorsLocal] = React.useState(new Array<Sensor>());
    const [storageService] = React.useState(new StorageService());
    const [teams, setTeamsLocal] = React.useState<Array<string>>([]);
    const [team, setTeamLocal] = React.useState<string>("");

    async function clearAll() {
        setSensors(new Array<Sensor>());
        storageService.clearAll();
        setTeam("");
        setTeams(new Array<string>());
    }

    async function loadDataSensor() {
        var sensorsTemp = await storageService.getSensorLocal();
        if (sensorsTemp.length === 0) {
            try {
                sensorsTemp = await apiService.loadSensors();
                setShowPopover({ showPopover: false, event: undefined });
            } catch {
                if (downloadedCities.length !== 0)
                    setShowPopover({ showPopover: true, event: undefined });
            }
        }
        setSensors(sensorsTemp);
        setTeams(await storageService.getTeams());
        setTeam(await storageService.getTeam());
    }

    useEffect(() => {
        loadDataSensor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setSensors = async (sensorsList: Array<Sensor>) => {
        setSensorsLocal(sensorsList);
        storageService.saveSensorLocal(sensorsList);
    }

    const setTeams = async (teams: Array<string>) => {
        setTeamsLocal(teams);
        storageService.saveTeams(teams);
    }

    const setTeam = async (team: string) => {
        setTeamLocal(team);
        storageService.saveTeam(team);
    }

    return (
        <SensorsContext.Provider value={{
            sensors,
            setSensors,
            teams,
            setTeams,
            team,
            setTeam,
            clearAll,
            loadDataSensor
        }}>
            {children}
            <IonPopover
                className='my-custom-class'
                event={popoverState.event}
                isOpen={popoverState.showPopover}
                backdropDismiss={false}
            >
                ATTENZIONE<br />
                Avviare app Safe
                <br />
                <IonButton onClick={() => loadDataSensor()}>aggiorna</IonButton>
            </IonPopover>
        </SensorsContext.Provider>
    );
};

export default SensorsProvider;