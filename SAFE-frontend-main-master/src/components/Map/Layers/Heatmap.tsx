/*
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
*/

import React, {
  useContext,
  useEffect,
  useRef,
} from "react";

import { Heatmap } from "ol/layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Point } from "ol/geom";
import { Feature } from "ol";

import { SensorLayerProps } from "../map-types";

import {
  generateHeatmapResponse,
} from "../../../services/webServerUtils";

import {
  samplingRepository,
} from "../../../repositories/SamplingRepository";

import {
  SensorsContext,
} from "../../../providers/SensorsProvider";

import type {
  ContextSensorsType,
} from "../../../providers/types";

export const HeatmapLayer: React.FC<SensorLayerProps> = ({
  map,
  sensor,
}) => {
  const { samplingVersion } = useContext(
    SensorsContext
  ) as ContextSensorsType;

  const layerRef = useRef<Heatmap | null>(null);

  /*
   * Ricrea la sorgente e il layer quando:
   *
   * - cambia la mappa;
   * - cambia il sensore;
   * - vengono importate nuove misurazioni.
   */
  useEffect(() => {
    let cancelled = false;
    let createdLayer: Heatmap | null = null;

    const loadHeatmap = async () => {
      try {
        /*
         * I dati vengono letti tramite repository,
         * non più direttamente da NativeStorage.
         */
        const samplingData =
          await samplingRepository.getAll();

        if (cancelled) {
          return;
        }

        /*
         * Se non sono presenti campionamenti,
         * non viene aggiunto alcun layer.
         */
        if (samplingData.length === 0) {
          return;
        }

        const heatmapGeoJson =
          await generateHeatmapResponse(
            samplingData,
            sensor.id
          );

        if (cancelled) {
          return;
        }

        /*
         * generateHeatmapResponse converte già
         * longitudine e latitudine in EPSG:3857.
         */
        const features =
          new GeoJSON().readFeatures(
            heatmapGeoJson,
            {
              dataProjection: "EPSG:3857",
              featureProjection:
                map.getView().getProjection(),
            }
          ) as Feature<Point>[];

        /*
         * Il dataset potrebbe contenere misurazioni,
         * ma nessuna appartenente al sensore corrente.
         */
        if (features.length === 0) {
          return;
        }

        const source = new VectorSource({
          features,
        });

        const layer = new Heatmap({
          className: "heatmap",
          source,
          visible: sensor.isHeatmapVisible,
          blur: sensor.heatmapBlur,
          radius: sensor.heatmapRadius,
          weight: (feature) => {
            const value = Number(
              feature.get("rssi")
            );

            return Number.isFinite(value)
              ? value
              : 0;
          },
        });

        if (cancelled) {
          return;
        }

        createdLayer = layer;
        layerRef.current = layer;

        map.addLayer(layer);
      } catch (error) {
        console.error(
          `Errore caricamento heatmap del sensore ${sensor.id}:`,
          error
        );
      }
    };

    void loadHeatmap();

    /*
     * Quando il componente viene smontato oppure i dati
     * cambiano, il vecchio layer viene rimosso.
     */
    return () => {
      cancelled = true;

      if (createdLayer) {
        map.removeLayer(createdLayer);
      }

      if (layerRef.current === createdLayer) {
        layerRef.current = null;
      }
    };
  }, [
    map,
    sensor.id,
    samplingVersion,
  ]);

  /*
   * Aggiorna le proprietà grafiche senza ricreare
   * tutto il layer.
   */
  useEffect(() => {
    const layer = layerRef.current;

    if (!layer) {
      return;
    }

    layer.setVisible(sensor.isHeatmapVisible);
    layer.setBlur(sensor.heatmapBlur);
    layer.setRadius(sensor.heatmapRadius);
  }, [
    sensor.isHeatmapVisible,
    sensor.heatmapBlur,
    sensor.heatmapRadius,
  ]);

  return null;
};
