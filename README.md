# C.F.C.P Marchica

Web de C.F.C.P Marchica (Centre de Formation des Conducteurs Professionnels),
centro de formación para la carte professionnelle en Nador. Página única en
**francés** (idioma principal) con versión en **inglés, español y alemán**
(selector «FR» arriba a la derecha y enlaces en el pie).

Colores del logo: ámbar `#E7963F` (sol), gris `#7A7A7A` (carretera) y verde
`#348F82` (laguna Marchica), sobre papel cálido y tinta verde muy oscura.
Tipografías: Plus Jakarta Sans (titulares) e Inter (texto).

## Ver la web

Doble clic en `index.html`, o con un servidor local:

    python3 -m http.server 8765

y abrir http://localhost:8765

## Publicar

Web estática, sin instalación ni compilación: sube todo el contenido de esta
carpeta (incluido `.htaccess`) a `public_html` en Hostinger, a GitHub Pages o a
cualquier hosting estático.

## Dónde cambiar los datos

- `index.html`: textos en francés, teléfonos, dirección, Instagram, Facebook y mapa.
- `lib/i18n-en.js`, `lib/i18n-es.js`, `lib/i18n-de.js`: los mismos textos en
  inglés, español y alemán (cada clave corresponde a un `data-i18n` del HTML),
  más el mensaje de WhatsApp y las preguntas del quiz en ese idioma.
- `lib/manifest.js`: número de WhatsApp, horario y días de apertura (`hours`),
  mensajes de WhatsApp y quiz en francés, y textos que pinta el JavaScript.
- `styles.css`: colores y tipografías (variables al principio del archivo).

Al cambiar CSS o JS, actualiza el `?v=…` de las etiquetas `<link>` y
`<script>` de `index.html` para que el navegador no use la versión en caché.

## El vídeo de la portada

Cuatro planos en `assets/video/` que se funden uno tras otro (8 s cada uno) y
una barra abajo a la derecha que muestra el avance y permite saltar de plano:

| Archivo | Plano | Origen |
| --- | --- | --- |
| `clip-bus.mp4` | Autobuses en autopista al amanecer, vista aérea | Mixkit 1945 |
| `clip-nuit.mp4` | Conductor de camión de noche | Mixkit 17228 |
| `clip-autoroute.mp4` | Camión de carga en autopista | Mixkit 28787 |
| `clip-volant.mp4` | Manos al volante | Mixkit 33327 |

Los vídeos de Mixkit (mixkit.co) tienen licencia gratuita que permite el uso
comercial sin citar la fuente. Cada `.webp` con el mismo nombre es su portada
(se ve mientras carga el vídeo y cuando el móvil ahorra datos). Para poner un
vídeo propio del centro, sustituye un `.mp4` y su `.webp` manteniendo el nombre.

## Fotos

Las fotos de la sala están en `assets/img/` en WebP, en dos tamaños cada una.
Aparecen en las tarjetas del centro, en la sección que crece hasta llenar la
pantalla, en el panel del programa y en la galería.
`assets/img/partage.jpg` es la imagen que aparece al compartir el enlace en
WhatsApp o redes.

## Animaciones

Todas en `main.js` (JavaScript clásico, sin librerías): vídeo por planos,
titulares que suben palabra a palabra, foto que crece con el scroll, cinta de
oficios que reacciona a la velocidad del scroll, galería que avanza en
horizontal en escritorio, programa que avanza solo, carretera del recorrido con
el coche, contadores, inclinación 3D y botones magnéticos (solo con ratón).

## Pendiente de confirmar con el centro

- Días de apertura: la web considera abierto de lunes a sábado de 9 h a 17 h
  (`hours.openDays` en `lib/manifest.js`).
- Enlace exacto de la página de Facebook (ahora lleva a una búsqueda de «CFC Marchica»).
- Ubicación exacta en el mapa (ahora apunta a Hay El Matar, Nador).
- Cuando haya dominio: poner la URL completa en `og:image` de `index.html`
  (las redes necesitan una dirección absoluta para mostrar la imagen).
