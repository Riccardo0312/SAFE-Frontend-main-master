import React, { useContext, useState } from "react";
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonPopover,
  IonButton,
  IonToggle,
  IonRange,
} from "@ionic/react";
import { settingsOutline } from "ionicons/icons";
import { ContextSensorsType } from "../../providers/types";
import { Sensor } from "../../models/sensors";
import { SensorsContext } from "../../providers/SensorsProvider";

import './Popover.css';

interface SensorItemProps {
  sensor: Sensor;
}

const Popover: React.FC<SensorItemProps> = ({ sensor }) => {
  const { sensors, setSensors } = useContext(
    SensorsContext
  ) as ContextSensorsType;

  const [showPopover, setShowPopover] = useState<{
    open: boolean;
    event: Event | undefined;
  }>({
    open: false,
    event: undefined,
  });

  function changeMarkerVisible(sensor: Sensor) {
    sensors.map((e) => {
      if (e.id === sensor.id) e.isMarkerVisible = !e.isMarkerVisible;
      return e;
    });
    setSensors(sensors);
  }

  function changeHeatMapVisible(sensor: Sensor) {
    sensors.map((e) => {
      if (e.id === sensor.id) e.isHeatmapVisible = !e.isHeatmapVisible;
      return e;
    });
    setSensors(sensors);
  }

  function changeCentroidVisible(sensor: Sensor) {
    sensors.map((e) => {
      if (e.id === sensor.id) e.isCentroidVisible = !e.isCentroidVisible;
      return e;
    });
    setSensors(sensors);
  }

  function changeHeatMapBlur(sensor: Sensor, blur: number) {
    sensors.map((e) => {
      if (e.id === sensor.id) e.heatmapBlur = blur;
      return e;
    });
    setSensors(sensors);
  }

  function changeHeatMapRadius(sensor: Sensor, radius: number) {
    sensors.map((e) => {
      if (e.id === sensor.id) e.heatmapRadius = radius;
      return e;
    });
    setSensors(sensors);
  }

  return (
    <>
      <IonPopover
        isOpen={showPopover.open}
        event={showPopover.event}
        onDidDismiss={() => {
          setShowPopover({ open: false, event: undefined });
        }}
      >
        <IonItem
        className="padding-top">
          <IonLabel>heatmap</IonLabel>
          <IonToggle
            checked={sensor.isHeatmapVisible}
            value="heatmap"
            onIonChange={() => changeHeatMapVisible(sensor)}
          />
        </IonItem>
        <IonItem
        className="padding-side">
          <IonLabel>marker</IonLabel>
          <IonToggle
            checked={sensor.isMarkerVisible}
            value="marker"
            onIonChange={() => changeMarkerVisible(sensor)}
          />
        </IonItem>
        <IonItem
        className="padding-side">
          <IonLabel>area</IonLabel>
          <IonToggle
            checked={sensor.isCentroidVisible}
            value="centroids"
            onIonChange={() => changeCentroidVisible(sensor)}
          />
        </IonItem>
        <IonItem
        className="padding-side">
          <IonLabel>radius</IonLabel>
          <IonRange
            min={5}
            max={20}
            step={1}
            snaps={true}
            value={sensor.heatmapRadius}
            onIonChange={(e) => {
              changeHeatMapRadius(sensor, e.detail.value as number);
            }}
          />
        </IonItem>
        <IonItem
        className="padding-bottom">
          <IonLabel>blur</IonLabel>
          <IonRange
            min={5}
            max={30}
            step={1}
            snaps={true}
            value={sensor.heatmapBlur}
            onIonChange={(e) => {
              changeHeatMapBlur(sensor, e.detail.value as number);
            }}
          />
        </IonItem>
      </IonPopover>
      <IonButton
        onClick={(e) => setShowPopover({ open: true, event: e.nativeEvent })}
      >
        Impostazioni
        <IonIcon icon={settingsOutline} />
      </IonButton>
    </>
  );
};

export default Popover;
