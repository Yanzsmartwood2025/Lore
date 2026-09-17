# Assets organization

Permanent UI/brand assets live in the repository under `public/assets/brand/`.

- `public/assets/brand/intro/`: fixed intro/splash images shipped with the app.
- `public/assets/brand/pwa/`: app icons and PWA/metadata images.

Large or user-generated media (videos, galleries, audio, uploaded content) belongs in Cloudflare R2 rather than Git. This keeps deployments small and separates versioned UI assets from media storage.

Legacy files under `public/images/` are kept temporarily for compatibility and can be removed after references are fully migrated and verified.
