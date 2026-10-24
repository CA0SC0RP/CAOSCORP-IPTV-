# CAOS TV

Reproductor IPTV básico para Android TV.

## Qué hace (versión 0.1)

- Login con cuenta **Xtream Codes** (servidor, usuario, contraseña) o con una **lista M3U** por URL.
- Canales en vivo con categorías, navegables con el control remoto.
- Reproducción con Media3/ExoPlayer; arriba/abajo (o CH+/CH-) cambia de canal.

Pendiente: guía EPG y portales Stalker.

## Compilar

Cada push a `main` compila el APK en GitHub Actions. El APK queda en:

- Releases → etiqueta `latest` → `CAOS-TV.apk`
- Actions → última ejecución → artefacto `CAOS-TV-apk`

## Instalar en el TV

```
adb connect IP_DEL_TV:5555
adb install -r CAOS-TV.apk
```

Todos los APK van firmados con la misma llave, así que `-r` actualiza sin perder la cuenta guardada.
