# Plan de implementación — Chaos Corp IPTV para Android TV

**Fecha:** 2026-10-27  
**Estado:** base nativa y autenticación inicial presentes; integración completa y pruebas reales pendientes.

## Objetivo
Construir una aplicación Android TV nativa, con Xtream Codes como método inicial de cuenta, reproducción Media3/ExoPlayer, EPG basada en datos reales y una parrilla viva de portadas para películas y series.

## Arquitectura
- Kotlin + Jetpack Compose.
- Navegación D-pad/OK/Back con foco visible y pantallas legibles desde distancia.
- AndroidX Media3/ExoPlayer como primer y único motor.
- Cliente Xtream nativo con timeouts, cancelación cuando corresponda, validación de respuestas y errores comprensibles.
- Modelos separados para cuenta, categoría, canal, película, serie, episodio y programa EPG.
- Almacenamiento local seguro de credenciales y persistencia para historial/favoritos.
- Parser XMLTV y caché separados del cliente Xtream; fallo de la EPG externa no debe bloquear la app.
- No registrar credenciales ni URLs que contengan credenciales.

## Orden de trabajo
### Paso 1 — Alcance y preservación
- Actualizar especificación y bitácora.
- Guardar una copia del código de la interfaz inicial antes de rediseñarla.
- Mantener todos los cambios en `planning/xtream-epg-spec`; no modificar `main`.

### Paso 2 — Conexión y modelos
- Validar la URL base y autenticar mediante `player_api.php`.
- Implementar carga real de categorías y contenido: canales, películas y series.
- Diferenciar autenticación inválida, timeout, fallo de red y respuesta incompleta.
- Añadir pruebas unitarias con respuestas de API sintéticas solo para probar la lógica; nunca presentarlas como contenido real.

### Paso 3 — Reproductor
- Integrar Media3/ExoPlayer y estados de carga, reproducción, pausa, buffer y error.
- Liberar recursos al cambiar/cerrar reproducción.
- Probar streams autorizados y formatos que realmente entregue el proveedor.
- Implementar controles de mando, selección de subtítulos y pistas de audio cuando el stream lo permita.

### Paso 4 — TV en vivo y EPG
- Lista real de canales, categorías, selección y reproductor persistente.
- Consultar la EPG que ofrezca el proveedor.
- Evaluar la fuente XMLTV externa antes de integrarla: disponibilidad, actualización, tamaño, zona horaria, IDs, políticas y redistribución.
- Asociar canales de forma conservadora y completar solo huecos con coincidencia fiable.
- Sin datos válidos, mostrar “Información de programación no disponible”.

### Paso 5 — Parrilla viva
- Usar portadas del catálogo real, no carteles de muestra en la experiencia final.
- Punto de partida visual: 4–5 filas visibles y aproximadamente 8–12 portadas por fila; ajustar a la relación de aspecto y al dispositivo.
- Desplazar cada fila como una sola franja, con direcciones alternas y movimiento lento.
- No animar cada portada individualmente.
- Resaltar el foco del mando con ampliación ligera y borde/iluminación discreta.
- Pausar o reducir el movimiento mientras se navega y restaurar la posición al volver de una ficha.
- Optimizar carga de imágenes, caché y recomposición.

### Paso 6 — Fichas y funciones personales
- Fichas de películas/series con solo metadatos reales disponibles.
- Temporadas y episodios reales.
- Historial y favoritos.
- Subtítulos y pistas de audio cuando estén disponibles.
- Copias de seguridad y catch-up quedan fuera de la primera versión.

### Paso 7 — Validación
- Compilar con GitHub Actions y corregir errores.
- Verificar autenticación y carga con una cuenta autorizada sin compartir credenciales en repositorio.
- Probar navegación con mando y reproducción real.
- Medir rendimiento/FPS/memoria en hardware Android TV físico; no inferirlo solo de la resolución 4K o del éxito de compilación.
- Registrar fecha, resultado, dispositivo, limitaciones y pruebas no realizadas.

## Criterios de aceptación
- APK generado por una compilación comprobada.
- Conexión Xtream real, carga de catálogo y errores manejados.
- Reproducción probada con stream autorizado.
- EPG real o estado vacío honesto; nunca programación inventada.
- Parrilla viva navegable con mando, sin perder foco ni saturar la interfaz.
- Historial/favoritos persistentes y secretos protegidos.
