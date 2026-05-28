import { registerPlugin } from "@capacitor/core";

export interface ZipExtractorPlugin {
  unzipTiles(options: { zipUri: string }): Promise<{ success: boolean }>;
}

export const ZipExtractor = registerPlugin<ZipExtractorPlugin>("ZipExtractor");