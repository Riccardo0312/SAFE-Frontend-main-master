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

export const MapComponent: React.FC = () => {
  const { orientation, setFollowUser, followUser, geolocation, addMapListener } = useContext(MapContext) as ContextMapType;
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