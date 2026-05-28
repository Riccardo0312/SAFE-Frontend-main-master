package it.filippetti.jarvis.safemap;

import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@CapacitorPlugin(name = "ZipExtractor")
public class ZipExtractorPlugin extends Plugin {

    @PluginMethod
    public void unzipTiles(PluginCall call) {
        String zipUri = call.getString("zipUri");

        if (zipUri == null || zipUri.isEmpty()) {
            call.reject("zipUri is required");
            return;
        }

        try {
            File zipFile = fileFromUri(zipUri);

            if (!zipFile.exists()) {
                call.reject("ZIP file does not exist: " + zipFile.getAbsolutePath());
                return;
            }

            File destinationDir = getContext().getFilesDir();

            unzip(zipFile, destinationDir);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Errore estrazione ZIP: " + e.getMessage(), e);
        }
    }

    private File fileFromUri(String uriString) {
        Uri uri = Uri.parse(uriString);

        if ("file".equals(uri.getScheme())) {
            return new File(uri.getPath());
        }

        return new File(uriString);
    }

    private void unzip(File zipFile, File destinationDir) throws IOException {
        byte[] buffer = new byte[8192];

        String destinationCanonicalPath = destinationDir.getCanonicalPath() + File.separator;

        try (
                FileInputStream fileInputStream = new FileInputStream(zipFile);
                BufferedInputStream bufferedInputStream = new BufferedInputStream(fileInputStream);
                ZipInputStream zipInputStream = new ZipInputStream(bufferedInputStream)
        ) {
            ZipEntry entry;

            while ((entry = zipInputStream.getNextEntry()) != null) {
                String entryName = entry.getName()
                        .replace("\\", "/")
                        .replaceFirst("^/+", "");

                if (entry.isDirectory()) {
                    zipInputStream.closeEntry();
                    continue;
                }

                if (entryName.startsWith("__MACOSX/")) {
                    zipInputStream.closeEntry();
                    continue;
                }

                if (!entryName.toLowerCase().endsWith(".png")) {
                    zipInputStream.closeEntry();
                    continue;
                }

                int tilesIndex = entryName.indexOf("tiles/");

                if (tilesIndex >= 0) {
                    entryName = entryName.substring(tilesIndex);
                } else {
                    entryName = "tiles/" + entryName;
                }

                File outputFile = new File(destinationDir, entryName);
                String outputCanonicalPath = outputFile.getCanonicalPath();

                if (!outputCanonicalPath.startsWith(destinationCanonicalPath)) {
                    throw new IOException("Zip entry non valida: " + entryName);
                }

                File parent = outputFile.getParentFile();

                if (parent != null && !parent.exists()) {
                    boolean created = parent.mkdirs();

                    if (!created && !parent.exists()) {
                        throw new IOException("Impossibile creare cartella: " + parent.getAbsolutePath());
                    }
                }

                try (FileOutputStream fileOutputStream = new FileOutputStream(outputFile)) {
                    int length;

                    while ((length = zipInputStream.read(buffer)) > 0) {
                        fileOutputStream.write(buffer, 0, length);
                    }
                }

                zipInputStream.closeEntry();
            }
        }
    }
}