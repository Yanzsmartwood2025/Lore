# Infraestructura de Lore

## Estado

La aplicación queda preparada para encenderse al crear los servicios y copiar sus secretos en Vercel. Ningún secreto real se almacena en el repositorio.

### 1. Supabase

- Auth real con correo/contraseña y Google OAuth (PKCE), sesión SSR renovada por `proxy.ts` y perfil creado automáticamente.
- Persistencia de perfiles, créditos, packs, compras, regalos y conversaciones. Todas las tablas tienen RLS; las acreditaciones se hacen mediante una función atómica disponible únicamente para `service_role`.
- El chat exige una sesión válida y guarda mensajes. Supabase **no** almacena binarios.

Aplicación inicial:

1. Crear un proyecto de Supabase.
2. Ejecutar `supabase/migrations/202609150001_lore_platform.sql` en el SQL Editor (o `supabase db push`).
3. En **Authentication > Providers**, activar Email y Google. En Google Cloud usar la URL callback que muestra Supabase; en Supabase agregar `https://<dominio>/auth/callback` a Redirect URLs.
4. Copiar URL, anon key y service-role key a Vercel. La service-role key nunca debe llevar prefijo `NEXT_PUBLIC_`.

### 2. Cloudflare R2

1. Crear manualmente un bucket privado (R2 no expone una credencial que permita a esta app crear su propio bucket de forma segura).
2. Crear un token S3 con lectura/escritura limitado a ese bucket y copiar sus cuatro variables.
3. Configurar CORS del bucket para `PUT` desde los dominios de producción/preview y permitir los tipos usados.

`POST /api/media/upload` registra el objeto en `lore_media_assets` y entrega una URL `PUT` firmada durante cinco minutos. `GET /api/media/:id` consulta primero Supabase/RLS y solo entonces entrega una URL `GET` firmada. El bucket debe permanecer privado: publicar el dominio R2 omitiría esta autorización.

### 3. Pagos de prueba

Se dejó **CCBill como decisión provisional**, porque su aceptación de contenido adulto es adecuada, pero el tiempo de alta depende de underwriting y no existe un plazo público garantizado que permita afirmar responsablemente que sea más rápido que Segpay. La aprobación final pendiente es: **CCBill o migrar el adaptador a Segpay después de recibir la primera aprobación comercial**. No hay cobros live: el checkout CCBill envía `testMode=1` y NOWPayments usa `api-sandbox.nowpayments.io`.

`CCBILL_API_KEY` agrupa la configuración que CCBill entrega por separado, evitando agregar nombres de entorno fuera de la lista solicitada:

```json
{"accountNumber":"000000","subaccountNumber":"0000","flexFormId":"...","salt":"..."}
```

En CCBill, crear un FlexForm de pruebas con Dynamic Pricing, conservar `lorePurchaseId` en el callback y apuntar el postback aprobado a `/api/webhooks/ccbill`. El esquema exacto de firma/postback debe validarse con el paquete de onboarding asignado a la cuenta antes de habilitar producción; CCBill varía estas opciones por cuenta.

En NOWPayments crear una API key de **Sandbox**, configurar `/api/webhooks/nowpayments` como IPN callback y, debido a la lista cerrada de variables solicitada, configurar el IPN secret con exactamente el mismo valor que `NOWPAYMENTS_API_KEY`. El webhook valida `x-nowpayments-sig`; en producción se recomienda separar API key e IPN secret, lo cual requeriría aprobar una variable adicional.

Ambos webhooks llaman a `confirm_lore_purchase`: la transición `pending → confirmed`, la suma de créditos y el asiento del ledger son atómicos e idempotentes.

## Variables que debe pegar en Vercel

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave pública/anon de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | webhooks de pago; solo servidor |
| `R2_ACCOUNT_ID` | ID de cuenta Cloudflare |
| `R2_ACCESS_KEY_ID` | token S3 de R2 |
| `R2_SECRET_ACCESS_KEY` | secreto S3 de R2 |
| `R2_BUCKET_NAME` | bucket privado existente |
| `CCBILL_API_KEY` | JSON de configuración test descrito arriba |
| `NOWPAYMENTS_API_KEY` | API key de sandbox y, temporalmente, IPN secret |

Las claves Mistral ya utilizadas por la app siguen siendo necesarias para el chat, pero no forman parte de este encargo.

## Antes de habilitar cobros reales

1. Completar KYB/underwriting y aprobar CCBill frente a Segpay.
2. Ejecutar pagos sandbox exitoso, fallido, duplicado y reembolsado, incluyendo verificación de postbacks con la configuración real de la cuenta.
3. Solicitar aprobación para una variable separada `NOWPAYMENTS_IPN_SECRET`; nunca reutilizar secretos en producción.
4. Cambiar explícitamente endpoints/test flags solo después de la aprobación comercial y una revisión de seguridad.
