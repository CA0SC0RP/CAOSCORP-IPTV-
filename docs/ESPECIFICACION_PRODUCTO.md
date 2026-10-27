# Especificación del producto — Chaos Corp IPTV

**Estado:** planificación; todavía no se ha implementado la integración EPG.  
**Rama de trabajo:** `planning/xtream-epg-spec`  
**Rama principal protegida por procedimiento:** `main`  
**Última actualización:** 2026-10-27

## 1. Objetivo

Desarrollar Chaos Corp IPTV como reproductor IPTV enfocado en Android TV, conservando su identidad visual distintiva y priorizando una experiencia fluida con control remoto. El repositorio actual contiene una aplicación web React/TypeScript; sus componentes y lógica deben auditarse y aprovecharse como referencia antes de decidir qué reutilizar y qué reconstruir como aplicación nativa.

## 2. Decisiones confirmadas

- La conexión de usuario será exclusivamente mediante credenciales **Xtream Codes**: servidor, usuario y contraseña.
- Las listas M3U/M3U8 no serán un método para agregar una cuenta o lista en la experiencia final del producto.
- La guía EPG debe mostrar programación real. No se permite inventar títulos, horarios, duraciones, sinopsis ni barras de progreso para simular una guía.
- La EPG del proveedor se detectará y utilizará cuando esté disponible.
- La fuente externa IPTV-EPG.org se preparará automáticamente como complemento desde la configuración inicial de la cuenta, sin exigir al usuario que agregue manualmente una segunda guía.
- La guía del proveedor tendrá prioridad cuando sus datos sean válidos; la externa completará huecos solo cuando exista una coincidencia suficientemente fiable.
- No se deben modificar ni reemplazar archivos de `main` durante la planificación. Los cambios se desarrollarán en una rama separada y se revisarán antes de integrar.
- No se deben mostrar credenciales en registros, mensajes de error ni bitácoras.

## 3. Conexión Xtream Codes

Al agregar una cuenta, la aplicación deberá validar el servidor y las credenciales, consultar la API disponible y cargar categorías, canales en vivo, películas y series según las capacidades reales del proveedor. Debe manejar errores de autenticación, servidor no disponible, respuestas incompletas y conexiones lentas sin bloquear la interfaz.

La aplicación debe evitar registrar usuario y contraseña en texto claro. Cualquier almacenamiento local deberá tratar las credenciales como datos sensibles y documentarse.

## 4. Sistema EPG: proveedor + fuente externa

### 4.1 Detección del proveedor

- Consultar las funciones y endpoints EPG realmente disponibles en el servicio Xtream.
- Identificar si existe programación, su rango temporal, zona horaria y canales asociados.
- Distinguir entre EPG ausente, EPG disponible pero incompleta y EPG con datos vencidos.
- No asumir que todas las cuentas Xtream ofrecen el mismo endpoint o cobertura.

### 4.2 Fuente externa

Fuente candidata: [IPTV-EPG.org — Guides](https://iptv-epg.org/guides).

Enlace observado para México: `https://iptv-epg.org/files/epg-mx.xml`.

Antes de integrarla se debe comprobar disponibilidad, formato, frecuencia de actualización, zona horaria, identificadores de canal, tamaño del archivo, políticas de uso y condiciones de redistribución. El enlace y la cobertura deben tratarse como configuración, no como garantía permanente.

La primera configuración puede usar México como país inicial, pero el diseño debe permitir seleccionar otro país más adelante.

### 4.3 Asociación de canales

La asociación debe priorizar, en este orden:
1. Coincidencia exacta de identificador EPG cuando el proveedor lo exponga.
2. Identificadores `tvg-id` u otros IDs explícitos disponibles en los datos del canal.
3. Coincidencia normalizada de nombre, considerando país/idioma y metadatos disponibles.

Una coincidencia aproximada solo se acepta si supera un umbral conservador. Las coincidencias ambiguas se dejan sin asociar o se presentan para revisión; nunca se debe asignar programación de otro canal por una similitud débil.

### 4.4 Reglas para combinar y mostrar

- Conservar los programas válidos del proveedor.
- Rellenar solamente los huecos temporales con programas externos cuya asociación sea fiable.
- Evitar programas duplicados y solapamientos artificiales.
- Normalizar y mostrar horas de acuerdo con la zona horaria elegida por el usuario/dispositivo, respetando los datos de origen.
- Si ninguna fuente ofrece datos válidos, mostrar un estado honesto como “Guía no disponible”; nunca generar una parrilla ficticia.
- Mostrar la fuente y el estado de actualización cuando sea útil para diagnosticar problemas.

### 4.5 Caché y actualización

- Descargar los datos externos en segundo plano al configurar la cuenta y cuando sea necesario.
- Guardar una copia local con fecha de actualización para acelerar la guía y permitir tolerancia temporal a fallos de red.
- Evitar descargar XMLTV completo cada vez que el usuario abre un canal.
- Usar tiempos de espera, límites razonables de tamaño, manejo de errores y una política de actualización configurable/eficiente.
- No borrar la última copia válida si una actualización falla.

## 5. Experiencia de Android TV

- La prioridad de producto es Android TV y navegación con mando D-pad.
- Todo control importante debe poder enfocarse, mostrar claramente el foco y funcionar con OK/Enter y Back.
- La interfaz no debe depender de ratón o pantalla táctil.
- El movimiento visual automático debe pausarse o ceder cuando el usuario navega.
- Mantener un diseño adaptado a pantalla horizontal, legible desde distancia y con transiciones controladas.
- El soporte para teléfono/tableta puede considerarse si no compromete la experiencia de TV.

## 6. Tendedero de películas y series

El tendedero de portadas es un elemento distintivo y debe conservarse como referencia de diseño:
- Tres o cuatro líneas horizontales de portadas con movimiento lento y fluido.
- Filtros separados para contenido recién agregado y estrenos recientes; no confundir la fecha de alta en el proveedor con la fecha oficial de estreno.
- Si el proveedor no expone la fecha de incorporación, no inventarla.
- Ficha de título con los metadatos que realmente se hayan podido obtener: portada, título, sinopsis, año, género, duración y, para series, temporadas/episodios.
- Acción de reproducción y retorno a la posición anterior del tendedero.
- Búsqueda y filtros solo sobre datos disponibles.
- Las fuentes de metadatos externas, como TMDB, requieren evaluación de atribución, licencia, límites y condiciones antes de su uso público o comercial.

## 7. Reproductor y TV en vivo

- Lista de canales, categorías, búsqueda y favoritos.
- Reproductor de video adecuado para Android TV y control remoto.
- Guía EPG real con programa actual y próximos programas cuando existan datos.
- No incluir grabación ni multiview de 3–4 canales en el alcance inicial.
- La identificación automática de eventos deportivos queda para una fase posterior y depende de contar con datos fiables de eventos, horarios y canales.

## 8. Fases propuestas

### Fase 0 — Auditoría y documentación
Revisar el árbol completo, configuración de compilación, dependencias, componentes, endpoints, persistencia, reproductor y pruebas. Clasificar cada elemento como reutilizable, requiere adaptación, simulado o pendiente de verificar. No cambiar arquitectura ni borrar archivos sin justificarlo.

### Fase 1 — Identidad visual
Preservar y validar el concepto del tendedero, sus filtros, movimiento, fichas de películas/series y navegación entre pantallas.

### Fase 2 — Navegación Android TV
Diseñar navegación completa por mando, estados de foco, Back, orientación y accesibilidad a distancia.

### Fase 3 — Xtream y reproducción
Implementar conexión real, categorías, canales, VOD y series; verificar el reproductor en el dispositivo objetivo.

### Fase 4 — EPG real combinada
Implementar detección de EPG del proveedor, carga de IPTV-EPG.org, asociación de canales, combinación sin duplicados, caché y pruebas de datos reales.

### Fase 5 — Metadatos y funciones inteligentes
Evaluar metadatos externos y, posteriormente, descubrimiento de eventos deportivos. No presentar funciones como disponibles hasta que se prueben.

## 9. Criterios de aceptación de EPG

- La aplicación no genera programación ficticia.
- La conexión Xtream sigue funcionando aunque la fuente externa esté caída.
- La EPG del proveedor conserva prioridad sobre los datos externos válidos.
- Los huecos se completan solo con asociaciones fiables.
- Los canales no coincidentes permanecen sin guía externa.
- Los datos almacenados incluyen momento de actualización y se conservan si una actualización falla.
- Se comprueban zonas horarias, horarios que cruzan medianoche, programas solapados, XML inválido, fuente no disponible y canales con nombres similares.
- Se verifica el funcionamiento con datos reales y se documentan resultados antes de considerar terminada la función.

## 10. Seguridad y mantenimiento

- No incluir credenciales reales en pruebas, commits, capturas ni logs.
- No registrar URLs de reproducción que contengan credenciales.
- Mantener cambios en ramas de trabajo y revisar el diff antes de integrar a `main`.
- Documentar cada cambio, las pruebas ejecutadas, su resultado y las limitaciones conocidas.
- No afirmar que se compiló, instaló o probó algo si no se hizo realmente.
