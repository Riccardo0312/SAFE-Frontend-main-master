import { Storage } from '@ionic/storage';
import { Sensor } from '../models/sensors';
  
class StorageService {
    storage = new Storage();

    constructor() {
        this.storage.create();
    }

    async clearAll(){
        await this.storage.clear();
    }

    async saveSensorLocal(value: Array<Sensor>) {
        this.storage.set("SensorsLocal", JSON.stringify(value));
    }

    async getSensorLocal(): Promise<Array<Sensor>> {
        const sensorsLocal = await this.storage.get("SensorsLocal");
        if(!sensorsLocal) return [];
        return JSON.parse(sensorsLocal);
        
    }

    saveHeatmapVisible(value: boolean) {
        this.storage.set("HeatmapVisible", value);
    }

    async getHeatmapVisible(): Promise<boolean> {
        const heatmapVisible = await this.storage.get("HeatmapVisible");
        if(heatmapVisible != null)
            return heatmapVisible;
        else
            return true;
    }

    saveDownloadedCities(value:string[]){
        this.storage.set("DownloadedCities",value);
    }

    async getDownloadedCities():Promise<string[]>{
        const tilesLoaded = await this.storage.get("DownloadedCities");
        if(tilesLoaded != null)
            return tilesLoaded;
        else 
            return [];
    }

    saveLocationVisible(value: boolean) {
        this.storage.set("LocationVisible", value);
    }

    async getLocationVisible(): Promise<boolean> {
        const locationVisible = await this.storage.get("LocationVisible");
        if(locationVisible != null)
            return locationVisible;
        else 
            return true;
    }

    saveMarkerVisible(value: boolean) {
        this.storage.set("MarkerVisible", value);
    }

    async getMarkerVisible(): Promise<boolean> {
        const markerVisible = await this.storage.get("MarkerVisible");
        if(markerVisible != null)
            return markerVisible;
        else 
            return true;
    }

    saveCentroidsVisible(value: boolean) {
        this.storage.set("CentroidsVisible", value);
    }

    async getCentroidsVisible(): Promise<boolean> {
        const centroidsVisible = await this.storage.get("CentroidsVisible");
        if(centroidsVisible != null)
            return centroidsVisible;
        else 
            return true;
    }

    saveBlur(value: number) {
        this.storage.set("Blur", value);
    }

    async getBlur(): Promise<number> {
        const blur = await this.storage.get("Blur");
        if (blur != null)
            return blur;
        else
            return 18;
    }

    saveRadius(value: number) {
        this.storage.set("Radius", value);
    }

    async getRadius(): Promise<number> {
        const radius = await this.storage.get("Radius");
        if(radius != null)
            return radius;
        else
            return 10;
    }

    saveTeams(value: Array<string>) {
        this.storage.set("Teams", JSON.stringify(value));
    }

    async getTeams(): Promise<Array<string>> {
        const teams = await this.storage.get("Teams");
        if(teams != null)
            return JSON.parse(teams);
        else
            return [];
        
    }

    saveTeam(value: string) {
        this.storage.set("Team", value);
    }

    async getTeam(): Promise<string> {
        const teams = await this.storage.get("Team");
        if(teams != null)
            return teams;
        else
            return "any";
        
    }
}

export default StorageService;