import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { ZipExtractor } from "../plugins/ZipExtractor";

class MapFileStorage {
  async downloadAndExtractCity(cityName: string, fileUrl: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const zipPath = `maps/${cityName}.zip`;

    await this.ensureDirectory("maps", Directory.Cache);

    const zipUri = await Filesystem.getUri({
      directory: Directory.Cache,
      path: zipPath,
    });

    await FileTransfer.downloadFile({
      url: fileUrl,
      path: zipUri.uri,
      progress: false,
    });

    await ZipExtractor.unzipTiles({
      zipUri: zipUri.uri,
    });

    await Filesystem.deleteFile({
      directory: Directory.Cache,
      path: zipPath,
    }).catch(() => {
      // Se il file temporaneo non viene eliminato, non blocchiamo l'app.
    });
  }

  async clearMapFiles(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await Filesystem.rmdir({
      path: "tiles",
      directory: Directory.Data,
      recursive: true,
    }).catch(() => {
      // Se la cartella non esiste, va bene.
    });

    await Filesystem.rmdir({
      path: "maps",
      directory: Directory.Cache,
      recursive: true,
    }).catch(() => {
      // Se la cartella non esiste, va bene.
    });
  }

  private async ensureDirectory(path: string, directory: Directory): Promise<void> {
    await Filesystem.mkdir({
      path,
      directory,
      recursive: true,
    }).catch(() => {
      // La cartella può già esistere.
    });
  }
}

export const mapFileStorage = new MapFileStorage();




/*import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import JSZip from "jszip";

class MapFileStorage {
  async downloadAndExtractCity(cityName: string, fileUrl: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const zipPath = `maps/${cityName}.zip`;

    await this.ensureDirectory("maps", Directory.Cache);

    const zipUri = await Filesystem.getUri({
      directory: Directory.Cache,
      path: zipPath,
    });

    await FileTransfer.downloadFile({
      url: fileUrl,
      path: zipUri.uri,
      progress: false,
    });

    const zipContent = await Filesystem.readFile({
      directory: Directory.Cache,
      path: zipPath,
    });

    const zipData =
      typeof zipContent.data === "string"
        ? zipContent.data
        : await zipContent.data.arrayBuffer();

    const zip =
      typeof zipData === "string"
        ? await JSZip.loadAsync(zipData, { base64: true })
        : await JSZip.loadAsync(zipData);

    const tileFiles = Object.values(zip.files).filter((file) => {
      return (
        !file.dir &&
        !file.name.startsWith("__MACOSX/") &&
        file.name.toLowerCase().endsWith(".png")
      );
    });

    if (tileFiles.length === 0) {
      throw new Error("Nessuna tile PNG trovata nello ZIP.");
    }

    for (const tileFile of tileFiles) {
      const tilePath = this.normalizeTilePath(tileFile.name);

      await this.ensureParentDirectory(tilePath);

      const base64Data = await tileFile.async("base64");

      await Filesystem.writeFile({
        path: tilePath,
        data: base64Data,
        directory: Directory.Data,
      });
    }

    await Filesystem.deleteFile({
      directory: Directory.Cache,
      path: zipPath,
    }).catch(() => {
      // Se il file ZIP temporaneo non viene eliminato, non blocchiamo l'app.
    });
  }

  async clearMapFiles(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await Filesystem.rmdir({
      path: "tiles",
      directory: Directory.Data,
      recursive: true,
    }).catch(() => {
      // Se la cartella non esiste, va bene.
    });

    await Filesystem.rmdir({
      path: "maps",
      directory: Directory.Cache,
      recursive: true,
    }).catch(() => {
      // Se la cartella non esiste, va bene.
    });
  }

  private normalizeTilePath(zipPath: string): string {
    const cleanedPath = zipPath.replace(/\\/g, "/").replace(/^\/+/, "");

    const tilesIndex = cleanedPath.indexOf("tiles/");

    if (tilesIndex >= 0) {
      return cleanedPath.substring(tilesIndex);
    }

    return `tiles/${cleanedPath}`;
  }

  private async ensureParentDirectory(filePath: string): Promise<void> {
    const parentDirectory = filePath.split("/").slice(0, -1).join("/");

    if (!parentDirectory) {
      return;
    }

    await this.ensureDirectory(parentDirectory, Directory.Data);
  }

  private async ensureDirectory(path: string, directory: Directory): Promise<void> {
    await Filesystem.mkdir({
      path,
      directory,
      recursive: true,
    }).catch(() => {
      // La cartella può già esistere.
    });
  }
}

export const mapFileStorage = new MapFileStorage();
*/