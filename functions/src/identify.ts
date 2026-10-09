/**
 * Orquestación de la identificación de plantas:
 *  1. Valida las imágenes (cantidad y tamaño).
 *  2. Consume cuota diaria (Free 3/día · Premium cupo alto).
 *  3. Llama a Plant.id v2 y normaliza los candidatos.
 */

import type { AppConfig } from './config';
import type { Identity } from './guard';
import { consumeQuota } from './rateLimit';
import { identifyWithPlantId, type PlantIdSuggestion } from './providers/plantId';
import type { IdentificationCandidate, IdentifyRequest, IdentifyResponse, ImageQualityFlags } from './types';
import { badRequest } from './errors';

/** Normaliza un nombre a un slug estable: "Monstera deliciosa" -> "monstera-deliciosa". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** Convierte "Monstera deliciosa" en un nombre presentable si no hay nombre común. */
function prettify(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.length > 2 && word === word.toLowerCase() ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
    .slice(0, 120);
}

function toCandidate(suggestion: PlantIdSuggestion): IdentificationCandidate {
  const commonName = suggestion.commonNames.find((name) => name.trim().length > 0);
  const displayName = commonName && commonName.toLowerCase() !== suggestion.name.toLowerCase() ? commonName : prettify(suggestion.name);
  return {
    id: slugify(suggestion.name) || slugify(displayName),
    name: displayName.slice(0, 120),
    scientificName: suggestion.name.slice(0, 160),
    family: suggestion.family ? suggestion.family.slice(0, 80) : 'Familia no determinada',
    genus: suggestion.genus?.slice(0, 80),
    confidence: Math.round(Math.min(1, Math.max(0, suggestion.probability)) * 100),
    commonNames: suggestion.commonNames.slice(0, 6).map((name) => name.slice(0, 120)),
    wikiDescription: suggestion.wikiDescription?.slice(0, 1200),
    referenceImages: suggestion.similarImages
      .filter((image) => image.url.length > 0)
      .slice(0, 4)
      .map((image) => ({
        small: image.urlSmall || image.url,
        full: image.url,
      })),
    source: 'ai-real',
  };
}

export async function runIdentify(config: AppConfig, identity: Identity, req: IdentifyRequest): Promise<IdentifyResponse> {
  const images = Array.isArray(req.images) ? req.images : [];
  if (images.length === 0) throw badRequest('Envía al menos una imagen base64 en el campo "images".');
  if (images.length > config.maxImagesPerRequest) {
    throw badRequest(`Puedes enviar como máximo ${config.maxImagesPerRequest} imágenes por identificación.`);
  }

  let totalBytes = 0;
  for (const image of images) {
    if (typeof image !== 'string' || image.length < 500) {
      throw badRequest('Cada imagen debe enviarse como cadena base64 válida (imagen comprimida).');
    }
    if (image.length > config.maxImageBytes) {
      throw badRequest('Cada imagen comprimida debe pesar menos de ~1.1MB (comprímela a 1024px con calidad 0.7).');
    }
    totalBytes += image.length;
  }

  await consumeQuota(identity, 'identify', config.quotas.identify);

  const upstream = await identifyWithPlantId(config, images);
  const candidates = upstream.suggestions.map(toCandidate).filter((candidate) => candidate.id.length > 0);
  const topConfidence = candidates[0]?.confidence ?? 0;

  const imageQuality: ImageQualityFlags = {};
  // Heurística honesta: una imagen útil a 1024px/0.7 suele superar ~60KB.
  if (totalBytes / images.length < 60_000) {
    imageQuality.lowResolution = true;
    imageQuality.note = 'La imagen parece tener poca resolución o nitidez. Acércate más y mejora la iluminación.';
  }
  if (!upstream.isPlant && candidates.length === 0) {
    imageQuality.lowConfidence = true;
  }

  return {
    candidates,
    isPlant: upstream.isPlant,
    imageQuality,
  };
}
