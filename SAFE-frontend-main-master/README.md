# SAFE-frontend
Sviluppo dell'applicazione principale per localizzare e gestire i sensori all'interno di un edificio per il progetto S.A.F.E.

## Requisiti
**Software** 
* NodeJS scaricabile [QUI](https://nodejs.org/en/download/)

    Per controllare che NodeJS sia installato correttamente si possono eseguire i seguenti comandi:
    ```bash
    $ node --version
    $ npm --version
    ```
* [Ionic Framework](https://ionicframework.com/)

    Per installare Ionic basta eseguire il seguente comando:
    ```bash
    $ npm install -g @ionic/cli
    ``` 

## Configurazione
* Prima di eseguire la compilazione sarà necessario andare a configurare il progetto Android lanciando il seguente comando (all'interno della directory del progetto):
    ```bash
    $ ionic cap add android
    ```
    Questo comando aggiunge al progetto la cartella "android" che conterrà il progetto, appunto, Android.

* A questo punto dovremo andar ad inserire il contenuto della cartella [files_to_copy](/files_to_copy) all'interno di *"/android/app/src/main/"*
* Per la compilazione del progetto si dovranno eseguire i seguenti comandi (all-interno della directory del progetto):
    ```bash
    $ ionic build
    $ ionic capacitor copy android --no-build
    $ ionic capacitor open android
    ```
Una volta lanciato l'ultimo comando verrà avviato Android Studio. Da qui sarà possibile eseguire l'applicazione o generare un file di installazione .apk dal menù:
*Build->Build Boundle(s) / APK(s)->Build APK(s).*

Se, invece, si vuole eseguire l'esecuzione dell'applicativo in live-reload basterà eseguire il comando:
```bash
$ ionic cap run android -l --external
```

## Autori
* [Luca Patarca](https://github.com/LucaPatarca)
* [Lorenzo Tanganelli](https://github.com/LorenzoTanga-bot)
* [Nico Trionfetti](https://github.com/trionfettinicoUNICAM)
### Revisione
* [Erik Piccinini](https://github.com/erikpic)
* [Lorenzo Lancioni](https://github.com/LorenzoLanch)
