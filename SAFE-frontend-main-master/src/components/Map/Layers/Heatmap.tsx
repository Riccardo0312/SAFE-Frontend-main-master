import React, { useEffect } from "react";
import { Heatmap } from "ol/layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";
import { Feature } from "ol";
import { SensorLayerProps } from "../map-types";
import {
  generateHeatmapResponse
} from "../../../services/webServerUtils";
import { NativeStorage } from "@awesome-cordova-plugins/native-storage";

export const HeatmapLayer: React.FC<SensorLayerProps> = ({ map, sensor }) => {
  useEffect(() => {
    (async function () {
      const dbData = await NativeStorage.getItem("sampling");
      const heatmap = await generateHeatmapResponse(dbData, sensor.id);
      const source = new VectorSource({
        features: new GeoJSON().readFeatures(heatmap,{
          dataProjection: "EPSG:32643",
          featureProjection: "EPSG:32643"
        }) as Feature<Point>[],
      });
      //source.addFeatures(new GeoJSON().readFeatures(heatmap));

      const layer = new Heatmap({
        className: "heatmap",
        visible: true,
        source: source,
        blur: sensor.heatmapBlur,
        radius: sensor.heatmapRadius,
        weight: function (feature) {
          return feature.get("rssi");
        },
      });
      map.addLayer(layer);
      layer.setVisible(sensor.isHeatmapVisible);
      layer.setBlur(sensor.heatmapBlur);
      layer.setRadius(sensor.heatmapRadius);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
