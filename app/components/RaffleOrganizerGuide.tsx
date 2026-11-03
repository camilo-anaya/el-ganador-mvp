export default function RaffleOrganizerGuide({ openByDefault = false }: { openByDefault?: boolean }) {
  return (
    <details className={`raffleOrganizerGuide${openByDefault ? " isInlineNotice" : ""}`} open={openByDefault}>
      <summary>Guía breve para organizar una rifa real</summary>
      <div className="raffleOrganizerGuideBody">
        <p className="raffleGuideIntro">Úsala como lista de orientación. Los requisitos concretos los confirma el operador autorizado y la autoridad que corresponda a la cobertura.</p>
        <ol>
          <li><strong>Define dónde ofrecerás y venderás.</strong> La cobertura municipal, departamental o nacional determina la autoridad competente. En esta plataforma solo registras la cobertura declarada.</li>
          <li><strong>Contacta a un operador autorizado.</strong> Debe ser una persona jurídica autorizada para operar rifas. El gestor presenta ante el operador la solicitud de cada rifa y sus documentos; la norma prevé radicarla al menos 30 días calendario antes de la fecha del sorteo.</li>
          <li><strong>Prepara la información y los soportes.</strong> Incluye tus datos, descripción y valor del premio, cantidad y precio de las boletas, fecha y método del sorteo. El operador o la autoridad indicará los soportes requeridos, que pueden incluir prueba de propiedad, avalúo o factura, garantía y texto de boletas y publicidad.</li>
          <li><strong>Espera la validación, registro y aprobación.</strong> No ofrezcas ni vendas boletas antes de completar los trámites aplicables. Una vez aprobada, usa el sistema y el método de sorteo registrados con el operador.</li>
          <li><strong>Realiza el sorteo y entrega el premio.</strong> Cumple la fecha autorizada. Si necesitas aplazarlo, consulta primero cómo obtener la autorización del cambio y cómo avisar a los participantes.</li>
          <li><strong>Presenta el soporte de entrega.</strong> La norma contempla una declaración jurada ante notario del ganador, presentada por el gestor a través del operador dentro de los cinco días hábiles siguientes a la entrega del premio.</li>
        </ol>
        <p className="raffleGuideLimit"><strong>Ten presente:</strong> la normativa prohíbe las rifas permanentes y limita a dos las fechas de rifa por mes para cada gestor. Los cupos de un plan no cambian ese límite.</p>
        <p className="raffleGuideDemo">El Ganador opera dentro del marco legal colombiano. Cada rifa requiere los registros y autorizaciones correspondientes a su cobertura y debe realizarse mediante el operador autorizado. La demo de balotas y ruleta es ilustrativa; no determina ganadores de rifas reales.</p>
        <p className="raffleGuideLinks">Fuentes oficiales: <a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=256696" target="_blank" rel="noreferrer">Decreto 1486 de 2024 ↗</a> · <a href="https://www.coljuegos.gov.co/publicaciones/300612/guia_de_tramites/index.php" target="_blank" rel="noreferrer">Guía de trámites de Coljuegos ↗</a></p>
      </div>
    </details>
  );
}
