import RaffleOrganizerGuide from "./RaffleOrganizerGuide";

export default function RaffleTerritoryNotice() {
  return (
    <aside className="territoryPlansNotice" aria-labelledby="territoryPlansHeading">
      <p className="portalEyebrow">REGLAS PARA VENDEDORES DE RIFAS EN COLOMBIA</p>
      <h3 id="territoryPlansHeading">La cobertura determina ante qué autoridad debes tramitar la autorización</h3>
      <p>Este marco aplica en todo Colombia. La autoridad depende del alcance territorial declarado para cada rifa:</p>
      <div className="territoryRulesGrid">
        <p><strong>Municipal o distrital.</strong> Una sola jurisdicción local en cualquier municipio o distrito del país. En Bogotá D.C. la autoridad delegada es la Lotería de Bogotá; en el resto, consulta la autoridad local competente.</p>
        <p><strong>Departamental.</strong> Varios municipios del mismo departamento, o un municipio junto con Bogotá D.C. La competencia corresponde al departamento por medio de la SCPD.</p>
        <p><strong>Nacional.</strong> Dos o más departamentos, o un departamento junto con Bogotá D.C. La competencia corresponde a Coljuegos.</p>
      </div>
      <section className="territoryNoticeSection" aria-label="Requisitos para publicar una rifa real">
        <h4>Preparación para operar de forma regulada</h4>
        <p>El Ganador opera dentro del marco legal colombiano. Cada rifa real debe contar con el registro y la autorización aplicables a su cobertura y operar mediante el operador autorizado correspondiente. La cobertura elegida indica el alcance previsto y no reemplaza los trámites de esa rifa.</p>
      </section>
      <section className="territoryNoticeSection" aria-label="Información sobre la ubicación de compradores">
        <h4>Sobre la ubicación de los compradores</h4>
        <p>El Ganador no solicita la ciudad ni el GPS del comprador y no bloquea compras según su ubicación. La cobertura que mostramos es la declarada por el negocio; no comprobamos dónde están sus compradores. El organizador debe mantener la oferta y las ventas dentro del alcance autorizado y consultar con su operador o autoridad competente si tiene dudas.</p>
      </section>
      <RaffleOrganizerGuide openByDefault />
      <small>Referencias: Ley 643 de 2001; Decreto 1068 de 2015, artículos 2.7.3.3–2.7.3.6, modificado por el Decreto 1486 de 2024. PSE para pagar planes aún no está conectado.</small>
    </aside>
  );
}
