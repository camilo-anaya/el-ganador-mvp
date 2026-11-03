# Configurar pagos de planes con Wompi

La aplicación usa el Web Checkout oficial. Una cuenta de negocio paga en Wompi; El Ganador activa el plan solo cuando recibe y valida el evento firmado del servidor.

## 1. Configurar Sandbox

En el dashboard de comercios de Wompi, abre **Desarrolladores → Secretos para integración técnica** y copia las credenciales del ambiente de pruebas. En el `.env.local` de esta aplicación configura:

```env
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
WOMPI_EVENTS_SECRET=test_events_...
```

Las tres llaves deben pertenecer al mismo ambiente. No se necesita la llave privada para esta integración de Web Checkout.

## 2. Configurar el evento del servidor

En la configuración de eventos de Wompi Sandbox, registra esta URL pública:

```text
https://TU-DOMINIO/api/payments/wompi/events
```

El servidor verifica la firma del evento, la referencia, el monto y la moneda antes de activar la cuenta. La redirección del navegador solo informa el resultado y no autoriza el plan por sí sola.

## 3. Dirección de la aplicación

En producción añade al entorno del hosting la URL HTTPS base, sin una ruta adicional:

```env
APP_URL=https://TU-DOMINIO
```

Wompi necesita acceder a la URL pública del evento. `localhost` no es accesible desde sus servidores, así que los pagos de prueba no activarán cuentas mientras la aplicación siga solo en el equipo local.

## 4. Producción

Cuando Wompi habilite el comercio para cobros reales, configura en el hosting las credenciales `pub_prod_...`, `prod_integrity_...` y `prod_events_...`. Registra por separado la URL de eventos de Producción; Wompi usa una URL distinta para Sandbox y Producción. No guardes llaves reales en archivos públicos ni las compartas por chat.

El Web Checkout muestra los métodos habilitados para el comercio. PSE estará disponible si está habilitado en la cuenta Wompi; esta integración no fuerza PSE como único medio.
