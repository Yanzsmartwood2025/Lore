# Firebase → Supabase Third-Party Auth

## Estado y condición de fusión

**No fusionar hasta completar las verificaciones reales del usuario.** El código
está preparado para la integración oficial. No crea usuarios nativos de Supabase,
no intercambia tokens por sesiones propias y no firma un JWT personalizado.

La inspección de Lore (`eqyrgiwgtlmcatnmclpo`) encontró un perfil vinculado,
tres conversaciones y veinte mensajes. La migración convierte el ID del perfil y
sus cinco referencias a texto; conserva créditos, VIP, mensajes y usuarios nativos
antiguos. No relaciona cuentas por coincidencia de correo.

## Despliegue pendiente, en orden

1. Abrir Firebase Console y confirmar el Project ID de la app ya conectada a Lore
   comparándolo con `NEXT_PUBLIC_FIREBASE_PROJECT_ID` de Vercel. No usar el proyecto
   de otra aplicación. Este ID no se ha podido confirmar durante esta tarea:
   la consola devolvió 502 y después el navegador agotó el tiempo de conexión.
2. En Supabase, Lore → Authentication → Third-Party Auth → Add Integration →
   Firebase: guardar ese Project ID exacto. No desactivar RLS.
3. En un entorno autenticado de Google con permiso para administrar Firebase Auth,
   instalar las dependencias de `firebase/functions` con `npm ci` y desplegar
   `assignSupabaseRole` usando Firebase CLI y `--project` con el ID confirmado.
   Configuración en `firebase.json`, runtime Node 22, trigger Auth onCreate de
   primera generación. Verificar que el proyecto ya dispone del plan/facturación
   necesarios; no activar facturación automáticamente.
4. Con Application Default Credentials, ejecutar el backfill primero en modo
   lectura y después aplicar. No guardar claves privadas en el repo ni en logs:

   ```sh
   export FIREBASE_PROJECT_ID='<ID confirmado>'
   npm --prefix firebase/functions run backfill:claims
   export CONFIRM_FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID"
   npm --prefix firebase/functions run backfill:claims -- --apply
   ```

   El script pagina todos los usuarios, preserva otros claims y devuelve un código
   distinto de cero si falla algún cambio. Es idempotente y no imprime identidades
   ni tokens. Los JWT existentes necesitan refrescarse. El cliente espera con
   reintentos acotados al claim asíncrono y ofrece reintentar si no llega.
5. Aplicar la migración `20260917033120_firebase_third_party_auth.sql` primero en
   un entorno de prueba. En producción coordinar la migración con la prueba de
   esta rama: al retirar el trigger nativo, el código viejo ya no puede crear
   perfiles para nuevos usuarios. No aplicarla mientras la configuración cloud
   siga bloqueada. La migración es transaccional y aborta si no puede tomar locks.
6. Verificar la rama desplegada en Vercel con el Firebase y Supabase correctos y un
   dominio autorizado en Firebase. Mantener `main` sin cambios hasta aprobar todas
   las pruebas. No llamar “producción validada” a una prueba local ni a un build.

## Autorización y excepciones administrativas

- El navegador y las rutas del servidor pasan el token de Firebase mediante
  `accessToken`. Supabase valida firma, issuer y proyecto configurado.
- RLS compara `auth.jwt()->>'sub'` como texto, no `auth.uid()` que exige UUID.
- Cada login hace un upsert limitado a campos de perfil. No puede alterar créditos
  ni VIP; los privilegios de columna los protegen además de RLS.
- `requireUser` valida el JWT en el servidor y usa un cliente sujeto a RLS para
  perfiles, conversaciones, historial y contenido. No usa la clave de servicio.
- La clave de servicio se reserva para pagos/webhooks y guardar respuestas del
  asistente. Sus datos provienen del catálogo/propietario verificados, no de IDs
  arbitrarios del navegador. Los usuarios no pueden falsificar mensajes assistant
  ni escribir compras o saldos directamente.
- El RPC que guarda respuestas es `SECURITY INVOKER`, exclusivo de `service_role`,
  y comprueba/bloquea la conversación y su propietario en la misma transacción.
- Los historiales locales están separados por UID. No se importan historiales
  antiguos compartidos, porque no existe prueba de a qué cuenta pertenecen.

## Evidencia disponible

`npm run test:auth` ejecuta PostgreSQL aislado (PGlite) con dos identidades simuladas,
los esquemas/migraciones reales y roles sin bypass de RLS. Verifica conservación de
datos, perfil idempotente, lecturas/escrituras propias, bloqueo de lecturas,
inserciones, actualizaciones y borrados ajenos, y protección de créditos/VIP.
También prueba los claims y la renovación del primer token.

Estas pruebas **no verifican** las firmas JWT de Firebase ni la integración alojada.
No se han desplegado la Cloud Function, el backfill ni la migración en producción.

| Verificación real solicitada | Resultado actual |
| --- | --- |
| Login con Google en el sitio real | Pendiente: navegador de las consolas sin conexión; no se obtuvo una sesión de prueba |
| Fila en lore_profiles con id igual al UID | Pendiente: migración/cloud sin aplicar; solo existe el vínculo legado UUID + firebase_uid |
| RLS permite los datos propios con JWT real | Pendiente; comprobación PostgreSQL aislada aprobada |
| RLS bloquea los datos de otro usuario con JWT real | Pendiente; comprobación PostgreSQL aislada aprobada |

Para cerrar la tarea, probar dos cuentas Firebase reales. Con A, crear/leer una
conversación; con B, consultar/insertar/actualizar/borrar el ID conocido de A:
SELECT debe devolver cero filas, INSERT fallar con RLS, UPDATE/DELETE afectar cero.
Repetir lectura de A para confirmar que sus datos permanecen intactos. Registrar
solo resultados y UID necesario para la comprobación, nunca tokens o contraseñas.

## Fuentes oficiales

- https://supabase.com/docs/guides/auth/third-party/firebase-auth
- https://firebase.google.com/docs/functions/1st-gen/auth-events
- https://firebase.google.com/docs/auth/admin/custom-claims
- https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
