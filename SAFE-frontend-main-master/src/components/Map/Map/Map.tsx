/*
import React, { useContext, useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import { fromLonLat } from 'ol/proj';
import "ol/ol.css";
import "./Map.css";
import { HeatmapLayer, GeolocationLayer, MarkerLayer } from "../Layers";
import { MapContext } from "../../../providers/MapProvider";
import { ContextMapType, ContextSensorsType } from "../../../providers/types";
import { CentroidsLayer } from "../Layers/Centroids";
import { SensorsContext } from "../../../providers/SensorsProvider";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

export const MapComponent: React.FC = () => {
  const {
    orientation,
    setFollowUser,
    followUser,
    geolocation,
    addMapListener,
    downloadedCities,
  } = useContext(MapContext) as ContextMapType;

  const { sensors, loadDataSensor } = useContext(
    SensorsContext
  ) as ContextSensorsType;

  const mapDivRef = useRef<HTMLDivElement>(null);

  const baseLayerRef = useRef(
    new TileLayer({
      source: new XYZ({
        url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      }),
    })
  );

  const [map] = useState<Map>(
    () =>
      new Map({
        layers: [baseLayerRef.current],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 15,
          maxZoom: 30,
          minZoom: 0,
        }),
      })
  );

  useEffect(() => {
    loadDataSensor();

    const timeout = setTimeout(() => {
      if (mapDivRef.current != null) {
        map.setTarget(mapDivRef.current);

        addMapListener((location) =>
          map.getView().setCenter(fromLonLat([location.lon, location.lat]))
        );
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      map.setTarget(undefined);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const updateBaseLayer = async () => {
      if (Capacitor.isNativePlatform() && downloadedCities.length > 0) {
        const result = await Filesystem.getUri({
          directory: Directory.Data,
          path: "tiles",
        });

        const baseUrl = Capacitor.convertFileSrc(result.uri).replace(/\/$/, "");

        baseLayerRef.current.setSource(
          new XYZ({
            url: `${baseUrl}/{z}/{x}/{y}.png`,
          })
        );

        return;
      }

      baseLayerRef.current.setSource(
        new XYZ({
          url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        })
      );
    };

    void updateBaseLayer();
  }, [downloadedCities]);

  useEffect(() => {
    if (!followUser) {
      return;
    }

    map.getView().setRotation(orientation);
    map.getView().setCenter(fromLonLat([geolocation.lon, geolocation.lat]));
  }, [followUser, orientation, geolocation, map]);

  useEffect(() => {
    const handlePointerMove = () => {
      if (followUser) {
        setFollowUser(false);
      }
    };

    map.on("pointermove", handlePointerMove);

    return () => {
      map.un("pointermove", handlePointerMove);
    };
  }, [map, followUser, setFollowUser]);

  return (
    <div className="map" ref={mapDivRef}>
      {sensors.map((sensor, index) => (
        <HeatmapLayer key={`heatmap-${index}`} map={map} sensor={sensor} />
      ))}

      {sensors.map((sensor, index) => (
        <CentroidsLayer key={`centroid-${index}`} map={map} sensor={sensor} />
      ))}

      {sensors.map((sensor, index) => (
        <MarkerLayer key={`marker-${index}`} map={map} sensor={sensor} />
      ))}

      <GeolocationLayer map={map} />
    </div>
  );
};
*/

import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";

import "ol/ol.css";
import "./Map.css";

import {
  HeatmapLayer,
  GeolocationLayer,
  MarkerLayer,
} from "../Layers";

import { CentroidsLayer } from "../Layers/Centroids";

import { MapContext } from "../../../providers/MapProvider";
import { SensorsContext } from "../../../providers/SensorsProvider";

import type {
  ContextMapType,
  ContextSensorsType,
} from "../../../providers/types";

import { Capacitor } from "@capacitor/core";
import {
  Filesystem,
  Directory,
} from "@capacitor/filesystem";

/*
 * Per il momento è false, così possiamo verificare
 * heatmap e sensori usando OpenStreetMap.
 *
 * Diventerà true solo dopo aver verificato il percorso
 * reale delle tile estratte.
 */
const ENABLE_OFFLINE_TILES = false;

export const MapComponent: React.FC = () => {
  const {
    orientation,
    setFollowUser,
    followUser,
    geolocation,
    addMapListener,
    downloadedCities,
  } = useContext(MapContext) as ContextMapType;

  const {
    sensors,
    loadDataSensor,
  } = useContext(
    SensorsContext
  ) as ContextSensorsType;

  const mapDivRef = useRef<HTMLDivElement>(null);

  /*
   * Il layer base viene creato inizialmente con OSM.
   */
  const baseLayerRef = useRef(
    new TileLayer({
      source: new OSM(),
    })
  );

  /*
   * Centro iniziale sulle coordinate sintetiche
   * utilizzate per il Polo A di Camerino.
   */
  const [map] = useState<Map>(
    () =>
      new Map({
        layers: [baseLayerRef.current],

        view: new View({
          center: fromLonLat([
            13.06871045495453,
            43.13949018030894,
          ]),

          zoom: 18,
          maxZoom: 22,
          minZoom: 2,
        }),
      })
  );

  /*
   * Collega OpenLayers al div della pagina.
   */
  useEffect(() => {
    void loadDataSensor();

    if (mapDivRef.current) {
      map.setTarget(mapDivRef.current);

      /*
       * Forza OpenLayers a ricalcolare le dimensioni
       * dopo che Ionic ha mostrato la pagina.
       */
      requestAnimationFrame(() => {
        map.updateSize();
      });

      addMapListener((location) => {
        map.getView().setCenter(
          fromLonLat([
            location.lon,
            location.lat,
          ])
        );
      });
    }

    return () => {
      map.setTarget(undefined);
    };

    // Il listener viene inizializzato una sola volta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Gestione del layer di base.
   *
   * Con ENABLE_OFFLINE_TILES=false resta sempre OSM.
   * Questo permette di verificare subito la heatmap.
   */
  useEffect(() => {
    const updateBaseLayer = async () => {
      if (
        !ENABLE_OFFLINE_TILES ||
        !Capacitor.isNativePlatform() ||
        downloadedCities.length === 0
      ) {
        baseLayerRef.current.setSource(
          new OSM()
        );

        return;
      }

      try {
        /*
         * ATTENZIONE:
         * "tiles" deve coincidere esattamente con la
         * directory usata da ZipExtractorPlugin.
         */
        const result =
          await Filesystem.getUri({
            directory: Directory.Data,
            path: "tiles",
          });

        const baseUrl =
          Capacitor.convertFileSrc(
            result.uri
          ).replace(/\/$/, "");

        const tileUrl =
          `${baseUrl}/{z}/{x}/{y}.png`;

        console.log(
          "Template tile offline:",
          tileUrl
        );

        baseLayerRef.current.setSource(
          new XYZ({
            url: tileUrl,
            wrapX: false,
          })
        );
      } catch (error) {
        console.error(
          "Errore caricamento tile offline:",
          error
        );

        /*
         * Se il caricamento offline fallisce,
         * viene mantenuta una mappa utilizzabile.
         */
        baseLayerRef.current.setSource(
          new OSM()
        );
      }
    };

    void updateBaseLayer();
  }, [downloadedCities]);

  /*
   * Segue la posizione dell'utente solamente quando
   * sono disponibili coordinate valide.
   *
   * Senza questo controllo la posizione iniziale
   * [0, 0] sposterebbe la mappa lontano da Camerino.
   */
  useEffect(() => {
    if (!followUser) {
      return;
    }

    const hasValidLocation =
      Number.isFinite(geolocation.lat) &&
      Number.isFinite(geolocation.lon) &&
      !(
        geolocation.lat === 0 &&
        geolocation.lon === 0
      );

    if (!hasValidLocation) {
      return;
    }

    map.getView().setRotation(
      orientation
    );

    map.getView().setCenter(
      fromLonLat([
        geolocation.lon,
        geolocation.lat,
      ])
    );
  }, [
    followUser,
    orientation,
    geolocation.lat,
    geolocation.lon,
    map,
  ]);

  /*
   * Quando l'utente trascina la mappa,
   * viene disattivato il follow automatico.
   */
  useEffect(() => {
    const handlePointerDrag = () => {
      if (followUser) {
        setFollowUser(false);
      }
    };

    map.on(
      "pointerdrag",
      handlePointerDrag
    );

    return () => {
      map.un(
        "pointerdrag",
        handlePointerDrag
      );
    };
  }, [
    map,
    followUser,
    setFollowUser,
  ]);

  return (
    <div
      className="map"
      ref={mapDivRef}
    >
      {sensors.map((sensor) => (
        <HeatmapLayer
          key={`heatmap-${sensor.id}`}
          map={map}
          sensor={sensor}
        />
      ))}

      {sensors.map((sensor) => (
        <CentroidsLayer
          key={`centroid-${sensor.id}`}
          map={map}
          sensor={sensor}
        />
      ))}

      {sensors.map((sensor) => (
        <MarkerLayer
          key={`marker-${sensor.id}`}
          map={map}
          sensor={sensor}
        />
      ))}

      <GeolocationLayer map={map} />
    </div>
  );
};
