import Map from "ol/Map";
import { Sensor } from "../../models/sensors";

export interface SingleLayerProps {
  map: Map;
}

export interface SensorLayerProps {
  map: Map;
  sensor: Sensor;
}