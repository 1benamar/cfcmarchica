# CFC Marchica

Web de CFC Marchica, centro de formación de la carte professionnelle en Nador (Marruecos). Página única en francés.

## Publicar

Es una web estática, sin instalación ni compilación: sube todo el contenido de esta carpeta (incluido `.htaccess`) a `public_html` en Hostinger o a cualquier hosting estático.

## Dónde cambiar los datos

- `index.html`: textos, teléfono, Instagram y mapa.
- `lib/manifest.js`: horario y días de apertura (`hours`), preguntas del quiz y mensajes de WhatsApp.
- `styles.css`: colores y tipografía (variables al principio del archivo).

Al cambiar CSS o JS, actualiza el `?v=AAAAMMDD` de las etiquetas `<link>` y `<script>` de `index.html` para que el navegador no use la versión en caché.
