import { colombianDepartments, describeRaffleTerritory, raffleTerritoryLegalReference, type RaffleTerritoryScope } from "../../lib/raffle-territory";
import RaffleOrganizerGuide from "./RaffleOrganizerGuide";

type Selection = {
  territoryScope: RaffleTerritoryScope;
  territoryDepartment: string;
  territoryMunicipality: string;
  territoryMunicipalities: string;
  territoryDepartments: string;
};

export function RaffleTerritoryFields({ value, onChange }: {
  value: Selection;
  onChange: (patch: Partial<Selection>) => void;
}) {
  const display = describeRaffleTerritory({
    territory_scope: value.territoryScope,
    territory_department: value.territoryDepartment,
    territory_municipality: value.territoryMunicipality,
    territory_municipalities: value.territoryMunicipalities,
    territory_departments: value.territoryDepartments,
  });

  return (
    <section className="territoryEditor" aria-labelledby="territoryEditorTitle">
      <div className="territoryEditorHeading">
        <strong id="territoryEditorTitle">Alcance territorial de la rifa</strong>
        <p>Declara dónde se ofrecerá y venderá esta rifa. Esta información será visible para los clientes.</p>
      </div>
      <div className="territoryFieldGrid">
        <label className="territoryField territoryScopeField">Cobertura<select required value={value.territoryScope} onChange={(event) => onChange({ territoryScope: event.target.value as RaffleTerritoryScope })}>
          <option value="municipal">Municipal o distrital · una jurisdicción</option>
          <option value="departmental">Departamental · varios municipios / municipio y Bogotá</option>
          <option value="national">Nacional · dos o más departamentos / departamento y Bogotá</option>
        </select></label>
        {value.territoryScope === "municipal" && <>
          <label className="territoryField">Departamento o Distrito<select required value={value.territoryDepartment} onChange={(event) => onChange({ territoryDepartment: event.target.value })}>
            <option value="">Selecciona una jurisdicción</option>
            {colombianDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select></label>
          <label className="territoryField">Municipio o distrito<input required minLength={2} maxLength={100} value={value.territoryMunicipality} onChange={(event) => onChange({ territoryMunicipality: event.target.value })} placeholder="Ej. Medellín" /></label>
        </>}
        {value.territoryScope === "departmental" && <>
          <label className="territoryField">Departamento de referencia<select required value={value.territoryDepartment} onChange={(event) => onChange({ territoryDepartment: event.target.value })}>
            <option value="">Selecciona un departamento</option>
            {colombianDepartments.filter((department) => department !== "Bogotá D.C.").map((department) => <option key={department} value={department}>{department}</option>)}
          </select></label>
          <label className="territoryField">Municipios incluidos<input required minLength={2} maxLength={1000} value={value.territoryMunicipalities} onChange={(event) => onChange({ territoryMunicipalities: event.target.value })} placeholder="Ej. Medellín, Envigado, Itagüí" /><small>Sepáralos con comas. Escribe Bogotá D.C. si también está incluida.</small></label>
        </>}
        {value.territoryScope === "national" && <label className="territoryField territoryScopeField">Departamentos o distritos incluidos<input required minLength={2} maxLength={1000} value={value.territoryDepartments} onChange={(event) => onChange({ territoryDepartments: event.target.value })} placeholder="Ej. Antioquia; Cundinamarca; Bogotá D.C." /><small>Separa los nombres con punto y coma. Debe incluir dos o más departamentos, o un departamento y Bogotá D.C. Para todo el país escribe “Todo Colombia”.</small></label>}
      </div>
      <div className="territoryAuthority" aria-live="polite">
        <span>Autoridad según el alcance</span>
        <strong>{display.authority}</strong>
        <p>{display.explanation}</p>
      </div>
      <p className="territoryLegalReference">{raffleTerritoryLegalReference}</p>
      <p className="territoryPrivacyNote">La cobertura indica el alcance previsto. El Ganador no solicita GPS ni ciudad al comprador; las ventas reales se habilitarán cuando se completen las aprobaciones y verificaciones requeridas.</p>
      <RaffleOrganizerGuide />
    </section>
  );
}
