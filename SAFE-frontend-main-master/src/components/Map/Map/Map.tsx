import React, { useContext, useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
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
/*
export const MapComponent: React.FC = () => {
 const {
   orientation,
   setFollowUser,
   followUser,
   geolocation,
   addMapListener,
   downloadedCities,
 } = useContext(MapContext) as ContextMapType;

  const { sensors , loadDataSensor} = useContext(SensorsContext) as ContextSensorsType;

  const mapDivRef = useRef<HTMLDivElement>(null);

  const [map] = useState<Map>(new Map({
    layers: [
      new TileLayer({
        source: new XYZ({
          url: (window as any).Ionic.WebView.convertFileSrc("file:///storage/emulated/0/Android/data/it.filippetti.jarvis.safemap/files/tiles/{z}/{x}/{y}.png"),
          //url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        })
      })
    ],
    view: new View({
      center: fromLonLat([0, 0]),
      zoom: 15,
      maxZoom: 30,
      minZoom: 0
    })
  }));

  useEffect(() => {
    loadDataSensor();
    setTimeout(() => {
      if (mapDivRef.current != null) {
        map.setTarget(mapDivRef.current);
        addMapListener((location) => map.getView().setCenter(fromLonLat([location.lon, location.lat])))
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (followUser) {
    map.getView().setRotation(orientation);
    map.getView().setCenter(fromLonLat([geolocation.lon, geolocation.lat]));
  }

  map.on("pointermove", () => {
    if (followUser)
      setFollowUser(false);
  });

  return (
    <div className="map" ref={mapDivRef}>
      {sensors.map((e, index) => <HeatmapLayer key={index} map={map} sensor={e} />)}
      {sensors.map((e, index) => <CentroidsLayer key={index} map={map} sensor={e} />)}
      {sensors.map((e, index) => <MarkerLayer key={index} map={map} sensor={e} />)}
      <GeolocationLayer map={map} />
    </div>
  );
}
*/

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
