import React, {FC, PropsWithChildren, useContext, useEffect, useState } from "react";
import { ContextMapType, ContextSensorsType } from "./types";
import StorageService from "../services/storage";
import { Sensor } from "../models/sensors";
import ApiService from "../services/api-service";
import { IonButton, IonPopover } from "@ionic/react";
import { MapContext } from "./MapProvider";
import { teamRepository } from "../repositories/TeamRepository";
import {
  samplingRepository,
} from "../repositories/SamplingRepository";

export const SensorsContext = React.createContext<ContextSensorsType | null>(null);

const SensorsProvider: FC<PropsWithChildren> = ({ children }) => {
    const { downloadedCities } = useContext(MapContext) as ContextMapType;
    const [popoverState, setShowPopover] = useState({ showPopover: false, event: undefined });
    const [apiService] = React.useState<ApiService>(new ApiService());
    const [sensors, setSensorsLocal] = React.useState(new Array<Sensor>());
    const [storageService] = React.useState(new StorageService());
    const [teams, setTeamsLocal] = React.useState<Array<string>>([]);
    const [team, setTeamLocal] = React.useState<string>("");
    const [samplingVersion, setSamplingVersion] =
      useState(0);

    function createDefaultSensor(id: string): Sensor {
      return {
        id,
        status: false,
        team: "",
        isHeatmapVisible: true,
        isMarkerVisible: true,
        isCentroidVisible: true,
        heatmapRadius: 20,
        heatmapBlur: 18,
      };
    }



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

    const refreshSensorsFromSampling = async () => {
      const measurements =
        await samplingRepository.getAll();

      const sensorIds = Array.from(
        new Set(
          measurements
            .map((measurement) => measurement.DEVICE_ID)
            .filter((id) => id.trim() !== "")
        )
      );

      const previousSensors = new Map(
        sensors.map((sensor) => [sensor.id, sensor])
      );

      const refreshedSensors = sensorIds.map(
        (sensorId) =>
          previousSensors.get(sensorId) ??
          createDefaultSensor(sensorId)
      );

      await setSensors(refreshedSensors);

      setSamplingVersion(
        (currentVersion) => currentVersion + 1
      );
    };



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

    const addTeam = async (teamName: string) => {
      const updatedTeams = teamRepository.addTeam(teams, teamName);
      await setTeams(updatedTeams);
    };

    const removeTeam = async (teamName: string) => {
      const updatedSensors = teamRepository.clearTeamFromSensors(
        sensors,
        teamName
      );

      const updatedTeams = teamRepository.removeTeam(teams, teamName);

      await setSensors(updatedSensors);
      await setTeams(updatedTeams);
    };

    const assignSensorToTeam = async (sensorId: string, teamName: string) => {
      const updatedSensors = teamRepository.assignSensorToTeam(
        sensors,
        sensorId,
        teamName
      );

      await setSensors(updatedSensors);
    };

    const removeSensorFromTeam = async (sensorId: string) => {
      const updatedSensors = teamRepository.removeSensorFromTeam(
        sensors,
        sensorId
      );

      await setSensors(updatedSensors);
    };


    return (
        <SensorsContext.Provider value={{
            sensors,
            setSensors,
            teams,
            setTeams,
            team,
            setTeam,
            clearAll,
            loadDataSensor,
            addTeam,
            removeTeam,
            assignSensorToTeam,
            removeSensorFromTeam,
            refreshSensorsFromSampling,
            samplingVersion,
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