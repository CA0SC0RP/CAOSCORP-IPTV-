# Auditoría técnica inicial — conexión Xtream y reproductor

**Fecha:** 2026-10-27  
**Rama:** `planning/xtream-epg-spec`  
**Alcance:** revisión estática de archivos del repositorio en `main`. No se usó una cuenta IPTV real, no se reprodujeron streams y no se ejecutó una compilación.

## Resumen ejecutivo

El repositorio contiene una implementación web que sirve como referencia visual y funcional, pero no es todavía una aplicación Android TV nativa lista para compilar. La conexión Xtream y la generación de URLs están parcialmente implementadas en el servidor Express; la reproducción depende de un elemento HTML `video` y `hls.js`. Hay simulaciones y valores por defecto que deben corregirse antes de considerar fiable la información mostrada.

## Hallazgos

### 1. Conexión Xtream — parcialmente implementada

Archivo: `server.ts`

- Envía una solicitud a `player_api.php` y comprueba `user_info.auth`; también revisa el estado de la cuenta.
- Después intenta cargar categorías y contenido en vivo, VOD y series mediante seis solicitudes paralelas.
- Las solicitudes posteriores a la autenticación no tienen un timeout explícito ni una comprobación uniforme de errores; `Promise.allSettled` evita que una solicitud rechazada detenga todas las demás, pero la interfaz puede recibir datos incompletos sin explicar qué falló.
- El timeout de 20 segundos se aplica solo a la primera solicitud de autenticación, no a toda la carga.
- Las URLs de reproducción se construyen suponiendo `.m3u8` y `.ts` para canales en vivo. El proveedor puede variar en formatos y comportamiento; se debe validar el enlace real antes de depender de una extensión fija.
- El usuario y contraseña se codifican para parámetros de consulta, pero también se insertan en segmentos de ruta de las URLs de reproducción. Es necesario tratar correctamente caracteres reservados y evitar que esas URLs aparezcan en registros o errores.

### 2. Reproductor — prototipo web, no reproductor nativo Android

Archivos: `src/ui/CleanFullscreenPlayer.tsx`, `src/ui/TiviMateLiveTvView.tsx`, `src/ui/CosmicLiveTvView.tsx`.

- La reproducción web usa `hls.js` para HLS cuando el navegador lo soporta y, en otros casos, asigna la URL al elemento HTML `video`.
- El reproductor considera HLS cualquier URL que no contenga `.mp4`, lo cual puede clasificar mal otros formatos. Debe determinarse el formato por metadatos/URL y por capacidades reales, con errores claros.
- En varias rutas, el error de HLS solo cambia el estado de carga o muestra un mensaje genérico; no hay todavía una estrategia de recuperación suficientemente comprobada.
- El código no demuestra compatibilidad con todos los formatos IPTV ni con todos los dispositivos.
- Para la aplicación nativa objetivo, la dirección técnica acordada es Kotlin y Android Media3/ExoPlayer. El código web actual servirá como referencia, no como prueba de que el reproductor nativo ya exista.

### 3. EPG — bloqueador de fiabilidad

Archivo: `src/ui/TiviMateLiveTvView.tsx`.

- La función `generateEpgSchedule` inventa nombres de programas y horarios cuando no hay XMLTV. Esto contradice la decisión del producto de mostrar exclusivamente programación real y debe eliminarse o reemplazarse.
- En los archivos revisados no se encontró un flujo integrado que descargue y analice EPG real del proveedor o XMLTV externo.
- No se ha comprobado todavía la disponibilidad ni las condiciones de uso de la fuente externa candidata.

### 4. Datos de películas y series — valores inventados como respaldo

Archivo: `server.ts`.

- Algunas películas reciben una calificación por defecto de 7.5 y un año por defecto de 2024; las series reciben una calificación por defecto de 8.0 y un año por defecto de 2024. Estos valores pueden mostrarse como si fueran metadatos reales y deben quitarse.
- Los datos faltantes deben permanecer como desconocidos hasta obtener información verificable del proveedor o de una fuente de metadatos evaluada.

### 5. Credenciales y arquitectura

Archivos: `src/data/accountStore.ts`, `src/data/iptvClient.ts`, `package.json`, `build.gradle.kts`.

- La versión web guarda el objeto de cuenta, incluida la contraseña, en `localStorage) sin cifrado. No se debe trasladar ese mecanismo directamente a la aplicación nativa; se requiere almacenamiento apropiado para credenciales.
- El cliente web llama a endpoints relativos como `/api/iptv/xtream`; estos dependen del servidor Express incluido en el proyecto. La app Android nativa necesitará una arquitectura de red propia o un backend definido explícitamente.
- `package.json` confirma una base React/TypeScript y Node/Express. El archivo `build.gradle.kts` revisado solo registra tareas que imprimen “Web app built successfully”; no constituye una compilación Android real.

## Qué se puede conservar como referencia

- Diseño y comportamiento del tendedero de películas y series.
- Flujo de entrada Xtream y parser de credenciales, después de revisar y adaptar sus casos límite.
- Modelo conceptual de categorías, canales, películas y series.
- Navegación y controles visuales del reproductor como referencia de UX, no como implementación nativa terminada.

## Orden recomendado de corrección

1. Definir la arquitectura Android nativa y el uso de Media3/ExoPlayer.
2. Formalizar y probar la conexión Xtream: autenticación, límites de tiempo por solicitud, errores parciales, categorías y formatos reales.
3. Eliminar horarios EPG ficticios y valores inventados de calificación/año.
4. Implementar EPG del proveedor y luego complemento XMLTV con asociación conservadora de canales.
5. Implementar almacenamiento seguro de credenciales y evitar registrar URLs que contengan credenciales.
6. Ejecutar compilación y pruebas en un dispositivo Android/Android TV con una cuenta de prueba autorizada.

## Estado de validación

- [x] Revisión estática de los archivos principales de conexión, reproductor y configuración.
- [x] Hallazgos documentados en esta auditoría.
- [ ] Compilación ejecutada.
- [ ] Prueba con cuenta Xtream real.
- [ ] Prueba de reproducción real.
- [ ] Validación EPG real.
- [ ] Prueba en Android TV.

**Conclusión:** todavía no se debe afirmar que conexión, reproducción o EPG estén verificadas en condiciones reales. La base web contiene piezas aprovechables, pero antes de implementar funciones nuevas hay que separar lo real de lo simulado y definir la implementación nativa.
