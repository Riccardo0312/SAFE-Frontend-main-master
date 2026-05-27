import {
  generateCentroidArea,
  generateCentroid,
  generateHeatmap,
} from "./algoritms";

function convertCoordiante(lon: string, lat: string) {
  let lonInEPSG4326 = parseFloat(lon);
  let latInEPSG4326 = parseFloat(lat);

  let lonInEPSG3857 = (lonInEPSG4326 * 20037508.34) / 180;
  let latInEPSG3857 =
    (Math.log(Math.tan(((90 + latInEPSG4326) * Math.PI) / 360)) /
      (Math.PI / 180)) *
    (20037508.34 / 180);

  return [lonInEPSG3857, latInEPSG3857];
}

function initResponse(message: string): any {
  return {
    type: "FeatureCollection",
    properties: { id: message },
    features: []
    //crs: { type: "name", properties: { name: "EPSG:3857" } },
  };
}

export function generateHeatmapResponse(
  data: any,
  deviceId: string
): Promise<Object> {
  return new Promise((resolve) => {
    let response = initResponse("HEATMAP");
    if (data) {
      let heatmapMap = generateHeatmap(data, deviceId);
      Object.keys(heatmapMap.data).forEach((key: any) => {
        const point = heatmapMap.data[key];
        const value =
          (parseInt(point.sum) + heatmapMap.generalMin * -1) /
          (heatmapMap.generalMax + heatmapMap.generalMin * -1);
        response.features.push({
          type: "Feature",
          properties: {
            name: value,
            rssi: value,
          },
          geometry: {
            type: "Point",
            coordinates: convertCoordiante(
              point.longitude.toString(),
              point.latitude.toString()
            ),
          },
        });
      });
    }
    resolve(response);
  });
}

export function generateCentroidsResponse(
  data: any,
  deviceId: string
): Promise<Object> {
  return new Promise(async (resolve, reject) => {
    let response = initResponse("CENTROIDS");
    if (data) {
      let tmpData = await generateCentroid(data, deviceId);
      response.features.push({
        type: "Feature",
        properties: { id: `${deviceId}` },
        geometry: {
          type: "Point",
          coordinates: convertCoordiante(
            tmpData[0].toString(),
            tmpData[1].toString()
          ),
        },
      });
    }
    resolve(response);
  });
}

export function generateCentroidsAreaResponse(
  data: any,
  deviceId: string
): Promise<Object> {
  return new Promise(async (resolve) => {
    let response = initResponse("CENTROID-AREA");
    let tmpData = await generateCentroidArea(data, deviceId);
    const coordinates = [];
    for (let key of Object.keys(tmpData)) {
      coordinates.push(
        convertCoordiante(tmpData[key].centroid[1], tmpData[key].centroid[0])
      );
    }
    coordinates.push(
      convertCoordiante(
        tmpData[Object.keys(tmpData)[0]].centroid[1],
        tmpData[Object.keys(tmpData)[0]].centroid[0]
      )
    );

    response.features.push({
      type: "Feature",
      properties: { id: deviceId },
      geometry: {
        type: "Polygon",
        coordinates: [coordinates],
      },
    });
    resolve(response);
  });
}

export function listSensors(data: any) {
  let sensors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].DEVICE_ID !== null && data[i].DEVICE_ID.length !== 0 && !sensors.includes(data[i].DEVICE_ID))
      sensors.push(data[i].DEVICE_ID);
  }
  return sensors;
}
