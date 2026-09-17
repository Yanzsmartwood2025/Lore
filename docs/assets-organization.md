# Organización de assets

Los recursos visuales permanentes de la interfaz y la marca se guardan versionados dentro del repositorio.

- `public/assets/brand/intro/`: imágenes fijas del intro/splash.
- `public/assets/brand/pwa/`: iconos y recursos usados por PWA, metadata y favicon.

Los archivos grandes o dinámicos no deben vivir en Git. Videos, galerías de usuarios, audio, material exclusivo y contenido que pueda crecer con el uso deben almacenarse en Cloudflare R2.

Esta separación mantiene el deploy ligero, deja los recursos críticos de la interfaz versionados junto con el código y evita convertir el repositorio en una bodega de medios.

Los archivos históricos de `public/images/` se mantienen temporalmente por compatibilidad. Una vez verificado el deploy con las nuevas rutas, pueden limpiarse en una tarea separada.
