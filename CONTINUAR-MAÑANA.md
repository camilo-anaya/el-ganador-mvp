# Punto de continuación — El Ganador

Guardado: 3 de noviembre de 2026

## Carpeta de la app

`C:\Users\camil\Documents\Codex\2026-10-01\se\el-ganador-mvp`

Aquí está el proyecto real de la app. Todavía es local; no está publicado en internet. Supabase guarda la base de datos y archivos, no el sitio web.

## Supabase

- Proyecto nuevo: **EL GANADOR**
- Organización: **SOLVIO**, como proyecto separado de **SOLVIO ADMIN**
- Referencia del proyecto: `reabawvvduiibgjhqrbo`
- La conexión de la app está preparada para usar PostgreSQL y Storage de Supabase.
- No poner contraseñas ni claves en esta nota, el chat ni capturas.

## Estado que dejamos

- El proyecto Supabase **EL GANADOR** aparece `ACTIVE_HEALTHY` y respondió una consulta de solo lectura.
- En `.env.local`, `SUPABASE_URL` apunta al proyecto correcto, pero `DATABASE_URL` está vacía y `SUPABASE_SECRET_KEY` conserva el valor de plantilla. La app local está usando SQLite, no Supabase, hasta completar ambas variables.
- No se imprimieron ni compartieron credenciales. Completar los valores dentro de `.env.local` y reiniciar el servidor.
- También están `.env.example` y `CONFIGURAR_SUPABASE.md` como guía.
- La configuración necesita la URI de Transaction Pooler en `DATABASE_URL`, la URL del proyecto en `SUPABASE_URL` y la clave secreta en `SUPABASE_SECRET_KEY`.
- Existe respaldo local: `data\el-ganador-backup-2026-11-02.sqlite`.
- El proyecto remoto se verificó antes: tenía rifas y tiquetes de demostración; no se habían creado cuentas ni documentos legales.

## Cambios del 3 de noviembre

- Se actualizó el aviso de cobertura legal para explicar jurisdicción municipal/distrital, departamental y nacional en Colombia.
- El recuadro de reglas para vendedores se compactó con CSS, manteniendo la guía completa.
- Se añadió una guía desplegable con los pasos generales de organización de una rifa, debajo de los planes y en el formulario de creación.
- El texto visible ahora dice: “El Ganador opera dentro del marco legal colombiano” y aclara que cada rifa requiere sus propios registros y autorizaciones según cobertura.
- La persona usuaria indica que su gerente confirmó la aprobación y que entregará los documentos oficiales. Cuando se reciban, revisar entidad emisora, acto/resolución, titular, alcance y vigencia antes de publicar datos concretos de autorización.
- La guía mantiene la aclaración de que la demo de balotas/ruleta es ilustrativa y no determina ganadores de rifas reales.
- Archivos de la última edición: `app/components/RaffleTerritoryNotice.tsx`, `app/components/RaffleOrganizerGuide.tsx`, `app/components/RaffleTerritoryFields.tsx`, `app/globals.css` y `lib/plans.ts`.

## Próximos pasos

1. Completar en `.env.local` la URI de Transaction Pooler y la clave secreta del proyecto **EL GANADOR**, sin compartirlas por chat.
2. Reiniciar el servidor local y verificar que la app se conecta a Supabase.
3. Levantar el servidor local y abrir la página principal de la app.
4. Después, seguir con la verificación del guardado de datos y el desarrollo pendiente.
5. Retomar desde el aviso legal y completar la revisión cuando estén disponibles los documentos oficiales mencionados.

Nota: la ventana de Bloc de notas no mostró contenido tras copiar. Mañana conviene hacer la configuración directamente en el editor, guiando cada paso en pantalla y verificando lo que aparece antes de continuar.
