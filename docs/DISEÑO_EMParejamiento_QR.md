# Diseño de transferencia segura por QR

**Estado:** diseño técnico aprobado para implementación; todavía no es una función disponible.  
**Rama:** `planning/xtream-epg-spec`

## Objetivo

Permitir que el usuario escanee con su teléfono un QR mostrado en CAOSCORP IPTV, abra un formulario web y envíe los datos Xtream al televisor sin escribirlos con el control remoto.

## Flujo previsto

1. El televisor crea una sesión de emparejamiento y genera un par de claves efímero. La clave privada permanece en el dispositivo.
2. El servicio HTTPS devuelve un identificador de sesión, una URL de emparejamiento y la clave pública del televisor.
3. La aplicación muestra un QR que contiene únicamente la URL HTTPS de emparejamiento y un token aleatorio de un solo uso; nunca contiene servidor, usuario ni contraseña.
4. El teléfono abre una página web HTTPS que muestra campos para servidor Xtream, usuario y contraseña. El formulario valida los campos y cifra los datos en el navegador con la clave pública efímera del televisor antes de enviarlos.
5. El servicio almacena solamente el paquete cifrado, no las credenciales en texto claro. La app del televisor consulta la sesión con una credencial de sondeo independiente que no aparece en el QR.
6. El televisor recupera el paquete una sola vez, lo descifra localmente y lo pasa al mismo flujo de autenticación Xtream de la conexión manual.
7. La sesión expira en un máximo de cinco minutos, se invalida al usarse o cancelarse y el paquete se elimina tras la recuperación. Se limitan intentos y tamaño de solicitud.

## Requisitos de seguridad

- HTTPS obligatorio; no degradar a HTTP.
- Token de QR criptográficamente aleatorio, de un solo uso y con expiración breve.
- Separar el token del teléfono de la credencial de sondeo del televisor.
- Cifrado de extremo a extremo en el navegador hacia una clave efímera del televisor; el servicio de retransmisión solo almacena texto cifrado.
- No registrar cuerpos de solicitud, contraseñas, tokens ni paquetes cifrados.
- No incluir credenciales en QR, URL, analítica, errores ni bitácoras.
- Validar servidor y tamaño de campos; mostrar errores claros.
- Tras recibir los datos, ejecutar la autenticación Xtream existente y mostrar el resultado real. Un envío web exitoso no significa que la cuenta Xtream sea válida.
- Si el servicio no está configurado o no responde, ocultar/desactivar el QR y conservar la entrada manual. No mostrar un QR decorativo como si funcionara.

## Componentes necesarios

- Aplicación Android TV: generación de sesión, QR, sondeo, descifrado local, caducidad y conexión Xtream.
- Página web adaptable a móvil: formulario HTTPS, validación y cifrado en el navegador.
- Servicio HTTPS de emparejamiento: sesiones efímeras, almacenamiento temporal del paquete cifrado, expiración, uso único y límites de frecuencia.
- Configuración de despliegue y dominio HTTPS del servicio. No se deben guardar secretos de despliegue en el repositorio.

## Pruebas de aceptación

1. Escanear el QR abre el formulario HTTPS correcto desde iOS y Android.
2. Enviar datos hace que lleguen al televisor emparejado, y no a otro dispositivo.
3. El televisor autentica con Xtream y muestra éxito o el error real del proveedor.
4. Un QR vencido, reutilizado o cancelado no permite entregar datos.
5. El servicio de retransmisión no puede leer las credenciales porque solo recibe el paquete cifrado.
6. Una pérdida de red, sesión vencida o error del servicio devuelve un mensaje comprensible y permite usar la entrada manual.
7. No aparecen credenciales ni tokens en registros o archivos del repositorio.
8. La función se valida con cuentas de prueba autorizadas antes de considerarse terminada.

## Bloqueo externo

La implementación completa requiere desplegar y configurar un servicio HTTPS de emparejamiento. El repositorio actual no contiene un servicio desplegado ni una URL de producción configurada. No se debe inventar una dirección ni declarar funcional el QR antes de desplegarlo y probar el flujo de extremo a extremo.
