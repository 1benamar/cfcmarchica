# C.F.C.P Marchica

Web de C.F.C.P Marchica (Centre de Formation des Conducteurs Professionnels),
centro de formación para la carte professionnelle en Nador. Página única en
**francés y árabe** (botón «ع / FR» arriba; el árabe se lee de derecha a izquierda).

Colores del logo: ámbar `#E7963F` (sol), gris `#7A7A7A` (carretera) y verde
`#348F82` (laguna Marchica), sobre papel cálido y tinta verde muy oscura.

## Ver la web

Doble clic en `index.html`, o con un servidor local:

    python3 -m http.server 8765

y abrir http://localhost:8765

## Publicar

Web estática, sin instalación ni compilación: sube todo el contenido de esta
carpeta (incluido `.htaccess`) a `public_html` en Hostinger o a cualquier
hosting estático. La carpeta `tools/` no hace falta subirla.

## Dónde cambiar los datos

- `index.html`: textos en francés, teléfonos, dirección, Instagram, Facebook y mapa.
- `lib/i18n-ar.js`: los mismos textos en árabe (cada clave corresponde a un `data-i18n` del HTML).
- `lib/manifest.js`: número de WhatsApp, horario y días de apertura (`hours`), mensajes de WhatsApp, preguntas del quiz y textos que pinta el JavaScript.
- `styles.css`: colores y tipografías (variables al principio del archivo).

Al cambiar CSS o JS, actualiza el `?v=AAAAMMDD` de las etiquetas `<link>` y
`<script>` de `index.html` para que el navegador no use la versión en caché.

## El vídeo de la portada

`assets/video/` tiene el vídeo en tres versiones (escritorio 1080p y 720p, móvil
vertical) más WebM de reserva y los pósters. Es una animación propia: la
carretera junto a la laguna Marchica a la hora azul, con los colores del logo.
Se genera con `tools/video/` (Three.js en Chromium + ffmpeg):

    cd tools/video && npm install && node render.mjs

Para poner un vídeo propio (por ejemplo un reel del centro), sustituye
`hero-1080.mp4`, `hero-720.mp4` y `hero-movil.mp4` (vertical) manteniendo los
nombres, y los pósters `hero-poster.webp` y `hero-poster-movil.webp`.

## Fotos

Las fotos de la sala están en `assets/img/` en WebP, en dos tamaños cada una.
`assets/img/partage.jpg` es la imagen que aparece al compartir el enlace en
WhatsApp o redes.

## Pendiente de confirmar con el centro

- Días de apertura: la web considera abierto de lunes a sábado de 9 h a 17 h
  (`hours.openDays` en `lib/manifest.js`).
- Enlace exacto de la página de Facebook (ahora lleva a una búsqueda de «CFC Marchica»).
- Ubicación exacta en el mapa (ahora apunta a Hay El Matar, Nador).
- Cuando haya dominio: poner la URL completa en `og:image` de `index.html`
  (las redes necesitan una dirección absoluta para mostrar la imagen).
