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
- Se leyó `src/data/xtreamParser.ts`: contiene un parser de credenciales Xtream; todavía falta auditar el flujo completo de conexión y los endpoints EPG disponibles.
- Se leyó `package.json`: el proyecto actual está configurado como aplicación web React/TypeScript con servidor Node/Express. La arquitectura Android nativa debe revisarse en la auditoría antes de decidir la estrategia de migración.
- Esta revisión fue parcial; no representa una auditoría completa ni una prueba de compilación.

### Cambios realizados
- Se creó la rama de planificación `planning/xtream-epg-spec` desde `main`.
- Se añadió la especificación del producto en `docs/ESPECIFICACION_PRODUCTO.md`.
- Se añadió esta bitácora en `docs/BITACORA_PROYECTO.md`.
- No se modificó código de la aplicación y no se modificó `main`.

### Pendiente
1. Completar auditoría del árbol y del flujo Xtream/EPG.
2. Verificar el formato XMLTV, identificadores, actualización, tamaño y condiciones de uso de IPTV-EPG.org.
3. Definir arquitectura objetivo de Android TV y estrategia de reutilización del diseño actual.
4. Implementar en fases, ejecutar pruebas y documentar sus resultados.
5. Revisar los cambios de la rama antes de cualquier integración a `main`.
