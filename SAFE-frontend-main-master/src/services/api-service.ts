import { Sensor } from "../models/sensors";
import {
  listSensors
} from "./webServerUtils";

import { NativeStorage } from "@awesome-cordova-plugins/native-storage";

class ApiService {
  async loadSensors(): Promise<Array<Sensor>> {
    const dbData = await NativeStorage.getItem("sampling");
    let sensors = listSensors(dbData);
    return sensors.map((element: any) => ({
      id: element,
      status: false,
      team: "",
      isHeatmapVisible: true,
      isMarkerVisible: true,
      isCentroidVisible: true,
      heatmapRadius: 20,
      heatmapBlur: 18,
    }));
  }
}

export default ApiService;
