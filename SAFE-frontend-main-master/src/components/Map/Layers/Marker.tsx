import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import React, { useEffect } from "react";
import { SensorLayerProps } from "../map-types";
import { Icon, Style } from "ol/style";
import "ol/ol.css";
import GeoJSON from "ol/format/GeoJSON";

import {
  generateCentroidsResponse
} from "../../../services/webServerUtils";
import { NativeStorage } from "@awesome-cordova-plugins/native-storage";


export const MarkerLayer: React.FC<SensorLayerProps> = ({ map, sensor }) => {
  useEffect(() => {
    (async function(){
      const dbData = await NativeStorage.getItem("sampling");
      const centroids = await generateCentroidsResponse(dbData, sensor.id);
      const source = new VectorSource({
        features: new GeoJSON().readFeatures(centroids, {
          dataProjection: "EPSG:3857",
          featureProjection: "EPSG:3857"
        })
      });
      const layer = new VectorLayer({
        source: source,
        className: "marker",
        visible: true,
        style: new Style({
          image: new Icon({
            src: "./assets/icon/sensor.png",
            color: "yellow",
          }),
        })
      });
      map.addLayer(layer);
      layer.setVisible(sensor.isMarkerVisible);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
