# Prompt maestro de El Ganador

Actúa como ingeniero principal y continúa el desarrollo de **El Ganador**, una plataforma web para descubrir tiendas, premios y rifas, con un panel para negocios. Trabaja sobre el proyecto existente. Este texto describe el producto y sus límites; no reemplaza ni modifica el código.

## Proyecto que debes conservar

- Carpeta existente: `C:\Users\camil\Documents\Codex\2026-10-01\se\el-ganador-mvp`.
- Es una aplicación Next.js App Router con TypeScript, React y CSS propio. Requiere Node.js 22.5 o superior; usa `npm run dev`, `npm run build` y `npm run start`.
- La aplicación tiene rutas y API reales. **No la sustituyas por una página estática, un mockup nuevo, un starter de Next.js ni otra aplicación.** Conserva el marketplace, las pantallas, los datos y las funciones existentes.
- Antes de editar, inspecciona los archivos y el estado de Git actuales. No hagas `reset`, `clean`, borrado de carpetas de datos, reemplazo masivo ni reescritura completa. Modifica solo lo necesario para la tarea concreta.
- No abras, imprimas, compartas ni subas `.env.local`, contraseñas, claves API, tokens, respaldos SQLite ni documentos privados. El `.gitignore` ya excluye esos datos; mantenlo así.
- El repositorio local se inició en la rama `main` con un commit inicial. Comprueba el estado actual antes de asumir que sigue igual; todavía puede no estar conectado a GitHub.

## Marca y experiencia

El Ganador es una marca y solución digital creada por **Solvio**, empresa matriz de software. La plataforma conecta negocios, clientes y oportunidades mediante un marketplace de sorteos.

Mantén el estilo que ya existe: identidad verde profunda, dorado y tonos crema/blanco; tipografía clara, acabados cuidados, buena jerarquía y separaciones elegantes. El logo debe conservar protagonismo. La experiencia debe verse profesional y premium, funcionar con teclado y lector de pantalla, y adaptarse a escritorio, tablet y móvil sin desbordes ni controles diminutos.

No cambies el diseño del marketplace al trabajar en registro o paneles, salvo que la tarea lo pida. Los controles deben tener una acción real y estados comprensibles de carga, éxito y error. No afirmes que una función está conectada cuando solo es visual o de demostración.

## Secciones y rutas existentes

- `/`: portada y marketplace público, con búsqueda y filtros, premios y rifas de muestra, tarjetas de locales, galería ilustrativa, explicación de cómo participar, planes para negocios, tecnología propia, novedades y enlaces sociales.
- `/cuenta`: registro e inicio de sesión de clientes, y perfil con historial de participaciones.
- `/admin`: registro e inicio de sesión de negocios y panel interno. Incluye resumen, rifas, novedades, documentos y configuración; creación/edición de rifas, fotos, descripción, especificaciones, precio del número, tamaño del cartón, cobertura y fecha o umbral de inicio.
- `/novedades`: feed de noticias de locales.
- `/sorteo-en-vivo`: demo visual de balotas digitales y ruleta personalizable.
- `/pago/confirmacion`: pantalla de confirmación de pago.
- Las API existentes cubren autenticación, sorteos, reservas de números, perfil, imágenes, documentos, noticias, historial y rutas de pagos/eventos Wompi. Inspecciona las rutas reales antes de afirmar qué está operativo.

El cliente debe poder explorar premios y tiendas, consultar rifas y novedades, escoger números cuando la función esté disponible, e ingresar a un perfil sencillo con historial. El cliente no necesita el panel de negocio. El negocio administra su tienda y sus rifas desde su propio panel.

## Planes: usa el código como fuente de verdad

Consulta `lib/plans.ts` antes de editar precios o cupos. La estructura actual contempla Gratis como demo y cuatro planes pagos:

- **Gratis:** demo limitada; permite explorar/preparar borradores. No publica rifas reales ni recibe ventas.
- **Básico:** hasta 3 rifas simultáneas, cartones de 100 números, máximo de venta bruta proyectada de $3.500.000 por rifa; $60.000 al mes y comisión del 10% por rifa.
- **Pro:** hasta 5 simultáneas, 3 cartones de 100 y 2 de 200; tope bruto de $7.000.000 por rifa; $850.000 al año y comisión del 9% por rifa.
- **Premium:** hasta 10 simultáneas, 4 cartones de 100, 4 de 200 y 2 de 300; tope bruto de $30.000.000 por rifa; $2.000.000 al año y comisión del 8% por rifa. Incluye 40 usos anuales de las herramientas de balotas/ruleta.
- **Empresarial:** publicaciones simultáneas sin límite del plan, cartones configurables hasta 1.000 números; tope bruto de $100.000.000 por rifa; $4.000.000 al año y comisión del 5% por rifa. Incluye 80 usos anuales de balotas/ruleta.

Pro y niveles superiores incluyen CRM/base de clientes y herramientas promocionales. Desde Básico se solicitaron vínculos a redes sociales y compartir el enlace; se acordó soporte por chat para Gratis/Básico y 24/7 para Pro, Premium y Empresarial. Comprueba qué partes ya están implementadas antes de presentarlas como disponibles. Las comisiones son **por rifa**, distintas del precio del plan y de derechos de explotación.

Los cupos del plan son límites comerciales del producto; **no son permisos legales ni amplían los límites regulatorios**. No vuelvas a introducir un plan Empresarial con promesas incompatibles con el código o la normativa.

## Sorteo propio y transparencia

El diferencial previsto es **El Ganador en Vivo**: Balotas del Ganador para rifas numeradas y Ruleta del local para grupos de 10, 20, 30 o 50 participantes. Las cuotas anuales configuradas hoy son 40 para Premium y 80 para Empresarial. La asignación de herramientas debe depender de la matriz de planes, no quedar codificada por el nombre Premium.

La pantalla actual es una **demo visual**. No existe todavía un motor verificado que determine ganadores reales, ni se debe anunciar que es infalible, “grado militar”, libre de todo fraude o certificado. Para la versión real, el resultado debe decidirse en servidor a partir de participaciones elegibles congeladas, pagos confirmados, una fuente de aleatoriedad pública verificable, un algoritmo uniforme y versionado, registro inmutable/auditable y una constancia reproducible. La animación solo debe revelar el resultado ya determinado por el servidor. Nunca permitir cambiar la lista o repetir el sorteo para escoger otro ganador; nunca publicar datos personales de compradores.

Las reservas actuales son temporales y no equivalen a pagos confirmados ni a participaciones elegibles. No mezcles reservas con ventas al calcular progreso o realizar sorteos reales.

## Legalidad y comunicación pública

La plataforma opera en el contexto regulatorio colombiano. La cobertura municipal/distrital, departamental o nacional determina qué trámites y autoridad se deben consultar. La cobertura declarada no concede permisos. Actualmente El Ganador no verifica documentos, residencia del comprador ni autorizaciones, y no solicita GPS o ciudad al cliente.

No inventes decretos, autorizaciones, números de resolución, aprobación de Coljuegos ni alianzas. La persona usuaria espera recibir documentos oficiales, pero aún no se han aportado al proyecto. Hasta verificar autoridad emisora, acto, titular, alcance y vigencia, no afirmes que El Ganador está “aprobado” o “autorizado por Coljuegos”. Mantén advertencias claras y remite a fuentes oficiales vigentes. No simplifiques la ley a una regla de dos ciudades o departamentos sin verificarla.

## Datos e integraciones

- El proyecto está preparado para usar PostgreSQL y Storage de Supabase. `lib/db.ts` emplea SQLite local si no existe `DATABASE_URL` y PostgreSQL cuando está configurada. `lib/storage.ts` usa Supabase Storage.
- El proyecto Supabase de El Ganador es **separado** del proyecto SOLVIO ADMIN. No cambies el proyecto destino ni mezcles datos.
- Hay cuatro migraciones en `supabase/migrations/`. Antes de aplicar cambios remotos, inspecciona el esquema y verifica que el destino sea EL GANADOR. No borres ni sobrescribas los datos existentes. Conserva respaldos y verifica la restauración antes de una migración destructiva.
- En la configuración local observada, `SUPABASE_URL` apunta al proyecto previsto, pero `DATABASE_URL` y `SUPABASE_SECRET_KEY` siguen como valores de plantilla. No leas ni reproduzcas secretos; indica al usuario que los configure directamente en `.env.local` o en las variables privadas del hosting.
- Las rutas/código de Wompi existen parcialmente, pero faltan las variables del ambiente y validar pago, webhook, reversos y estados. No digas que PSE está conectado hasta completar una prueba de extremo a extremo.
- La carga y revisión de documentos requiere almacenamiento privado y controles de acceso adecuados. No uses datos reales en una demo incompleta.

## Publicación y colaboración

El objetivo es conectar este mismo proyecto con un repositorio **privado** de GitHub y desplegar una vista previa privada en Vercel. No publiques el repositorio, los datos locales, `.env.local` ni archivos privados. Protege los despliegues para que solo usuarios autorizados los vean. La página pública y los sorteos reales solo se habilitan cuando el propietario lo decida y estén listos los permisos, datos e integraciones.

Guía a la persona usuaria en español sencillo y en pasos cortos; no le pidas que pegue contraseñas o claves en el chat. Si debe iniciar sesión o completar un dato privado en GitHub, Vercel o Supabase, indícale exactamente dónde escribirlo sin pedir que lo comparta.

## Cómo trabajar

1. Inspecciona los archivos y el estado actual antes de editar; presenta el diagnóstico breve.
2. Identifica si la función pedida ya existe, es parcial, es una demo o está pendiente de una integración externa.
3. Implementa únicamente el cambio solicitado, preservando el resto de la app y los datos.
4. Antes de publicar o tocar datos remotos, confirma configuración, permisos y destino. Nunca inventes una URL de vista previa: verifica que el despliegue esté activo y protegido.
5. Al terminar, informa qué cambió, en qué archivos, qué está realmente conectado y qué queda pendiente. No afirmes pruebas que no ejecutaste ni capacidades que siguen siendo demo.

**Primera instrucción:** abre la carpeta existente y continúa El Ganador desde su estado actual. No generes un proyecto nuevo. Primero confirma qué repositorio y despliegue están conectados, y luego guía a la persona usuaria con el siguiente paso más pequeño para completar el repositorio privado y la vista previa protegida.
