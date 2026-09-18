# Lore

Aplicación web de experiencia VIP interactiva construida con Next.js y desplegada en Vercel.

## Producción

- URL principal: https://lore-sigma.vercel.app
- Rama de producción: `main`
- Hosting: Vercel
- Base de datos: Supabase
- Autenticación actual: Firebase
- Media: YouTube + Cloudflare R2

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Supabase
- Cloudflare R2
- Font Awesome

## Funcionalidad principal

Lore incluye:

- Home inmersivo con esfera WebGL.
- Motor de iluminación sincronizado con música.
- Perfiles de luces por género musical.
- Reproductor persistente entre Home y chats.
- Biblioteca musical organizada por categorías.
- Carrusel de personajes.
- Chats por personaje.
- Login con Google mediante Firebase.
- Infraestructura de datos y contenido en Supabase/R2.
- PWA y limpieza de caché legado.

## Cambios que forman parte de la base actual

La producción actual conserva, entre otros:

- PR #63: motor de luces por género para la esfera.
- PR #64: continuidad de navegación y reproductor.
- PR #65: correcciones de build para Next.js 16.
- PR #66: limpieza de artefactos de prueba y logs.

Estos cambios ya forman parte de `main` y no deben recuperarse desde ramas antiguas.

## Autenticación Firebase → Supabase

El PR #36 (`codex/firebase-third-party-auth`) sigue siendo trabajo pendiente.

No debe fusionarse directamente sobre producción hasta:

1. actualizarlo sobre el `main` actual;
2. confirmar el Project ID correcto de Firebase;
3. configurar Third-Party Auth en Supabase;
4. desplegar y validar los claims de Firebase;
5. probar RLS con usuarios reales;
6. validar el deployment Preview en Vercel.

La producción actual debe permanecer independiente de ese PR hasta completar esas comprobaciones.

## Desarrollo local

```bash
npm install
npm run dev
```

Para verificar un build de producción:

```bash
npm run build
npm run start
```

## Variables de entorno

Las variables sensibles no deben guardarse en Git.

El proyecto utiliza variables para Firebase, Supabase, Cloudflare R2 y otras integraciones. Los archivos `.env*` están excluidos del repositorio salvo `.env.example`.

## Organización de assets

Los assets canónicos de marca están en:

```
public/assets/brand/
```

Los assets de personajes están en:

```
public/assets/models/<persona>/
```

Evitar volver a añadir archivos de prueba o copias sueltas en `public/images` cuando ya exista una ubicación canónica.

## Higiene del repositorio

- No versionar archivos `.log`.
- No subir secretos, service accounts ni archivos `.env`.
- Preferir ramas cortas y PRs pequeños.
- Verificar Preview en Vercel antes de fusionar cambios funcionales.
- Mantener `main` como referencia de producción.
