# Diagnóstico del mapa de hábitat

## Problemas encontrados

1. El lienzo estaba fijado a `900 × 500` puntos. En teléfonos estrechos el SVG se centraba con recortes y en tabletas quedaban márgenes; el `viewBox` no se adaptaba al tamaño disponible ni a la orientación horizontal.
2. La proyección se calculaba una sola vez con el tamaño fijo. Aunque Natural Earth era una buena elección, no usaba el ancho real del viewport, por lo que el mapa no conservaba una escala visual consistente.
3. Los países resaltados se identificaban comparando nombres traducibles, con alias incompletos. Eso podía dejar regiones nativas sin color o marcar el país equivocado. La fuente ahora normaliza cada región a ids numéricos de `world-atlas`.
4. La interacción usaba `PanResponder` y estado React para cada movimiento. Cada gesto volvía a renderizar todos los paths y el mapa se sentía estático. La transformación ahora se aplica a un único grupo visual con valores de Reanimated; los paths se precalculan y se cachean por tamaño.
5. No había doble toque centrado, inercia, encuadre automático por especie ni límites basados en el tamaño real del viewport. Los controles sólo cambiaban una escala global.
6. Los marcadores y textos se dibujaban como decoración fija. No distinguían bien entre zoom lejano y cercano, y no había una tarjeta contextual al tocar una zona nativa.
7. La topología `countries-110m` era válida para un mapa mundial ligero, pero el render anterior no respetaba su geometría al escalar. Se mantiene para rendimiento offline y se usan sus fronteras reales, sin cajas geográficas aproximadas.

## Correcciones aplicadas

- Proyección `geoNaturalEarth1` con `fitExtent` al tamaño medido del viewport y márgenes constantes.
- Paths y centroides memoizados por dimensiones; un solo `Animated.View` transforma el SVG completo.
- IDs numéricos compatibles con `world-atlas`, validación del atlas, centroides y bounding boxes en `habitatService`.
- Pellizco, arrastre, doble toque, botones `+/-`, reinicio, límites, inercia suave y encuadre automático.
- Marcadores pulsantes, etiquetas sólo con zoom suficiente y tarjeta inferior accesible.
- Selector horizontal de especies, estados de carga/error/vacío, resumen para lectores de pantalla y tema claro/oscuro.
