import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton
} from '@ionic/react';
import BluetoothControls from '../../components/BluetoothControls/BluetoothControls';

const BleController: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>Controller Bluetooth</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '10px' }}>
            <BluetoothControls />
          <p>Siamo dentro la pagina del controller BLE</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BleController;