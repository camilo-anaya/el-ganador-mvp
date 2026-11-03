# Plan de preparación regulatoria y técnica — El Ganador

**Fecha de revisión:** 2 de noviembre de 2026  
**Estado:** plan interno de producto. No es concepto jurídico, certificación ni constancia de autorización.

## Objetivo

Preparar El Ganador para el modelo objetivo expresado por SOLVIO: **SOLVIO busca ser el operador autorizado y los comercios/personas terceros podrán actuar como gestores de rifas de artículos propios**. La estructura jurídica concreta, las autorizaciones aplicables y sus requisitos siguen pendientes de validación profesional. La demo puede seguir evolucionando, pero no debe presentarse como operación autorizada ni aceptar ventas reales mientras falten permisos, operador autorizado, pagos y validaciones.

## Modelo operativo objetivo

- **SOLVIO S.A.S.:** aspira a ser el operador autorizado responsable de la operación, el control y las obligaciones que le correspondan.
- **El Ganador:** marca y plataforma digital de SOLVIO para recibir solicitudes, registrar rifas, administrar ventas autorizadas y dar seguimiento a sorteos.
- **Terceros:** tiendas, empresas y personas interesadas en ofrecer artículos propios actuarían como gestores. Cada rifa debe ser presentada, revisada y autorizada a través del operador antes de promocionarse o venderse.
- **Premios de terceros:** el expediente por rifa debe acreditar la propiedad/disponibilidad del premio, su descripción y valor, y los soportes y garantías que exija la autoridad para ese caso. El operador debe validar esa evidencia y conservarla.
- **Distinción pendiente:** confirmar con asesoría jurídica si, además de la autorización de operación de rifas, SOLVIO debe obtener una autorización separada como operador tecnológico de operación sistematizada y si ambas funciones pueden recaer en la misma sociedad bajo las reglas aplicables.

## Lo que ya existe en el prototipo

- Marketplace, perfiles de negocio y cliente, planes y creación de rifas.
- Cartones numerados del **#1 al total configurado**. Los límites comerciales del código llegan hasta 1.000 números por rifa en Empresarial.
- Estados de tiquetes `available`, `reserved` y `sold`; las reservas vencen y se liberan.
- Carga de documentos de negocio con estado inicial pendiente.
- Sala visual de balotas y ruleta identificada como demostración.

Estos elementos son base de producto, no prueban que una rifa tenga autorización, que un pago fue confirmado o que el mecanismo de sorteo esté certificado.

## Brechas del código revisado

1. **Aprobación y publicación:** `draws` usa principalmente `published` y `live`. No hay un estado de autorización por rifa ni campos para autoridad, alcance territorial, acto administrativo o evidencia. El API de negocio puede publicar una rifa directamente.
2. **Revisión de gestores:** el registro recoge datos y archivos, pero no hay un flujo completo de verificación con un rol de operador interno, decisiones motivadas, historial y suspensión.
3. **Venta de tiquetes:** la participación de cliente queda como `reserved` o `expired`. No existe en este flujo una transición de pago confirmado que convierta la reserva en venta final; por tanto, `sold` no equivale por sí solo a un pago conciliado.
4. **Sorteo real:** la página `/sorteo-en-vivo` usa números de muestra y selecciona en el navegador. Es una demo visual, no un resultado registrado e inmutable asociado a una rifa autorizada.
5. **Trazabilidad:** no se encontró un registro de auditoría append-only para autorizaciones, pagos, cierres, resultados, cambios de estado o entrega del premio.
6. **Supabase y esquema:** la aplicación usa `pg` desde el servidor con `DATABASE_URL` y SQLite para desarrollo local. El repositorio no contiene migraciones SQL ni políticas RLS declaradas. La configuración remota del proyecto Supabase no se verificó.
7. **Planes:** el documento de negocio y `lib/plans.ts` no coinciden en algunos porcentajes ni en la inclusión del plan Empresarial. Los límites de plan deben tratarse como reglas comerciales, no como permisos regulatorios.

## Flujo objetivo

Los estados deben cambiar desde el servidor y quedar registrados con actor, fecha y motivo:

1. Gestor: `borrador → verificación pendiente → verificado / requiere ajustes / suspendido`.
2. Rifa: `borrador → solicitud → en revisión → requiere ajustes / autorizada → venta habilitada → venta cerrada → sorteo pendiente → sorteada → premio entregado → cerrada`.
3. Tiquete: `disponible → reservado → pago pendiente → pagado`; además, manejar expirado, invalidado, reembolsado y contracargo según corresponda.
4. Antes del sorteo, cerrar ventas, reportar y excluir los números que no participan según el procedimiento autorizado, y congelar el conjunto elegible.
5. Registrar un único resultado en el servidor. La animación de balotas o ruleta solo lo representa; no puede escoger, cambiar ni repetir el resultado.
6. Registrar la reclamación y evidencia de entrega del premio, además de las obligaciones financieras y regulatorias aplicables.

El rango visible del cartón puede ser #1–#N según el tamaño autorizado/configurado; el conjunto elegible debe ser independiente y componerse de tiquetes válidos con compra confirmada. No se debe sortear sobre números no vendidos por simple conveniencia técnica.

## Fases recomendadas

### Fase 0 — Definiciones jurídicas y operativas

Resolver con abogado colombiano y la autoridad/operador correspondiente:

- Confirmar el esquema de autorizaciones para que SOLVIO opere las rifas y, a la vez, permita que terceros sean gestores; confirmar también si la misma sociedad requiere una autorización tecnológica separada.
- Qué autoridad aplica según cobertura territorial.
- Qué mecanismo se utilizará en cada modalidad: resultado de lotería tradicional o GNA, con requisitos y certificaciones aplicables.
- Cómo se fijan emisión, participantes, cierre, números no vendidos, aplazamientos y comunicación al público.
- Quién custodia/recibe el dinero, cómo se liquida, y cómo se manejan derechos, costos, comisiones, reembolsos y contracargos.

### Fase 1 — Controles de autorización

- Crear roles separados para cliente, gestor y equipo interno autorizado.
- Añadir expediente del gestor y expediente por rifa, con documentos, estado, autoridad, alcance, fechas y número del acto de autorización.
- Bloquear en el servidor publicación comercial y venta hasta que la rifa tenga aprobación registrada.
- Mantener el marketplace de demostración separado de las rifas reales.

### Fase 2 — Pagos y conciliación

- Integrar el flujo de compra con confirmación firmada del proveedor de pagos; el retorno del navegador no debe marcar tiquetes como pagados.
- Procesar eventos idempotentes y transacciones concurrentes en base de datos para evitar doble venta.
- Mantener historial de pago, reserva, vencimiento, reverso y conciliación.
- Implementar un libro contable/registro de liquidación; no mostrar una “billetera” como dinero disponible si no existe una estructura legal y financiera para custodiar fondos.

### Fase 3 — Sorteo y evidencia

- Implementar solo el mecanismo aprobado y certificado para la operación real.
- Congelar y conservar la lista elegible, su huella digital, fecha de cierre, fuente/método aprobado, resultado y versión del software.
- Hacer el resultado de solo lectura una vez confirmado; cualquier incidente debe seguir un procedimiento autorizado, nunca un botón de “volver a sortear”.
- Guardar acta, transmisión/registro audiovisual cuando aplique, ganador, reclamación y entrega.

### Fase 4 — Datos, seguridad y lanzamiento

- Crear migraciones versionadas para SQLite local y PostgreSQL/Supabase, con revisión antes de aplicarlas al proyecto remoto.
- Definir permisos por rol y propiedad; revisar RLS y el rol de conexión de `DATABASE_URL`. Mantener claves privilegiadas exclusivamente en servidor.
- Usar almacenamiento privado para documentos personales, acceso temporal y políticas de retención/borrado.
- Añadir respaldos, monitoreo, alertas, recuperación y evidencia de auditoría.
- Habilitar operación real únicamente después de validar permisos, certificaciones, pagos, seguridad, términos, privacidad y obligaciones tributarias/regulatorias.

## Referencias regulatorias oficiales

- [Decreto 1486 de 2024 — Gestor Normativo de Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=256696)
- [Acuerdo 821 de 2025 y anexo técnico de rifas — CNJSA/Coljuegos](https://cnjsa.coljuegos.gov.co/documentos/214035/rifas/)
- [Resolución 20260005674 de 2026 — requisitos jurídicos y financieros para operadores tecnológicos](https://www.coljuegos.gov.co/publicaciones/307293/conozca-resolucion-no-20260005674-por-la-cual-se-modifica-la-resolucion-no-20250018494-del-22-de-agosto-de-2025-por-medio-de-la-cual-se-fijan/)

Las referencias deben verificarse de nuevo con asesoría jurídica antes de usarse para liberar funcionalidades o redactar afirmaciones públicas de autorización.
