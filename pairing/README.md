# Servicio de emparejamiento QR — CAOSCORP IPTV

Este directorio contiene el primer código del servicio de emparejamiento. Todavía no está desplegado ni conectado a la aplicación Android; por tanto, el QR no debe considerarse funcional.

## Arquitectura

- Cloudflare Worker sirve la página HTTPS para el teléfono y las rutas API.
- Durable Object conserva cada sesión efímera y aplica el uso único.
- El navegador cifra el JSON con AES-GCM y cifra la clave AES con RSA-OAEP usando la clave pública efímera del televisor.
- El Worker almacena únicamente el paquete cifrado.
- El televisor debe recuperar el paquete usando un token de sondeo separado y descifrarlo localmente.

## Despliegue pendiente

1. Crear/configurar una cuenta de Cloudflare con Workers y Durable Objects.
2. Desde este directorio, instalar Wrangler y autenticar el despliegue.
3. Ejecutar una validación de configuración y desplegar el Worker.
4. Registrar la URL HTTPS asignada por Cloudflare.
5. Configurar esa URL en la compilación Android mediante una propiedad de Gradle; no escribir una URL inventada ni incluir secretos en Git.
6. Probar caducidad, uso único, cifrado/descifrado, cancelación y autenticación Xtream con una cuenta de prueba autorizada.

El Worker usa una clase Durable Object con migración SQLite. La cuenta de Cloudflare y la URL de despliegue no están disponibles desde el repositorio; no se puede completar la puesta en producción sin esa configuración.

## Límites actuales

- No se ha ejecutado Wrangler ni una prueba de integración del Worker.
- No se ha desplegado el servicio.
- La app Android todavía no genera una sesión, muestra el QR real ni consulta el Worker.
- El servicio no debe usarse con credenciales reales hasta superar las pruebas de seguridad y extremo a extremo.
