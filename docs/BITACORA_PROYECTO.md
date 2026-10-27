# Bitácora del proyecto — Chaos Corp IPTV

## 2026-10-27 — Especificación inicial de Xtream y EPG

### Decisiones del usuario
- El método de conexión final será Xtream Codes; no se incluirán listas M3U como método para agregar listas.
- La guía EPG debe usar datos reales, no horarios ni programas inventados.
- La aplicación debe detectar la EPG incluida en la cuenta del proveedor.
- Al agregar una cuenta, también debe preparar automáticamente una guía externa como complemento.
- El usuario proporcionó https://iptv-epg.org/guides como posible fuente externa.
- México se considera el país inicial para la primera integración; se desea dejar abierta la posibilidad de otros países.
- La EPG del proveedor tiene prioridad y la externa completa huecos únicamente cuando los canales coinciden de forma fiable.

### Auditoría inicial realizada
- Se leyó `README.md`: todavía menciona soporte M3U/M3U8, por lo que la documentación actual contradice la decisión de producto.
- Se leyó `src/ui/TiviMateLiveTvView.tsx`: contiene una función `generateEpgSchedule` que crea nombres y horarios de ejemplo. Debe eliminarse o sustituirse cuando se implemente la EPG real.
- Se leyó `src/data/xtreamParser.ts`: contiene un parser de credenciales Xtream; todavía falta auditar el flujo completo y los endpoints EPG disponibles.
- Se leyó `package.json`: el proyecto actual está configurado como aplicación web React/TypeScript con servidor Node/Express. La arquitectura Android nativa debe revisarse antes de decidir la estrategia de migración.
- Se revisaron también `server.ts`, `src/data/iptvClient.ts`, `src/data/accountStore.ts`, `src/ui/CleanFullscreenPlayer.tsx`, `src/ui/CosmicLiveTvView.tsx`, `src/data/channelRepository.ts`, `src/ui/InteractiveMoviesView.tsx`, `src/ui/InteractiveSeriesView.tsx`, `src/ui/AdvancedMediaControls.tsx` y `build.gradle.kts`.
- Los hallazgos técnicos y el plan de corrección están en `docs/AUDITORIA_CONEXION_REPRODUCTOR.md`.

### Cambios realizados
- Se creó la rama de planificación `planning/xtream-epg-spec` desde `main`.
- Se añadió la especificación del producto en `docs/ESPECIFICACION_PRODUCTO.md`.
- Se añadió esta bitácora en `docs/BITACORA_PROYECTO.md`.
- Se añadió `docs/AUDITORIA_CONEXION_REPRODUCTOR.md` con los hallazgos de la revisión estática.
- No se modificó código de la aplicación y no se modificó `main`.

### Resultados y limitaciones de la auditoría
- La conexión Xtream tiene un flujo parcial para autenticar y cargar canales, películas y series; faltan pruebas reales y un manejo uniforme de fallos/tiempos de espera.
- El reproductor revisado es web (`video` + `hls.js)); no es evidencia de que exista un reproductor Android nativo.
- Hay programación EPG ficticia y valores de metadatos por defecto que deben eliminarse para cumplir el requisito de datos reales.
- La cuenta web se guarda en `localStorage`, incluida la contraseña; no se debe trasladar ese almacenamiento sin protección a la app nativa.
- No se usó una cuenta personal ni se probaron streams; no se ejecutó compilación ni prueba en Android TV.

### Cambios de código iniciales en la rama de trabajo
- Se eliminó de `src/ui/TiviMateLiveTvView.tsx` la función que inventaba programas y horarios.
- La vista EPG ahora muestra “Información de programación no disponible” cuando no tiene registros; también se quitó la barra de progreso fija ficticia.
- Esto es una corrección preventiva de la interfaz web actual. La integración de EPG real todavía no está conectada, por lo que la guía permanecerá vacía hasta implementarla.
- No se ha ejecutado una compilación TypeScript ni una prueba visual; el cambio está pendiente de validación automática.

### Siguiente paso definido
- Se confirmó que la EPG debe quedar vacía o mostrar “Información no disponible” si no hay datos reales; se prohíben horarios, títulos, duraciones y progreso inventados.
- Se creó el plan técnico en `docs/PLAN_IMPLEMENTACION_ANDROID_TV.md`.
- El plan propone Kotlin, Jetpack Compose para TV, Media3/ExoPlayer, cliente Xtream nativo, almacenamiento seguro y EPG XMLTV con caché.
- La auditoría no usó una lista personal ni validó streams reales. Las pruebas reales se harán cuando exista un reproductor y un cliente preparados para ello.

### Pendiente
1. Crear y compilar el módulo Android nativo con Media3/ExoPlayer.
2. Probar autenticación Xtream, carga parcial, timeout, formatos y reproducción con una cuenta de prueba autorizada.
3. Eliminar los datos ficticios de EPG y metadatos.
4. Verificar la fuente XMLTV externa antes de integrarla.
5. Revisar los cambios de esta rama antes de cualquier integración a `main`.
