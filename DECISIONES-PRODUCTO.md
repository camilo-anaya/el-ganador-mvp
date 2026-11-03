# Decisiones del producto — El Ganador

Actualizado: 1 de noviembre de 2026

## Diferencial acordado

El producto debe tener una experiencia propia llamada **El Ganador en Vivo**: un motor de sorteo de la plataforma, presentado con una ruleta original y una extracción de balotas digitales estilo bingo. El resultado lo determina el servidor; la animación solo revela el resultado y nunca lo elige.

La herramienta tiene dos microjuegos: **Balotas del Ganador**, que extrae un número elegible de una rifa; y **Ruleta del local**, que admite listas personalizadas de 10, 20, 30 o 50 participantes para eventos exclusivos. Un único motor de aleatoriedad verificable determina el resultado de ambos modos. El plan decide qué microjuego se habilita y su cuota anual; no debe quedar acoplado al nombre Premium. Las cuotas actuales definidas para Premium y Empresarial son 40 y 80 sorteos anuales, y la matriz debe permitir asignar la herramienta a otros planes.

La experiencia debe mostrar en tiempo real el estado del sorteo, el premio y el resultado. Al terminar debe producir una constancia pública verificable y un clip breve para compartir en redes.

## Reglas de transparencia que debe cumplir el motor

- Publicar las reglas y la fecha o condición de cierre antes de aceptar participaciones. Los porcentajes de inicio de venta no deben confundirse con la condición para cerrar y sortear.
- Al cierre, impedir nuevas compras y congelar el conjunto de participaciones elegibles. Solo los pagos confirmados deben participar; reservas temporales, pagos fallidos o reembolsados no son participaciones elegibles.
- Registrar una huella criptográfica del listado congelado y comprometer de antemano la ronda futura de una fuente pública distribuida de aleatoriedad, por ejemplo drand.
- Derivar el número ganador con una regla pública, uniforme y versionada. No permitir que el negocio elija el número, repita el sorteo hasta obtener otro ganador ni cambie la lista después de conocer la aleatoriedad.
- Guardar y publicar el identificador del sorteo, la hora de cierre, el hash del listado, la ronda y prueba de la fuente aleatoria, el algoritmo y el número ganador. No publicar datos personales de compradores.
- Animar las mismas balotas y el resultado en todos los dispositivos desde eventos enviados por el servidor. Mantener un registro de auditoría de cambios y fallos.

La plataforma puede hacer el resultado reproducible y resistente a manipulaciones ocultas; no se debe prometer “cero fraude” absoluto. La operación, los permisos de cuentas, los pagos, la infraestructura y la auditoría independiente también deben protegerse.

## Estado del prototipo al guardar este respaldo

- La aplicación usa SQLite en `data/el-ganador.sqlite` y guarda sorteos, cuentas, documentos, noticias y reservas locales.
- Las participaciones actuales son reservas temporales de 10 minutos; no hay pasarela conectada ni registro de pagos confirmados.
- Aún no existe el motor de selección de ganadores, la sala de extracción por balotas, un resultado auditable ni un trabajador programado para ejecutar sorteos automáticamente.
- Por eso los sorteos y números iniciales son de demostración. No usar el prototipo para rifas con dinero o premios reales.

## Orden recomendado de implementación

1. Definir la operación y confirmar la clasificación y permisos aplicables en Colombia.
2. Integrar pagos con confirmaciones de servidor y mantener un libro de participaciones idempotente.
3. Cerrar y congelar automáticamente cada sorteo conforme a sus reglas publicadas.
4. Integrar y verificar la fuente pública de aleatoriedad; generar el resultado una sola vez y guardar su prueba.
5. Crear la sala pública en vivo con ruleta/balotas, certificado y verificador del resultado.
6. Generar el clip promocional desde el mismo resultado verificado.

## Referencias regulatorias a validar antes de operar

- Ley 643 de 2001, gestor normativo de Función Pública: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=4168
- Trámites y autorización de rifas nacionales de Coljuegos: https://coljuegos.gov.co/publicaciones/300657/tramites_operadores_/
- Resolución 20260005674 de Coljuegos sobre requisitos de terceros interesados en ser operadores tecnológicos de rifas sistematizadas: https://www.coljuegos.gov.co/publicaciones/307293/conozca-resolucion-no-20260005674-por-la-cual-se-modifica-la-resolucion-no-20250018494-del-22-de-agosto-de-2025-por-medio-de-la-cual-se-fijan/
- Drand, documentación de aleatoriedad pública verificable: https://developers.cloudflare.com/randomness-beacon/cryptographic-background/randomness-generation/

## Continuidad del trabajo — 1 de noviembre de 2026

- La demo interactiva está publicada localmente en `/sorteo-en-vivo`; muestra balotas digitales y ruleta personalizable. Es solo una simulación y todavía no determina ganadores de rifas reales.
- En el registro de negocio, el bloque informativo sobre El Ganador, sus herramientas de balotas y ruleta, y la demo queda debajo de las tarjetas de planes. El mensaje aclara que pagos y motor verificable aún no están conectados.
- El inicio público también promociona la demo. En el panel del negocio, `Sorteo en vivo` se habilita desde la navegación lateral solo si el plan configurado incluye `liveDrawTools`; los otros planes lo muestran bloqueado.
- Decisión confirmada: mantener cuatro planes pagos (Básico, Pro, Premium y Empresarial) y mostrar Gratis aparte como una demo del panel. Gratis permite preparar borradores, pero no publicar rifas ni recibir ventas reales.
- Las cuotas de 40 y 80 de Premium y Empresarial corresponden a usos anuales de las herramientas propias de balotas y ruleta; no son permisos ni cupos de rifas legales.
- La tarjeta Empresarial ya no promete “rifas ilimitadas al año”. La capacidad sin límite se presenta como capacidad del plan/catálogo y no como autorización para operar rifas sin límite.
- Revisión normativa inicial: el Decreto 1486 de 2024 limita al gestor a dos rifas por mes y exige que las rifas sistematizadas se registren y operen mediante un operador autorizado. Coljuegos publicó en marzo de 2026 la Resolución 20260005674 sobre requisitos para terceros interesados en ser operadores tecnológicos. El Ganador aún no integra un operador autorizado; validar el modelo jurídico y el alcance aplicable antes de ofrecer rifas reales.
