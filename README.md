# CAOS TV (Web / React)

Reproductor IPTV web moderno y ligero, reescrito desde la versión original de Android TV manteniendo íntegramente las características esenciales, la lógica de negocio y la navegación de control remoto / teclado.

## Características

- **Soporte Xtream Codes**: Autenticación con Servidor (`http://dominio:puerto`), Usuario y Contraseña, con descarga de categorías en vivo y streams.
- **Soporte Listas M3U / M3U8**: Carga de listas remotas con procesamiento línea a línea de metadatos (`#EXTINF`, `#EXTGRP:`, logos `tvg-logo`, grupos `group-title`).
- **Navegación estilo TV & Web**:
  - Panel lateral de categorías (300px) con conteo dinámico de canales.
  - Lista de canales con numeración, logotipos e iconos de respaldo.
  - Navegación fluida por teclado o control remoto: flechas arriba/abajo para navegar, izquierda/derecha para alternar entre paneles, Enter para reproducir.
- **Reproductor de vídeo en directo (HLS)**:
  - Soporte HLS mediante `hls.js` con fallback nativo.
  - Cadena de reintentos con URLs alternas (.m3u8, .ts).
  - Barra inferior flotante OSD (número de canal, título e instrucciones) con auto-ocultado a los 4 segundos.
  - Zapping rápido entre canales mediante flechas arriba/abajo (o teclas Channel Up / Down / Page Up / Page Down).
- **Canales de demostración integrados**: Acceso inmediato con canales abiertos (NASA TV, DW, France 24, Blender test streams) para verificar el funcionamiento al instante.

## Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 3000)
npm run dev

# Compilar para producción
npm run build
```
