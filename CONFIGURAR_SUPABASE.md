# Conectar El Ganador a su base de datos

El proyecto Supabase **EL GANADOR** está separado de **SOLVIO ADMIN**. Copiamos allí las 4 rifas, sus 3.000 números y la participación de demostración. Las rutas del servidor ya están preparadas para guardar registros, sesiones, noticias, rifas, reservas y compras en PostgreSQL, y las fotos/documentos en Supabase Storage.

## Activar la conexión en este computador

1. Abre el archivo `.env.example` de esta carpeta y guárdalo como `.env.local`.
2. Entra al proyecto [EL GANADOR en Supabase](https://supabase.com/dashboard/project/reabawvvduiibgjhqrbo).
3. En **Connect**, copia la URI de **Transaction pooler** y pégala en `DATABASE_URL`. Usa exactamente la URI del panel, con el puerto `6543` y `sslmode=require`.
4. En **Project Settings → API Keys**, copia la **Secret key** del proyecto y pégala en `SUPABASE_SECRET_KEY`.
5. Conserva la URL ya indicada en `SUPABASE_URL`.
6. Guarda `.env.local` junto a `package.json` y reinicia el servidor de desarrollo.

No compartas ni subas `.env.local`: Git lo ignora. Si no recuerdas la contraseña de base de datos, restablécela en **Project Settings → Database** de **EL GANADOR** y actualiza `DATABASE_URL`. Eso no cambia la contraseña ni los datos de **SOLVIO ADMIN**.

Sin `DATABASE_URL`, el modo de desarrollo usa el respaldo SQLite local. En producción, la aplicación falla con un error claro en vez de fingir que los datos quedaron guardados en Supabase. El despliegue público requerirá colocar las mismas variables como secretos del servicio de hosting.
