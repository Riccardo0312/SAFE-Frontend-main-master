function filterData(
  data: { [id: string]: any }[],
  deviceId: string,
  percentage: number
) {
  let response: any[] = [];

  let rssi = {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
  };
  data.forEach((element) => {
    if (element.RSSI < rssi.min) rssi.min = parseInt(element.RSSI);
    if (element.RSSI > rssi.max) rssi.max = parseInt(element.RSSI);
  });

  /*
  let filterValue = +(rssi.min - rssi.max) * +percentage + +rssi.max;
  &&element.RSSI >= filterValue
  */
  data.forEach((element) => {
    if (
      element !== undefined &&
      Object.keys(element).length !== 0 &&
      (!deviceId === undefined || element.DEVICE_ID === deviceId)
    )
      response.push(element);
  });

  response.sort(function (a, b) {
    if (parseFloat(a.RSSI) > parseFloat(b.RSSI)) return -1;
    else if (parseFloat(a.RSSI) < parseFloat(b.RSSI)) return 1;
    else return 0;
  });
  response = response.slice(0, (response.length * percentage) | 0);
  
  return { data: response, rssi: rssi };
}

function getIntervalLongLat(data: { [id: string]: any }[]) {
  let coordinates = {
    longitude: {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
    },
    latitude: {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
    },
  };
  data.forEach((element) => {
    if (element.LATITUDE < coordinates.latitude.min)
      coordinates.latitude.min = element.LATITUDE;
    if (element.LATITUDE > coordinates.latitude.max)
      coordinates.latitude.max = element.LATITUDE;
    if (element.LONGITUDE > coordinates.longitude.max)
      coordinates.longitude.max = element.LONGITUDE;
    if (element.LONGITUDE < coordinates.longitude.min)
      coordinates.longitude.min = element.LONGITUDE;
  });
  return coordinates;
}

function putCentroids(
  nCentroids: number,
  extremes: { [id: string]: { [id: string]: number } },
  edges = false,
  centroid: number[]
) {
  let field: { [id: string]: any } = {};
  for (let i = 0; i < nCentroids; i++) {
    const index = "k" + i.toString();
    field[index] = {};
  }
  if (edges) {
    field.k0.centroid = [extremes.latitude.min, extremes.longitude.min];
    field.k1.centroid = [extremes.latitude.min, extremes.longitude.max];
    field.k2.centroid = [extremes.latitude.max, extremes.longitude.min];
  } else {
    if (centroid === undefined) {
      field.k0.centroid = [
        extremes.latitude.min +
          (extremes.latitude.max - extremes.latitude.min) / 3,
        extremes.longitude.min +
          (extremes.longitude.max - extremes.longitude.min) / 3,
      ];
      field.k1.centroid = [
        extremes.latitude.min +
          (extremes.latitude.max - extremes.latitude.min) / 3,
        extremes.longitude.min +
          ((extremes.longitude.max - extremes.longitude.min) / 3) * 2,
      ];
      field.k2.centroid = [
        extremes.latitude.min +
          ((extremes.latitude.max - extremes.latitude.min) / 3) * 2,
        extremes.longitude.min +
          (extremes.longitude.max - extremes.longitude.min) / 3,
      ];
    } else {
      field.k0.centroid = [
        centroid[0] - (extremes.latitude.max - extremes.latitude.min) / 10,
        centroid[1] - (extremes.longitude.max - extremes.longitude.min) / 10,
      ];

      field.k1.centroid = [
        centroid[0] - (extremes.latitude.max - extremes.latitude.min) / 10,
        centroid[1] + (extremes.longitude.max - extremes.longitude.min) / 10,
      ];
      field.k2.centroid = [
        centroid[0] + (extremes.latitude.max - extremes.latitude.min) / 10,
        centroid[1],
      ];
    }
  }

  return field;
}

function calcuteCentroidLatitudeLongitude(points: { [id: string]: any }[]) {
  let tmpLatitude = 0;
  let tmpLongitude = 0;
  let tmpDividendo = 0;
  points.forEach((point) => {
    if (point.RSSI) {
      let rssiValue = Math.pow(10, point.RSSI / 10);
      tmpLatitude += point.LATITUDE * rssiValue;
      tmpLongitude += point.LONGITUDE * rssiValue;
      tmpDividendo += rssiValue;
    }
  });
  const latitude = tmpDividendo === 0 ? 0 : tmpLatitude / tmpDividendo;

  const longitude = tmpDividendo === 0 ? 0 : tmpLongitude / tmpDividendo;
  return [latitude, longitude];
}

function kMeansIteration(
  field: { [id: string]: any },
  data: { [id: string]: any }[]
) {
  Object.keys(field).forEach((key) => {
    field[key].points = [];
  });

  data.forEach((element) => {
    let distance: { [id: string]: number } = {};
    let minDistance = Number.POSITIVE_INFINITY;
    let minPoint: string = "k1";
    Object.keys(field).forEach((key) => {
      distance[key] = Math.sqrt(
        Math.pow(field[key].centroid[0] - element.LATITUDE, 2) +
          Math.pow(field[key].centroid[1] - element.LONGITUDE, 2)
      );

      if (distance[key] < minDistance) {
        minDistance = distance[key];
        minPoint = key;
      }
    });

    field[minPoint].points.push(element);
    element.centroid = minPoint;
  });
  Object.keys(field).forEach((key) => {
    field[key].centroid = calcuteCentroidLatitudeLongitude(field[key].points);
  });

  return field;
}

function getInitData(data: any, deviceId: string, precision: number) {
  const dataTmp = filterData(data, deviceId, precision);
  const filteredDeviceData = filterData(data, deviceId, 1).data;
  const filteredData = dataTmp.data;
  const extremes = getIntervalLongLat(filteredData);
  const singleCentroid = calcuteCentroidLatitudeLongitude(data);
  const singleFilteredCentroid =
    calcuteCentroidLatitudeLongitude(filteredDeviceData);
  return {
    filteredData: filteredData,
    extremes: extremes,
    singleCentroid: singleCentroid,
    singleFilteredCentroid: singleFilteredCentroid,
  };
}

export function generateCentroidArea(data: any, deviceId: string) {
  return new Promise<{ [id: string]: any }>((resolve) => {
    let precision = 0.5;
    const dataTmp = getInitData(data, deviceId, precision);

    let field = putCentroids(
      3,
      dataTmp.extremes,
      false,
      dataTmp.singleFilteredCentroid
    );

    for (let i = 0; i < 10; i++)
      field = kMeansIteration(field, dataTmp.filteredData);

    resolve(field);
  });
}

export function generateCentroid(data: any, deviceId: string) {
  console.log(getInitData(data, deviceId, 1).singleFilteredCentroid.reverse());
  return getInitData(data, deviceId, 1).singleFilteredCentroid.reverse();
}

function getIndex(x: any, y: any) {
  return x.toString() + "," + y.toString();
}

export function generateHeatmap(items: any, deviceId: string) {
  let data = {
    longitude: {
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
      range: 0,
      block: 0,
    },
    latitude: {
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
      range: 0,
      block: 0,
    },
    rssi: { max: Number.NEGATIVE_INFINITY, min: Number.POSITIVE_INFINITY },
    generalMin: Number.POSITIVE_INFINITY,
    generalMax: Number.NEGATIVE_INFINITY,
  };

  for (let i = 0; i < items.length; i++) {
    let item = items[i];

    if (!deviceId || item.DEVICE_ID === deviceId) {
      for (let key in item)
        if (key !== "DEVICE_ID") item[key] = parseFloat(item[key]);

      if (item.LATITUDE < data.latitude.min) data.latitude.min = item.LATITUDE;
      if (item.LONGITUDE < data.longitude.min)
        data.longitude.min = item.LONGITUDE;
      if (item.LATITUDE > data.latitude.max) data.latitude.max = item.LATITUDE;
      if (item.LONGITUDE > data.longitude.max)
        data.longitude.max = item.LONGITUDE;
      if (item.RSSI < data.rssi.min) data.rssi.min = item.RSSI;
      if (item.RSSI > data.rssi.max) data.rssi.max = item.RSSI;
    }
  }

  data.longitude.range = data.longitude.max - data.longitude.min;
  data.latitude.range = data.latitude.max - data.latitude.min;

  const LONGITUDE_PRECISION = (data.longitude.range / 0.00002) | 0;
  const LATITUDE_PRECISION = (data.latitude.range / 0.00002) | 0;

  data.longitude.block = data.longitude.range / LONGITUDE_PRECISION;
  data.latitude.block = data.latitude.range / LATITUDE_PRECISION;

  const matrix: any = {};
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (!deviceId || item.DEVICE_ID === deviceId) {
      for (let key in item)
        if (key !== "DEVICE_ID") item[key] = parseFloat(item[key]);

      if (item.RSSI) {
        let longTmp: any = item.LONGITUDE - data.longitude.min;
        longTmp = longTmp / data.longitude.block;
        let longIndex = parseInt(longTmp);
        if (longIndex === LONGITUDE_PRECISION) longIndex -= 1;

        let latTmp: any = item.LATITUDE - data.latitude.min;
        latTmp = latTmp / data.latitude.block;
        let latIndex = parseInt(latTmp);
        if (latIndex === LATITUDE_PRECISION) latIndex -= 1;

        const indexElement = getIndex(
          longIndex,
          LATITUDE_PRECISION - 1 - latIndex
        );
        if (!matrix[indexElement]) {
          matrix[indexElement] = {
            sum: 0,
            hits: 0,
            longitude:
              data.longitude.block * longIndex +
              data.longitude.block / 2 +
              data.longitude.min,
            latitude:
              data.latitude.block * latIndex +
              data.latitude.block / 2 +
              data.latitude.min,
          };
        }
        matrix[indexElement].sum += item.RSSI;
        matrix[indexElement].hits += 1;
      }
    }
  }

  Object.keys(matrix).forEach((key) => {
    matrix[key].sum = matrix[key].sum / matrix[key].hits;
    if (matrix[key].sum < data.generalMin) data.generalMin = matrix[key].sum;
    if (matrix[key].sum > data.generalMax) data.generalMax = matrix[key].sum;
  });

  return {
    data: matrix,
    generalMin: data.generalMin,
    generalMax: data.generalMax,
  };
}
