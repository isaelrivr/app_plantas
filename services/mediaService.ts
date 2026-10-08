/**
 * Plantae Media Service
 *
 * Las fotos que devuelve la cámara o el selector de galería viven en un
 * directorio temporal (cache) que el sistema puede vaciar. Para que una foto
 * guardada en el jardín o en el diario siga existiendo tras cerrar la app,
 * la copiamos al directorio de documentos del app y guardamos esa ruta.
 *
 * Usa la API moderna de expo-file-system (File / Directory / Paths).
 */

import { Directory, File, Paths } from 'expo-file-system';

const MEDIA_ROOT = 'plantae-media';

/** Devuelve (creando si hace falta) una subcarpeta dentro de documentDirectory. */
function ensureDirectory(folder: string): Directory | null {
  try {
    const dir = new Directory(Paths.document, MEDIA_ROOT, folder);
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
    return dir;
  } catch (error) {
    console.warn('[media] No se pudo preparar el directorio de documentos.', error);
    return null;
  }
}

function extensionOf(uri: string): string {
  const withoutQuery = uri.split('?')[0];
  const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Copia una imagen local (`file://`) al almacenamiento permanente y devuelve la
 * nueva ruta. Si la URI ya es remota (http) o no se puede copiar, devuelve la
 * original para no romper la UI.
 */
export async function persistImage(uri: string | undefined | null, folder = 'plants'): Promise<string | undefined> {
  if (!uri) return undefined;

  // Solo copiamos archivos locales; las URLs remotas se dejan tal cual.
  if (!uri.startsWith('file://')) return uri;

  const dir = ensureDirectory(folder);
  if (!dir) return uri;

  try {
    const source = new File(uri);
    if (!source.exists) return uri;

    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionOf(uri)}`;
    const destination = new File(dir, name);
    await source.copy(destination, { overwrite: true });
    return destination.uri;
  } catch (error) {
    console.warn('[media] No se pudo persistir la imagen; se usará la ruta temporal.', error);
    return uri;
  }
}

/** Borra una imagen persistida. Ignora remotos y errores. */
export async function deleteImage(uri: string | undefined | null): Promise<void> {
  if (!uri || !uri.startsWith('file://')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('[media] No se pudo borrar la imagen.', error);
  }
}

/** Borra todas las imágenes persistidas del app (usado por "Eliminar datos"). */
export async function clearPersistedImages(): Promise<void> {
  try {
    const root = new Directory(Paths.document, MEDIA_ROOT);
    if (root.exists) root.delete();
  } catch (error) {
    console.warn('[media] No se pudieron borrar las imágenes persistidas.', error);
  }
}
