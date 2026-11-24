const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function createLegalPdf() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;

  function checkPageBreak(neededSpace = 24) {
    if (y - neededSpace < MARGIN_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN_TOP;
      // Header decorativo en páginas subsecuentes
      page.drawLine({
        start: { x: MARGIN_LEFT, y: PAGE_HEIGHT - 35 },
        end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: PAGE_HEIGHT - 35 },
        thickness: 0.5,
        color: rgb(0.7, 0.75, 0.8),
      });
      page.drawText('Plataforma El Ganador · Consulta Técnica ante Coljuegos · Camilo Andrés Anaya Jordán', {
        x: MARGIN_LEFT,
        y: PAGE_HEIGHT - 30,
        size: 7.5,
        font: fontItalic,
        color: rgb(0.4, 0.45, 0.5),
      });
    }
  }

  function wrapText(text, maxWidth, font, size) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function printParagraph(text, font = fontRegular, size = 9.5, color = rgb(0.12, 0.12, 0.14), indent = 0, lineGap = 13.5) {
    const rawParagraphs = text.split('\n');
    for (const rawP of rawParagraphs) {
      if (!rawP.trim()) {
        y -= 6;
        continue;
      }
      const lines = wrapText(rawP.trim(), CONTENT_WIDTH - indent, font, size);
      for (const line of lines) {
        checkPageBreak(lineGap);
        page.drawText(line, {
          x: MARGIN_LEFT + indent,
          y,
          size,
          font,
          color,
        });
        y -= lineGap;
      }
      y -= 3;
    }
  }

  function printHeading(title, size = 11, color = rgb(0, 0.22, 0.44)) {
    y -= 6;
    checkPageBreak(30);
    page.drawText(title, {
      x: MARGIN_LEFT,
      y,
      size,
      font: fontBold,
      color,
    });
    y -= 5;
    page.drawLine({
      start: { x: MARGIN_LEFT, y },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
      thickness: 1,
      color: rgb(0.8, 0.85, 0.9),
    });
    y -= 10;
  }

  // ENCABEZADO INSTITUCIONAL
  page.drawText('DERECHO DE PETICIÓN EN MODALIDAD DE CONSULTA TÉCNICA Y VIABILIDAD JURÍDICA', {
    x: MARGIN_LEFT,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0.22, 0.44),
  });
  y -= 14;

  page.drawText('(Artículo 23 de la Constitución Política de Colombia y Artículo 14 de la Ley 1437 de 2011 - CPACA)', {
    x: MARGIN_LEFT,
    y,
    size: 8.5,
    font: fontItalic,
    color: rgb(0.35, 0.4, 0.45),
  });
  y -= 8;

  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
    thickness: 2,
    color: rgb(0, 0.22, 0.44),
  });
  y -= 16;

  // FECHA Y DESTINATARIO
  printParagraph('Bogotá D.C. / Colombia, 23 de Noviembre de 2026', fontBold, 9.5, rgb(0.1, 0.1, 0.1));
  y -= 2;

  printParagraph('Señores:', fontBold, 9.5, rgb(0, 0.22, 0.44));
  printParagraph('EMPRESA INDUSTRIAL Y COMERCIAL DEL ESTADO ADMINISTRADORA DEL MONOPOLIO RENTÍSTICO DE LOS JUEGOS DE SUERTE Y AZAR – COLJUEGOS', fontBold, 9.5, rgb(0.1, 0.1, 0.1));
  printParagraph('Atención: Presidencia de Coljuegos / Gerencia de Nuevos Negocios / Gerencia de Seguimiento y Control\nCarrera 11 # 93A - 85, Bogotá D.C., Colombia\nCorreo electrónico oficial de radicación: contactenos@coljuegos.gov.co', fontRegular, 9, rgb(0.25, 0.25, 0.25));
  y -= 4;

  // CAJA DE ASUNTO
  const asuntoText = 'ASUNTO: Consulta técnica y viabilidad jurídica respecto al modelo operativo de la plataforma tecnológica "EL GANADOR", como herramienta de software (SaaS), mandato digital y trazabilidad criptográfica (SHA-256) para la gestión, control tributario (14% Derechos de Explotación a la Salud) y emisión digital de rifas y juegos promocionales en Colombia.';
  const asuntoLines = wrapText(asuntoText, CONTENT_WIDTH - 20, fontBold, 8.8);
  const boxHeight = asuntoLines.length * 12 + 14;

  checkPageBreak(boxHeight + 10);
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - boxHeight + 4,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: rgb(0.95, 0.97, 0.99),
    borderColor: rgb(0, 0.22, 0.44),
    borderWidth: 1,
  });

  let asuntoY = y - 8;
  for (const aLine of asuntoLines) {
    page.drawText(aLine, {
      x: MARGIN_LEFT + 10,
      y: asuntoY,
      size: 8.8,
      font: fontBold,
      color: rgb(0, 0.18, 0.36),
    });
    asuntoY -= 12;
  }
  y -= (boxHeight + 8);

  // SECCIÓN I
  printHeading('I. IDENTIFICACIÓN DEL PETICIONARIO');
  printParagraph('• Nombres y Apellidos: CAMILO ANDRÉS ANAYA JORDÁN', fontBold, 9.5);
  printParagraph('• Documento de Identidad: Cédula de Ciudadanía No. 1.001.854.729', fontRegular, 9.5);
  printParagraph('• Calidad: Titular, Fundador y Desarrollador de la Plataforma Tecnológica "El Ganador"', fontRegular, 9.5);
  printParagraph('• Teléfono Celular de Contacto: (+57) 304 665 2316', fontRegular, 9.5);
  printParagraph('• Correo Electrónico Oficial de Notificaciones: camilnikos2918@gmail.com', fontBold, 9.5, rgb(0, 0.22, 0.44));

  // SECCIÓN II
  printHeading('II. FUNDAMENTO FÁCTICO Y DESCRIPCIÓN DEL PROYECTO TECNOLÓGICO');
  printParagraph('1. Naturaleza del Desarrollo Tecnológico: Hemos desarrollado la plataforma tecnológica denominada "EL GANADOR" (en entorno web y móvil), un ecosistema de software como servicio (SaaS) concebido expresamente para combatir la informalidad, la evasión tributaria y la falta de transparencia en la comercialización de rifas y eventos promocionales en el territorio colombiano.');
  printParagraph('2. Liquidación Anticipada de Derechos de Explotación (Salud Pública): La plataforma cuenta con un motor algorítmico parametrizado que exige a cada comerciante o empresario participante la liquidación estricta del catorce por ciento (14%) sobre el valor nominal de la emisión de boletas con destino al Régimen Subsidiado de Salud (artículo 30 de la Ley 643 de 2001), así como la generación automática del Formulario Oficial No. 8 de Coljuegos y la custodia del comprobante bancario de consignación a favor de la entidad o ente territorial correspondiente.');
  printParagraph('3. Trazabilidad Matemática y Criptográfica (SHA-256): Con el fin de erradicar la manipulación de baloteras mecánicas o talonarios manuales, la plataforma implementa una infraestructura basada en la Ley 527 de 1999 (Comercio Electrónico y Mensajes de Datos). Cada boleta adquirida por el usuario genera un hash criptográfico único bajo estándar SHA-256, inmutable, verificable públicamente en tiempo real e interoperable con pasarelas de pago vigiladas por la Superintendencia Financiera de Colombia (Wompi Bancolombia / PSE).');
  printParagraph('4. Validación Mercantil y Prevención del Fraude (KYB / KYC): Para que un comerciante o persona jurídica pueda comercializar un sorteo a través del software, debe superar un proceso de validación mercantil y conocimiento del cliente (Know Your Business - KYB), aportando RUT actualizado con actividad económica autorizada, Certificado de Existencia y Representación Legal de la Cámara de Comercio, documento del representante legal, factura o prueba de propiedad del premio, y póliza de cumplimiento que garantiza la entrega efectiva del premio al ganador.');
  printParagraph('5. Rol de la Plataforma frente a los Sorteos: La plataforma tecnológica no actúa como casa de apuestas clandestina ni pretende sustituir la potestad autorizatoria del Estado, sino que opera como un Mandatario Tecnológico y Facilitador Operativo Digital que brinda a los empresarios la infraestructura de software necesaria para formalizar sus sorteos ante Coljuegos (en el caso de rifas o promocionales de carácter nacional) o ante las secretarías de gobierno / loterías departamentales (en el ámbito local).');

  // SECCIÓN III
  printHeading('III. MARCO NORMATIVO APLICABLE');
  printParagraph('• Constitución Política de Colombia, artículo 336: Monopolio rentístico de juegos de suerte y azar destinado exclusivamente a los servicios de salud.');
  printParagraph('• Ley 643 de 2001, régimen propio del monopolio rentístico de juegos de suerte y azar: Rifas (Capítulo V, Artículos 27 a 30), Juegos promocionales (Capítulo VI, Artículos 31 a 34) y derechos de explotación del 14% para la salud.');
  printParagraph('• Decreto Único Reglamentario 1068 de 2015, Sector Hacienda y Crédito Público.');
  printParagraph('• Ley 527 de 1999, reglamentaria del comercio electrónico, validez probatoria de mensajes de datos y equivalencia funcional.');
  printParagraph('• Ley 1437 de 2011 (CPACA), artículo 14, sobre peticiones en modalidad de consulta.');

  // SECCIÓN IV
  printHeading('IV. CONSULTAS PUNTUALES SOMETIDAS A CRITERIO DE COLJUEGOS');
  printParagraph('1. Modalidad Jurídica de la Plataforma Tecnológica: ¿Existe algún impedimento jurídico o regulatorio para que una plataforma tecnológica digitalice la comercialización, emisión de boletas electrónicas mediante mensajes de datos (Ley 527 de 1999) y automatice la liquidación del 14% de derechos de explotación para la salud, actuando como mandatario tecnológico de comerciantes y personas jurídicas debidamente formalizadas?');
  printParagraph('2. Tramitación y Radicación de Solicitudes (Ventanilla Única / Formulario 8): Bajo el esquema donde cada empresario es el titular del sorteo y "El Ganador" es el operador de software, ¿es procedente que la plataforma radique de manera unificada o asistida los Formulario 8 y los soportes de pago del 14% en representación de sus comerciantes afiliados ante la Ventanilla Única de Coljuegos?');
  printParagraph('3. Homologación Técnica de Software Generador de Números Aleatorios (RNG): Teniendo en cuenta que la plataforma utiliza algoritmos de selección determinística con firma criptográfica SHA-256 para la selección pública del número ganador en transmisiones en vivo: ¿Cuáles son los estándares o laboratorios acreditados (ej. BMM Testlabs, Gaming Laboratories International - GLI u homólogos) exigidos por Coljuegos para la certificación técnica de dicho software en la modalidad de juegos promocionales o rifas?');
  printParagraph('4. Interoperabilidad y Reporte al Sistema Único de Inspección (SUI): ¿Dispone Coljuegos de protocolos técnicos de API o servicios web para que plataformas tecnológicas como la nuestra reporten en tiempo real los ingresos brutos, boletas colocadas y liquidación tributaria para auditoría permanente del Estado?');
  printParagraph('5. Mesa Técnica de Trabajo: Solicitamos respetuosamente se nos conceda una audiencia informativa o mesa técnica de trabajo virtual o presencial con los delegados de la Gerencia de Nuevos Negocios y/o Gerencia de Vigilancia, a efectos de presentar la demostración en vivo de la plataforma, su arquitectura de seguridad y su capacidad para elevar el recaudo tributario hacia el sistema de salud colombiano.');

  // SECCIÓN V
  printHeading('V. ANEXOS');
  printParagraph('1. Copia de la Cédula de Ciudadanía del peticionario (C.C. No. 1.001.854.729).\n(Nota: La documentación de arquitectura de software, demostración de trazabilidad SHA-256 y muestra del Formulario Oficial No. 8 generado por el sistema se pondrán a disposición y se expondrán directamente en la Mesa Técnica de Trabajo solicitada en el numeral 5).');

  // SECCIÓN VI
  printHeading('VI. NOTIFICACIONES');
  printParagraph('Agradecemos enviar respuesta formal y citación a la mesa técnica a los siguientes canales oficiales:');
  printParagraph('• Correo Electrónico: camilnikos2918@gmail.com', fontBold, 9.5, rgb(0, 0.22, 0.44));
  printParagraph('• Teléfono Celular de Contacto: (+57) 304 665 2316', fontRegular, 9.5);
  printParagraph('• Ciudad de Correspondencia: Bogotá D.C. / Colombia', fontRegular, 9.5);

  // ÁREA DE FIRMA
  y -= 15;
  checkPageBreak(80);
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: MARGIN_LEFT + 240, y },
    thickness: 1.5,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 14;
  page.drawText('CAMILO ANDRÉS ANAYA JORDÁN', {
    x: MARGIN_LEFT,
    y,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0.22, 0.44),
  });
  y -= 12;
  page.drawText('C.C. No. 1.001.854.729', {
    x: MARGIN_LEFT,
    y,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 12;
  page.drawText('Fundador y Desarrollador Principal', {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 12;
  page.drawText('Proyecto Tecnológico "El Ganador"', {
    x: MARGIN_LEFT,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 10;
  page.drawText('Copia: Archivo Jurídico del Proyecto.', {
    x: MARGIN_LEFT,
    y,
    size: 8,
    font: fontItalic,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Numeración de páginas al pie
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdfDoc.getPage(i);
    p.drawText(`Página ${i + 1} de ${totalPages}`, {
      x: PAGE_WIDTH - MARGIN_RIGHT - 65,
      y: 25,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();

  const outPath1 = path.join(__dirname, 'Consulta_Tecnica_Coljuegos_ElGanador_CamiloAnaya.pdf');
  const outPath2 = 'C:/Users/camil/.gemini/antigravity/brain/f39f0c7f-7acb-4549-ae64-a84d32990452/Consulta_Tecnica_Coljuegos_ElGanador_CamiloAnaya.pdf';

  fs.writeFileSync(outPath1, pdfBytes);
  fs.writeFileSync(outPath2, pdfBytes);

  console.log('PDF generado con éxito en:');
  console.log('1.', outPath1);
  console.log('2.', outPath2);
  console.log('Total páginas:', totalPages);
  console.log('Tamaño bytes:', pdfBytes.length);
}

createLegalPdf().catch(err => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
