# Immersive media preview

- A single YouTube iframe remains mounted across navigation and layout swaps. Custom controls are outside the player; its viewport is at least 200 × 200 CSS pixels.
- Desktop uses a large character stage and a smaller YouTube region on the right. Narrow screens stack the regions to avoid overlap. Swap changes their sizes without reloading YouTube.
- Controls hide after five seconds without interaction, except while a keyboard user has visible focus inside them. A permanent external button restores them.
- The lobby volume target is 65; other routes use 22, with a 1.2-second transition. Mute remains independent. This is volume attenuation, not filtering or spatial audio.
- The procedural WebGL sphere uses capped pixel density and frame rate, skips drawing offscreen/in background, respects reduced motion, and has a CSS fallback. Animation is decorative, not beat detection.
- To connect an authorized dance clip, set the optional `danceVideoSrc` of a persona in `src/data/models.ts` to a browser-playable HTTPS URL or public asset path. No dance assets were present. Videos are muted, loop inline and pause when music pauses or the document is hidden. Failed playback falls back to the sphere.
- No haptics, audio extraction, YouTube overlays, paid services, new dependencies or credential changes.

Validation: TypeScript and targeted ESLint passed. Local browser verification was blocked by ERR_BLOCKED_BY_CLIENT; inspect mobile and desktop preview before merge. Live sound, embedded playback, swap continuity and device WebGL performance still require browser/device verification.
