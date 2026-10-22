import { ImageSourcePropType } from 'react-native';

/**
 * Mapa estático de imágenes locales de plantas empaquetadas físicamente en el APK.
 * Garantiza disponibilidad 100% offline y carga instantánea a 0 ms.
 */
export const PLANT_LOCAL_IMAGES: Record<string, ImageSourcePropType> = {
  'albahaca': require('../assets/plants/albahaca.jpg'),
  'alocasia-amazonica': require('../assets/plants/alocasia-amazonica.jpg'),
  'aloe-vera': require('../assets/plants/aloe-vera.jpg'),
  'anturio': require('../assets/plants/anturio.jpg'),
  'areca': require('../assets/plants/areca.jpg'),
  'begonia-maculata': require('../assets/plants/begonia-maculata.jpg'),
  'bonsai-ficus': require('../assets/plants/bonsai-ficus.jpg'),
  'bromelia': require('../assets/plants/bromelia.jpg'),
  'cactus-asiento-suegra': require('../assets/plants/cactus-asiento-suegra.jpg'),
  'cactus-navidad': require('../assets/plants/cactus-navidad.jpg'),
  'calathea': require('../assets/plants/calathea.jpg'),
  'chamaedorea': require('../assets/plants/chamaedorea.jpg'),
  'cinta': require('../assets/plants/cinta.jpg'),
  'croton': require('../assets/plants/croton.jpg'),
  'dieffenbachia': require('../assets/plants/dieffenbachia.jpg'),
  'dracaena-marginata': require('../assets/plants/dracaena-marginata.jpg'),
  'espatifilo': require('../assets/plants/espatifilo.jpg'),
  'eucalipto': require('../assets/plants/eucalipto.jpg'),
  'ficus-benjamina': require('../assets/plants/ficus-benjamina.jpg'),
  'ficus-elastica': require('../assets/plants/ficus-elastica.jpg'),
  'ficus-lyrata': require('../assets/plants/ficus-lyrata.jpg'),
  'filodendro-birkin': require('../assets/plants/filodendro-birkin.jpg'),
  'filodendro-brasil': require('../assets/plants/filodendro-brasil.jpg'),
  'geranio': require('../assets/plants/geranio.jpg'),
  'helecho-boston': require('../assets/plants/helecho-boston.jpg'),
  'hibisco': require('../assets/plants/hibisco.jpg'),
  'hortensia': require('../assets/plants/hortensia.jpg'),
  'jade': require('../assets/plants/jade.jpg'),
  'jazmin': require('../assets/plants/jazmin.jpg'),
  'lavanda': require('../assets/plants/lavanda.jpg'),
  'maranta': require('../assets/plants/maranta.jpg'),
  'menta': require('../assets/plants/menta.jpg'),
  'monstera': require('../assets/plants/monstera.jpg'),
  'monstera-adansonii': require('../assets/plants/monstera-adansonii.jpg'),
  'orchid': require('../assets/plants/orchid.jpg'),
  'oregano': require('../assets/plants/oregano.jpg'),
  'orquidea-vanda': require('../assets/plants/orquidea-vanda.jpg'),
  'pachira': require('../assets/plants/pachira.jpg'),
  'peperomia-obtusifolia': require('../assets/plants/peperomia-obtusifolia.jpg'),
  'pilea': require('../assets/plants/pilea.jpg'),
  'planta-dolar': require('../assets/plants/planta-dolar.jpg'),
  'pothos': require('../assets/plants/pothos.jpg'),
  'potus-plateado': require('../assets/plants/potus-plateado.jpg'),
  'romero': require('../assets/plants/romero.jpg'),
  'sansevieria': require('../assets/plants/sansevieria.jpg'),
  'senecio-rosario': require('../assets/plants/senecio-rosario.jpg'),
  'singonio': require('../assets/plants/singonio.jpg'),
  'succulent': require('../assets/plants/succulent.jpg'),
  'suculenta-cebra': require('../assets/plants/suculenta-cebra.jpg'),
  'tomillo': require('../assets/plants/tomillo.jpg'),
  'tradescantia-zebrina': require('../assets/plants/tradescantia-zebrina.jpg'),
  'zamioculcas': require('../assets/plants/zamioculcas.jpg'),
};

/**
 * Resuelve la fuente de imagen para una planta: prioriza fotos del usuario (cámara),
 * luego el asset local integrado en el APK, y finalmente URLs remotas como fallback.
 */
export function getPlantImageSource(
  imageUriOrId?: string | null,
  speciesId?: string | null
): ImageSourcePropType | null {
  // 1. Si el usuario tomó una foto propia con la cámara/galería (file:// o content://)
  if (imageUriOrId && (imageUriOrId.startsWith('file://') || imageUriOrId.startsWith('content://'))) {
    return { uri: imageUriOrId };
  }
  // 2. Si hay un speciesId que coincide con un asset local integrado en el APK
  if (speciesId && PLANT_LOCAL_IMAGES[speciesId]) {
    return PLANT_LOCAL_IMAGES[speciesId];
  }
  // 3. Si imageUriOrId coincide con un ID del catálogo local
  if (imageUriOrId && PLANT_LOCAL_IMAGES[imageUriOrId]) {
    return PLANT_LOCAL_IMAGES[imageUriOrId];
  }
  // 4. Si es una URL web remota (fallback)
  if (imageUriOrId && (imageUriOrId.startsWith('http://') || imageUriOrId.startsWith('https://'))) {
    return { uri: imageUriOrId };
  }
  return null;
}
