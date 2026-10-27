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


## 2026-10-27 — Inicio de la base nativa Android TV

### Cambios realizados en la rama de trabajo
- Se sustituyó la tarea Gradle demostrativa por configuración real de plugins Android/Kotlin y se incluyó el módulo :app.
- Se creó app/build.gradle.kts con Compose, dependencias iniciales de Media3/ExoPlayer y configuración Android.
- Se añadió el manifiesto con permisos de red y entradas de lanzamiento Android/Android TV.
- Se creó una primera actividad Compose con menú lateral: Inicio, TV en vivo, Películas, Series y Ajustes.
- Se añadió el formulario inicial para servidor, usuario y contraseña Xtream Codes. Por ahora solo valida que los campos no estén vacíos; todavía no realiza una conexión ni guarda las credenciales.
- Las secciones de TV, películas y series son estructura inicial de navegación, no pantallas terminadas. No incluyen canales, portadas ni programación simulada.
- Se añadió el workflow .github/workflows/android.yml para intentar compilar un APK debug en GitHub Actions y publicar el APK como artefacto si la compilación termina correctamente.

### Flujo de producto confirmado para implementar
1. Inicio / menú principal.
2. Agregar o administrar una cuenta Xtream Codes.
3. Cargar los catálogos disponibles del proveedor.
4. TV en vivo: lista de canales junto al reproductor, selección/cambio de canal, guía EPG real y acceso a pantalla completa.
5. Películas y series: tendedero de 3–4 hileras horizontales, filtros para recientes/estrenos, ficha al seleccionar portada y reproducción.
6. Ajustes para cuentas, reproducción y guía EPG.

### Estado real y pendientes
- Estos cambios están únicamente en planning/xtream-epg-spec; main no se ha modificado.
- La primera pantalla nativa todavía no es una aplicación funcional completa: el cliente Xtream, el almacenamiento seguro, la carga de catálogos, la reproducción y la EPG real siguen pendientes.
- No afirmar que compila hasta revisar el resultado del workflow de GitHub Actions.
- La siguiente fase será conseguir una compilación APK real, corregir errores de construcción si aparecen y luego implementar el cliente Xtream con pruebas unitarias de respuestas API.


## 2026-10-27 — Alcance confirmado y arranque de la parrilla viva

### Decisiones confirmadas por el usuario
- Catch-up/replay queda fuera de la primera versión.
- Copias de seguridad/restauración quedan pospuestas; se reevaluarán si se decide comercializar la aplicación.
- Se mantienen las fichas de películas y series, selección de subtítulos y pistas de audio cuando el stream lo permita, historial y favoritos.
- Privacidad: proteger credenciales, no registrar secretos y evitar rastreo innecesario o publicidad intrusiva.
- La guía de TV en vivo se mantiene separada visualmente de la parrilla de películas/series.
- Se reduce la densidad inicial de la parrilla: empezar con unas 4–5 filas visibles y aproximadamente 8–12 portadas por fila, ajustándolo mediante pruebas.
- Cada fila se moverá como una sola franja horizontal, alternando direcciones. No habrá animaciones individuales por portada.
- La portada enfocada por el mando se resaltará de forma sutil, independiente del movimiento de la fila.
- La resolución 4K es una meta visual, no una garantía de rendimiento. El rendimiento debe medirse en dispositivos físicos.

### Cambios de documentación realizados
- Se actualizó `docs/ESPECIFICACION_PRODUCTO.md` con el alcance confirmado, reglas de datos reales, privacidad y diseño de la parrilla viva.
- Se actualizó `docs/PLAN_IMPLEMENTACION_ANDROID_TV.md` con fases de implementación y criterios de validación.
- Se mantiene todo en `planning/xtream-epg-spec`; `main` no se modificó.

### Próximos pasos técnicos
1. Preservar la actividad Compose inicial antes de rediseñar la navegación.
2. Implementar navegación principal simplificada y estructura de parrilla viva.
3. Cargar catálogos reales desde Xtream.
4. Implementar reproducción, EPG, fichas, subtítulos/audio, historial y favoritos por etapas.
5. Compilar en GitHub Actions y probar con cuenta autorizada y dispositivo real antes de declarar funciones completas.


### Primer cambio de interfaz iniciado
- Se guardó la interfaz Compose anterior en `docs/backup/MainActivity-inicial-backup.md`.
- Se reemplazó la distribución con menú lateral por una pantalla de inicio más limpia con cuatro accesos grandes: TV en vivo, Películas, Series y Ajustes.
- Se añadieron estados vacíos explícitos para no presentar catálogos ficticios y se documentó visualmente el concepto de parrilla viva.
- La conexión Xtream existente se conserva, pero el mensaje aclara que autenticar no significa que el catálogo esté integrado.
- **Validación pendiente:** todavía no se ha ejecutado una compilación tras este cambio ni se ha probado la navegación en un televisor físico. El siguiente paso es revisar GitHub Actions y corregir cualquier error antes de añadir la animación real de las filas.


## 2026-10-27 — Correcciones de conexión, contraste y marca

### Reporte del usuario
- Al introducir la dirección, la interfaz parecía no responder.
- No estaba disponible la función de QR para capturar los datos desde un teléfono.
- El título “Todo tu entretenimiento” no tenía contraste suficiente con el fondo.
- La marca debe escribirse **CAOSCORP**, en una sola palabra.

### Cambios realizados
- Se mejoró el flujo de conexión: ahora valida campos obligatorios y el prefijo HTTP/HTTPS antes de hacer la petición.
- El botón ahora indica “Conectar cuenta” y cambia a estado “Conectando…”.
- Los errores se muestran en un panel visible; una autenticación correcta vuelve al inicio y confirma el resultado.
- Se aclaró que autenticar una cuenta no significa que el catálogo ya esté cargado.
- Se forzó el color blanco del título principal y de los encabezados principales para corregir el contraste sobre el fondo oscuro.
- Se cambió la marca visible a **CAOSCORP** y la etiqueta Android a **CAOSCORP IPTV**.
- Se añadió una nota de interfaz sobre el emparejamiento por QR, pero **el QR funcional todavía no está implementado**.

### Limitación importante del QR
No se debe codificar directamente la contraseña en el QR. Para que el teléfono pueda enviar los datos a la TV hace falta un formulario web HTTPS y un mecanismo de emparejamiento temporal seguro, con expiración y recepción por la aplicación. Hasta implementar ese servicio, no se afirma que el QR funcione.

### Validación pendiente
- Aún hay que compilar el APK de estos cambios con GitHub Actions.
- No se ha probado con las credenciales del usuario ni con su dispositivo.
- Si la conexión sigue sin responder, se deberá revisar el resultado del workflow y, después, el comportamiento con una cuenta autorizada; no pedir ni publicar contraseñas en la bitácora.
