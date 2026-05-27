export const StorageKeys ={
    sensorsLocal: 'SensorsLocal',
    downloadedCities: 'DownloadedCities',
    locationVisible: 'LocationVisible',

    heatmapVisible: 'HeatmapVisible',
    markerVisible: 'MarkerVisible',
    centroidsVisible: 'CentroidsVisible',
    blur: 'Blur',
    radius: 'Radius',

    teams: 'Teams',
    team: 'Team',

    sampling: 'sampling',
    lastUpdate: 'lastUpdate',
    } as const;
export type StorageKeys = typeof StorageKeys [keyof typeof StorageKeys];