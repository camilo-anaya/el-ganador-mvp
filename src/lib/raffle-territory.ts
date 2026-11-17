export const raffleTerritoryScopes = ["municipal", "departmental", "national"] as const;

export type RaffleTerritoryScope = (typeof raffleTerritoryScopes)[number];
export type StoredRaffleTerritoryScope = RaffleTerritoryScope | "unspecified";

export const colombianDepartments = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas",
  "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía",
  "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander",
  "Putumayo", "Quindío", "Risaralda", "San Andrés, Providencia y Santa Catalina", "Santander",
  "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
] as const;

export type RaffleTerritory = {
  territory_scope: StoredRaffleTerritoryScope;
  territory_department: string;
  territory_municipality: string;
  territory_municipalities: string;
  territory_departments: string;
};

export function describeRaffleTerritory(territory?: Partial<RaffleTerritory>) {
  const scope = territory?.territory_scope ?? "unspecified";
  const department = territory?.territory_department?.trim() ?? "";
  const municipality = territory?.territory_municipality?.trim() ?? "";
  const municipalities = territory?.territory_municipalities?.trim() ?? "";
  const departments = territory?.territory_departments?.trim() ?? "";

  if (scope === "municipal") {
    const place = [municipality || "Municipio por definir", department || "Departamento/Distrito por definir"].join(", ");
    return {
      label: `Municipal/distrital · ${place}`,
      authority: department === "Bogotá D.C." ? "Lotería de Bogotá / autoridad competente" : "Autoridad municipal o distrital competente",
      explanation: "Una sola jurisdicción municipal o distrital. En Bogotá D.C., la autorización y vigilancia corresponden a la Lotería de Bogotá según la delegación vigente.",
    };
  }

  if (scope === "departmental") {
    const area = [municipalities || "Municipios por definir", department || "Departamento por definir"].join(" · ");
    return {
      label: `Departamental · ${area}`,
      authority: "Departamento, por medio de la SCPD competente",
      explanation: "Aplica cuando la rifa cubre varios municipios de un mismo departamento o un municipio y Bogotá D.C. Si la operación cubre un departamento junto con Bogotá, corresponde a Coljuegos.",
    };
  }

  if (scope === "national") {
    const coverage = /^(?:todo|toda) colombia$/i.test(departments) ? "toda Colombia" : departments || "Departamentos por definir";
    return {
      label: `Nacional · ${coverage}`,
      authority: "Coljuegos",
      explanation: "Corresponde cuando la rifa opera en dos o más departamentos, o en un departamento y Bogotá D.C.",
    };
  }

  return {
    label: "Cobertura pendiente de declarar",
    authority: "Pendiente de confirmar",
    explanation: "El organizador aún no ha especificado el alcance territorial de esta rifa.",
  };
}

export const raffleTerritoryLegalReference = "Referencia territorial: Decreto 1068 de 2015, artículo 2.7.3.3, modificado por el Decreto 1486 de 2024. La cobertura declarada no es una autorización ni valida automáticamente los permisos de la rifa.";
