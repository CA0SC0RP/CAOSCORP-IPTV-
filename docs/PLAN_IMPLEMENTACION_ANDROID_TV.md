# Plan de implementación — Android TV, Xtream y reproducción

**Fecha:** 2026-10-27  
**Estado:** definición técnica; todavía no es una implementación compilada ni probada.

## Objetivo

Crear una aplicación Android nativa para Android TV que reutilice el proyecto web actual como referencia visual y funcional, sin fingir que el código React/Node es una app Android terminada.

## Arquitectura propuesta

- **Aplicación:** Kotlin.
- **Interfaz:** Jetpack Compose para Android TV, con foco visible y navegación completa por D-pad/OK/Back.
- **Reproducción:** AndroidX Media3 ExoPlayer, con una capa de reproducción que reciba la URL de stream y el tipo de contenido detectado.
- **Red Xtream:** cliente HTTP nativo, con tiempos de espera, cancelación de solicitudes, validación de respuestas y errores diferenciados.
- **Modelos:** tipos separados para cuenta, categoría, canal, película, serie, episodio y programa EPG. Campos desconocidos deben permanecer nulos; no asignar valores ficticios.
- **Credenciales:** almacenamiento seguro para la aplicación nativa. Nunca escribir contraseñas o URLs con credenciales en logs.
- **EPG:** parser XMLTV separado del cliente Xtream, caché local y servicio de asociación de canales. La guía externa será opcional y no impedirá entrar a TV en vivo si falla.
- **Configuración de país/guía:** México como primera configuración; permitir ampliar países y fuentes sin reescribir la lógica principal.

## Flujo de conexión Xtream

1. Normalizar la URL base y validar que use HTTP/HTTPS.
2. Consultar `player_api.php` con credenciales y timeout limitado.
3. Comprobar la autenticación y el estado de cuenta sin registrar secretos.
4. Cargar categorías y elementos disponibles por tipo de contenido; tratar cada respuesta con validación, timeout y error explícito.
5. Mantener los datos parciales válidos si una categoría opcional falla, mostrando un estado comprensible en vez de declarar éxito total sin explicación.
6. Construir URLs de stream sin asumir que todas las cuentas soportan el mismo formato. Probar formatos disponibles del proveedor.
7. No guardar ni mostrar en logs URLs que incorporen usuario o contraseña.

## Reproductor nativo

- Crear una sesión Media3/ExoPlayer por reproducción activa y liberar recursos al cerrar/cambiar de canal.
- Gestionar estados: preparando, reproduciendo, pausado, buffer, error y finalizado.
- Mostrar mensajes útiles sin incluir credenciales ni URL privada.
- Controles con mando: reproducir/pausar, volver, cambiar canal y mostrar/ocultar controles.
- No asumir que toda URL es HLS por su extensión. Validar MIME/tipo cuando exista y usar la configuración compatible de Media3.
- Probar HLS, MPEG-TS u otros formatos únicamente cuando el proveedor real los entregue y el dispositivo los soporte.
- Registrar resultados de pruebas con códigos de error y tipo de formato, nunca con URL sensible.

## EPG: reglas obligatorias

- Eliminar `generateEpgSchedule` y cualquier generador de programación de demostración de las pantallas de producto.
- Si no hay datos, mostrar “Información no disponible” o dejar el campo vacío; no generar títulos, horarios, duraciones, porcentajes ni progreso.
- Priorizar la EPG del proveedor cuando sea válida.
- Descargar XMLTV externo en segundo plano y usarlo solo para huecos donde la coincidencia de canal sea fiable.
- No asignar guía externa cuando la coincidencia sea ambigua.
- Convertir horarios a la zona horaria del dispositivo conservando la información de origen.
- Si la fuente externa falla, conservar la última copia válida y mantener funcionando el resto de la aplicación.

## Orden de trabajo

### Paso A — Base Android real
Crear módulo Android nativo y configuración Gradle coherente; confirmar que la tarea de compilación genera un APK real. El Gradle actual del repositorio solo contiene tareas de tipo demostrativo y no debe tratarse como compilación Android.

### Paso B — Conexión
Implementar cliente Xtream nativo, modelos y manejo de errores; añadir pruebas unitarias con respuestas ficticias de API (solo para probar la lógica, nunca mostrarlas como datos reales al usuario).

### Paso C — Reproductor
Integrar Media3/ExoPlayer y probar reproducción con un stream de prueba legal o una cuenta autorizada. Documentar formatos y dispositivos comprobados.

### Paso D — EPG
Eliminar programación ficticia, integrar parser XMLTV y combinar datos solo con asociaciones fiables. Añadir pruebas para XML inválido, zona horaria, medianoche, solapamientos, ausencia de datos y canal ambiguo.

### Paso E — UX de TV
Portar por fases la identidad visual del tendedero y las pantallas clave, con pruebas de navegación por mando.

## Criterios de aceptación

- La rama contiene un proyecto Android que compila a un APK real.
- Una cuenta Xtream válida puede autenticar y cargar el contenido que el proveedor ofrece.
- Las credenciales incorrectas y fallos de red producen errores claros, sin filtrar secretos.
- Un stream autorizado compatible se reproduce en el reproductor nativo y los recursos se liberan correctamente.
- No se genera programación ni metadatos inventados.
- La EPG externa solo completa huecos con asociaciones fiables y nunca bloquea la reproducción si no está disponible.
- Los resultados de compilación y pruebas se registran con fecha y limitaciones reales.

## Dependencias de validación

La revisión del código y las pruebas unitarias no requieren compartir una lista personal. La prueba de autenticación y reproducción en vivo sí requiere un stream/cuenta de prueba autorizado y accesible; se pedirá solo cuando el código esté preparado. No incluir credenciales en commits, incidencias ni documentación.
