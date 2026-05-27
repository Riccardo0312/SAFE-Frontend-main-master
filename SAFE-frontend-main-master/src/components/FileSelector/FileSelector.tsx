import { useState, useEffect } from "react";
import { IonButton, IonText } from "@ionic/react";
import { Chooser } from "@awesome-cordova-plugins/chooser";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { FilePath } from "@awesome-cordova-plugins/file-path";
import { NativeStorage } from '@awesome-cordova-plugins/native-storage';

import "./FileSelector.css";
const FileSelector: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    Preferences.get({key : "lastUpdate"}).then(async ({value}) =>{
        if (value && value !== "") {
                setLastUpdate(value);
              }
        });
    }, []);

  function parseCsvFile(fileContent: string) {
    let items = [];
    const rows = fileContent.split("\n");
    for (let i = 1; i < rows.length; i++) {
      const item = rows[i].split(",");
      items.push({
        DEVICE_ID: item[0],
        RSSI: item[2],
        LATITUDE: item[3],
        LONGITUDE: item[4],
        EVENT_TIME: item[5],
      });
    }
    console.log(items);
    return items;
  }

  function fromUrlToText(url: string) {
    return new Promise(async (resolve, reject) => {
      fetch(url, { method: "GET" })
        .then((data) => data.blob())
        .then((res) => {
          var reader = new FileReader();
          reader.readAsText(res);
          reader.onloadend = () => {
            return resolve(reader.result);
          };
        })
        .catch((error) => {
          reject(error); // error message as string
        });
    });
  }

  function updateStorage(csvFile: any) {
    const date = new Date().toLocaleString();
    setLastUpdate(date);
    NativeStorage.setItem("lastUpdate", date);
    NativeStorage.setItem("sampling", csvFile);
  }

  async function selectFilePath() {
    try {
      const selectedFile = await Chooser.getFile();
      if (!selectedFile) throw "Operation cancelled";
const resolvedPath = await FilePath.resolveNativePath((selectedFile as any).uri || (selectedFile as any).dataURI);      const url = Capacitor.convertFileSrc(resolvedPath);
      const fileRaw: any = await fromUrlToText(url);
      const csvFile = parseCsvFile(fileRaw);
      updateStorage(csvFile);
      console.log("File uploaded successfully.");
    } catch (err) {
      console.log("There was an error trying to load the file.", err);
    }
  }

  return (
    <div className="fileselector">
      <IonText>
        Ultimo aggiornamento:
        {lastUpdate !== "" ? " " + lastUpdate : " Mai"}
      </IonText>
      <IonButton onClick={selectFilePath} color="primary" shape="round">
        {lastUpdate === "" ? "Seleziona file" : "Aggiorna file"}
      </IonButton>
    </div>
  );
};

export default FileSelector;
