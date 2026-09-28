export const NOMBRES_REPORTE: Record<string, string> = {
  "%H": "Contenido de Agua (%Humedad)",
  "%PXL": "Contenido de Finos",
  "M.F.": "Módulo de Finura",
  "Densidad": "Densidad Relativa",
  "Absorción": "Absorción",
  "Coef. De Forma": "Coeficiente de Forma",
  "Equivalente Arena": "Equivalente de Arena",
  "Suelto": "Masa Volumétrica Suelta",
  "Compacto": "Masa Volumétrica Compactada",
};

const ARENA_SPECS = {
  "M.F.": {
    metodo: "NMX-C-111",
    min: 2.3,
    max: 3.1,
    unidad: "%",
  },

  "%H": {
    metodo: "NMX-C-166",
    min: "---",
    max: "---",
    unidad: "%",
  },

  "Suelto": {
    metodo: "NMX-C-073",
    min: "---",
    max: "---",
    unidad: "kg/m3",
  },

  "Compacto": {
    metodo: "NMX-C-073",
    min: "---",
    max: "---",
    unidad: "kg/m3",
  },

  "Densidad": {
    metodo: "NMX-C-165",
    min: "---",
    max: "---",
    unidad: "---",
  },

  "Absorción": {
    metodo: "NMX-C-165",
    min: "---",
    max: "---",
    unidad: "%",
  },

  "%PXL": {
    metodo: "NMX-C-084",
    min: "---",
    max: 15,
    unidad: "%",
  },
};

const GRAVA_SPECS = {
  "%H": {
    metodo: "NMX-C-166",
    min: "---",
    max: "---",
    unidad: "%",
  },

  "%PXL": {
    metodo: "NMX-C-084",
    min: "---",
    max: 2,
    unidad: "%",
  },

  "Suelto": {
    metodo: "NMX-C-073",
    min: "---",
    max: "---",
    unidad: "kg/m3",
  },

  "Compacto": {
    metodo: "NMX-C-073",
    min: "---",
    max: "---",
    unidad: "kg/m3",
  },

  "Densidad": {
    metodo: "NMX-C-164",
    min: "---",
    max: "---",
    unidad: "---",
  },

  "Absorción": {
    metodo: "NMX-C-164",
    min: "---",
    max: "---",
    unidad: "%",
  },

  "Coef. De Forma": {
    metodo: "ASTM D4791",
    min: "---",
    max: "---",
    unidad: "%",
  },
};

const MEZCLA_SPECS = {
  "Equivalente Arena": {
    metodo: "M-MMP-4-04-004-16",
    min: "---",
    max: "---",
    unidad: "%",
  },
};

export const ESPECIFICACIONES: Record<string, any> = {
  "Arena No. 4": ARENA_SPECS,

  "Grava 10 mm": GRAVA_SPECS,
  "Grava 20 mm": GRAVA_SPECS,
  "Grava 40 mm": GRAVA_SPECS,

  "Mezcla 60% finos + 40% gruesos": MEZCLA_SPECS,
  "Mezcla 80% finos + 20% gruesos": MEZCLA_SPECS,
};