export interface Sensor {
    id: string;
    team: string;
    status: boolean;
    isHeatmapVisible: boolean;
    isMarkerVisible: boolean;
    isCentroidVisible: boolean;
    heatmapRadius: number;
    heatmapBlur: number;
}