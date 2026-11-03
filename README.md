# EL GANADOR — MVP V11

Prototipo responsive de una red social y marketplace de sorteos. La base visual del MVP ahora comparte sorteos y disponibilidad mediante una API de Next.js y una base de datos SQLite.

## Requisitos

- Node.js 22.5 o superior, que incluye `node:sqlite`.
- npm.

## Ejecutar en desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). En el primer inicio, SQLite crea `data/el-ganador.sqlite` y carga los cuatro sorteos de muestra.

## Qué ya funciona

- Búsqueda y filtros del marketplace.
- Lectura de sorteos desde `GET /api/draws`.
- Contadores con boletos vendidos, disponibles y en reserva.
- Reservas de 1 a 10 números por 10 minutos con `POST /api/participations`.
- Asignación transaccional de números para que dos solicitudes simultáneas no reserven el mismo boleto.
- Actualización de disponibilidad cada cinco segundos en el navegador.
- Liberación de reservas vencidas al consultar sorteos o crear otra reserva.

Los datos iniciales son ficticios. La reserva solo aparta números temporalmente: no hay cuentas, cobros ni sorteos reales. SQLite funciona para desarrollo y para una instancia persistente de Node.js; para escalar a varios servidores y salir a producción habrá que migrar a una base de datos compartida y añadir autenticación, pagos, permisos y auditoría.

Puedes elegir otro archivo de base de datos definiendo `EL_GANADOR_DB_PATH` antes de iniciar el servidor.
