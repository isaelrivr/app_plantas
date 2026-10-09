/**
 * Plantae Image Compression
 *
 * Antes de enviar fotos al backend las reducimos a ~1024 px y JPEG calidad 0.7.
 * Así cada imagen pesa ~100-400 KB (el servidor rechaza > ~1.1 MB base64) y el
 * análisis es más rápido. Usa la API moderna de expo-image-manipulator.
 */

import { Image } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface CompressedImage {
  uri: string;
  base64: string;
  width: number;
  height: number;
}

export interface CompressOptions {
  /** Lado mayor máximo en píxeles. */
  maxDimension?: number;
  /** Calidad JPEG 0..1. */
  quality?: number;
}

const DEFAULT_MAX_DIMENSION = 1024;
const DEFAULT_QUALITY = 0.7;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

/**
 * Comprime una imagen local y devuelve también su base64 (sin prefijo data:).
 */
export async function compressImage(uri: string, options: CompressOptions = {}): Promise<CompressedImage> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;

  const context = ImageManipulator.manipulate(uri);

  // Redimensionamos solo si la imagen supera el lado máximo, preservando ratio.
  try {
    const { width, height } = await getImageSize(uri);
    if (Math.max(width, height) > maxDimension) {
      if (width >= height) {
        context.resize({ width: maxDimension });
      } else {
        context.resize({ height: maxDimension });
      }
    }
  } catch {
    // Sin dimensiones fiables, guardamos la original recomprimida.
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: quality,
    format: SaveFormat.JPEG,
    base64: true,
  });

  return {
    uri: saved.uri,
    base64: saved.base64 ?? '',
    width: saved.width,
    height: saved.height,
  };
}

/**
 * Comprime una lista de imágenes (la cámara puede aportar varias de la misma
 * planta). Ignora las que fallan en vez de romper todo el flujo.
 */
export async function compressImages(
  uris: string[],
  options: CompressOptions & { max?: number } = {}
): Promise<CompressedImage[]> {
  const max = options.max ?? 4;
  const selected = uris.slice(0, max);
  const compressed = await Promise.all(
    selected.map(async (uri) => {
      try {
        return await compressImage(uri, options);
      } catch (error) {
        console.warn('[imageCompression] No se pudo comprimir una imagen.', error);
        return null;
      }
    })
  );
  return compressed.filter((item): item is CompressedImage => item !== null && item.base64.length > 0);
}
