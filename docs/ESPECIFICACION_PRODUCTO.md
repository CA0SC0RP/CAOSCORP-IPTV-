# Especificación del producto — Chaos Corp IPTV

**Estado:** implementación por fases; la base nativa Android está creada, pero catálogo, reproducción y EPG aún requieren integración y pruebas reales.  
**Rama de trabajo:** `planning/xtream-epg-spec`  
**Rama principal protegida:** `main`  
**Última actualización:** 2026-10-27

## 1. Objetivo
Crear un reproductor IPTV nativo para Android TV, cómodo con control remoto, con una interfaz sobria y una identidad propia: la **parrilla viva** de películas y series. Priorizar datos reales, navegación fluida, privacidad y una base técnica mantenible.

## 2. Decisiones confirmadas
- En la primera versión, las cuentas se agregan mediante Xtream Codes: servidor, usuario y contraseña.
- M3U/M3U8 no forma parte del flujo inicial para agregar listas.
- No se inventan canales, programación, películas, episodios, sinopsis, fechas, calificaciones, horarios ni progreso.
- La EPG del proveedor tiene prioridad. Una fuente XMLTV externa solo complementará huecos si se verifica su disponibilidad, condiciones de uso y coincidencia fiable de canales.
- Interfaz en español al inicio; otros idiomas se valorarán después.
- Sin publicidad intrusiva ni rastreo innecesario. No registrar contraseñas ni URLs de reproducción que las incluyan.
- Los cambios se realizan en `planning/xtream-epg-spec`; no modificar ni integrar en `main` sin autorización expresa.
- Mantener una copia recuperable de la interfaz inicial antes de reemplazarla.
- Catch-up/replay y copias de seguridad quedan fuera de la primera versión. Las copias se reconsiderarán si el producto se prepara para comercialización.

## 3. Navegación principal
Inicio con cuatro accesos claros, grandes y utilizables con mando:
1. TV en vivo
2. Películas
3. Series
4. Ajustes

La gestión/agregado de cuenta Xtream estará accesible desde Inicio o Ajustes sin convertir la pantalla principal en un panel recargado. El foco del mando debe ser visible y Back debe conservar el contexto cuando corresponda.

## 4. Parrilla viva de películas y series
La parrilla viva es el rasgo visual distintivo. Debe sentirse elegante y cinematográfica, sin saturación de elementos.

- Como punto inicial de prueba, mostrar aproximadamente **4–5 filas visibles** y alrededor de **8–12 portadas por fila**, adaptando tamaño y densidad al formato de pantalla y al rendimiento real del dispositivo.
- Cada fila se desplaza horizontalmente como una sola franja; filas alternas cambian de dirección. No animar cada portada de manera independiente.
- Movimiento lento, continuo y discreto. Reducir o pausar el movimiento mientras el usuario navega con el mando; considerar una opción de movimiento reducido.
- El foco de selección es independiente del desplazamiento: la portada enfocada aumenta ligeramente de tamaño y recibe un borde/iluminación sutil.
- OK abre la ficha del contenido. Al volver, intentar restaurar la posición anterior.
- Las categorías y filtros deben ser discretos y no ocupar permanentemente gran parte de la pantalla.
- “Añadido recientemente” solo puede usarse si el proveedor ofrece datos suficientes para determinarlo. No confundir la fecha de alta con la fecha oficial de estreno.
- No asumir que 4K implica rendimiento garantizado. Ajustar tamaño de imágenes, caché, composición y animación; medir FPS, memoria y consumo en dispositivos físicos antes de prometer fluidez.

### Ficha de película o serie
Mostrar solo datos obtenidos del proveedor o de una fuente externa aprobada: portada, título, sinopsis, año, género, duración, reparto, temporadas y episodios, según disponibilidad. Los datos desconocidos deben omitirse o marcarse como no disponibles, no rellenarse con valores ficticios. La reproducción solo se ofrece cuando el elemento tiene una fuente real reproducible.

## 5. TV en vivo y EPG
TV en vivo utiliza una interfaz distinta de la parrilla de películas:
- Categorías/carpeta de canales y lista de canales.
- Reproductor pequeño persistente mientras se consulta la guía, con acción para ampliar a pantalla completa.
- EPG real con programa actual y siguiente cuando existan datos; conservar el canal seleccionado al navegar cuando sea posible.
- La guía del proveedor tiene prioridad. La fuente externa se usa únicamente para huecos con asociaciones fiables.
- Si no hay datos válidos, mostrar “Información de programación no disponible”.
- No crear programas, horas, duraciones, progreso ni canales de ejemplo en la interfaz de producto.

## 6. Reproducción, historial y favoritos
- Usar una única base de reproducción nativa Android, inicialmente Media3/ExoPlayer, antes de considerar motores adicionales.
- Controles de reproducir/pausar, búsqueda temporal y regreso según las capacidades del stream.
- Permitir seleccionar subtítulos y pista de audio cuando estén disponibles en el stream/reproductor.
- Historial de reproducción y favoritos, con persistencia local y separación por cuenta cuando aplique.
- Para series, mostrar temporadas/episodios reales y registrar progreso solo cuando el reproductor entregue información fiable.
- Catch-up/replay no se implementa en la primera versión.
- No declarar compatibles formatos o dispositivos sin probarlos.

## 7. Cuentas y seguridad
- Preparar soporte para más de una cuenta Xtream y cambio explícito de cuenta como fase posterior a la conexión básica.
- Validar servidor, credenciales y respuestas con límites de tiempo y errores comprensibles.
- Proteger credenciales en almacenamiento local; no escribir secretos en logs, errores, bitácoras, capturas ni commits.
- Las cuentas y el contenido deben seguir siendo utilizables aunque una fuente externa de metadatos/EPG no esté disponible.
- Un inicio de sesión por QR no se implementará sin un flujo web HTTPS y un token temporal seguro; el QR nunca debe contener las credenciales directamente.

## 8. Alcance y prioridades
### Primera versión
1. Navegación principal con mando y estados de foco.
2. Conexión Xtream real y manejo de errores.
3. Catálogos reales de canales, películas y series.
4. Reproductor nativo y guía EPG real disponible.
5. Parrilla viva optimizada para películas y series.
6. Fichas de contenido, subtítulos/pistas de audio cuando existan, historial y favoritos.
7. Ajustes básicos y prácticas de privacidad.

### Después de estabilizar la primera versión
- Varias cuentas y cambio de cuenta completo si no quedó en la primera entrega.
- Enriquecimiento de metadatos externos, sujeto a atribución, licencia, límites y condiciones.
- Copias de seguridad/restauración si aportan valor al producto comercial.
- Más idiomas y opciones avanzadas de accesibilidad.
- Catch-up/replay solo si se decide reabrir el alcance y el proveedor lo admite.

### Fuera del alcance inicial
- Catch-up/replay.
- Copias de seguridad.
- Editor avanzado de listas M3U.
- Detección de streams arbitrarios en páginas web.
- Varios motores de reproducción.
- Funciones de escritorio o autoactualización de escritorio.

## 9. Orden de implementación
1. Preservar la interfaz base y definir navegación de TV.
2. Implementar conexión Xtream y modelos de datos.
3. Cargar catálogos reales y manejar estados vacíos/errores.
4. Integrar reproducción y controles.
5. Implementar EPG real y asociación de canales fiable.
6. Construir la parrilla viva con portadas reales y foco del mando.
7. Añadir fichas, subtítulos/audio, historial y favoritos.
8. Medir y optimizar en dispositivos Android TV reales.

## 10. Criterios de aceptación y honestidad
- Ningún dato ficticio aparece como real.
- Las credenciales y URLs sensibles no se registran.
- Todas las funciones importantes se pueden operar con el mando.
- La animación no impide la selección ni hace perder el foco.
- El catálogo vacío o los errores de red se explican con claridad.
- Las pruebas de compilación se documentan con su resultado real.
- El rendimiento solo se declara validado después de medir en hardware físico; una compilación exitosa no equivale a una prueba de reproducción o rendimiento.
