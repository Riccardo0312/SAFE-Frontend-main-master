import { Sensor } from '../models/sensors';

type LocationType = {
    lat: number;
    lon: number;
}

type ContextMapType = {
    locationVisible: boolean;
    geolocation: LocationType;
    orientation: number;
    followUser: boolean;
    setFollowUser: (boolean) => void;
    setOrientation: (number) => void;
    setGeolocation: (LocationType) => void;
    startLocationListeners: () => void;
    addMapListener: (fun: (center:LocationType)=>void)=>void;
    goToLocation: (location:LocationType) => void;
    toggleLocation: () => void;
    downloadedCities: string[];
    setDownloadedCities : (string) => void;
    loadDataMap : () => void;
    deletAllMap : () => void;
    downloadMap: (cityName: string, fileUrl: string) => Promise<void>;
};

type ContextSensorsType = {
    sensors: Array<Sensor>;
    setSensors: (sensorsList: Array<Sensor>) => void;
    teams: Array<string>;
    setTeams: (Array) => void;
    team: string;
    setTeam: (string) => void;
    clearAll:() => void;
    loadDataSensor : () => void;
    addTeam: (teamName: string) => Promise<void>;
    removeTeam: (teamName: string) => Promise<void>;
    assignSensorToTeam: (sensorId: string, teamName: string) => Promise<void>;
    removeSensorFromTeam: (sensorId: string) => Promise<void>;
    refreshSensorsFromSampling: () => Promise<void>;
    samplingVersion: number;
};