import React, { useEffect } from "react";
import { SensorLayerProps } from "../map-types";
import "ol/ol.css";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { generateCentroidsAreaResponse } from "../../../services/webServerUtils";
import { NativeStorage } from "@awesome-cordova-plugins/native-storage";

export const CentroidsLayer: React.FC<SensorLayerProps> = ({ map, sensor }) => {
  useEffect(() => {
    (async function () {
      const dbData = await NativeStorage.getItem("sampling");
      const centroidAreas = await generateCentroidsAreaResponse(
        dbData,
        sensor.id
      );
      const source = new VectorSource({
        features: new GeoJSON().readFeatures(centroidAreas, {
          dataProjection: "EPSG:3857",
          featureProjection: "EPSG:3857",
        }),
      });

      const layer = 
        new VectorLayer({
          source: source,
          visible:true,
          style: [
            new Style({
              stroke: new Stroke({
                color: "blue",
                width: 3,
              }),
              fill: new Fill({
                color: "rgba(0, 0, 255, 0.1)",
              }),
            }),
            new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({
                  color: "orange",
                }),
              }),
            }),
          ],
        });
      map.addLayer(layer);
      layer.setVisible(sensor.isCentroidVisible);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
