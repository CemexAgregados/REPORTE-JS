/**
 * transform_promedio.ts
 *
 * Transformación de la hoja "Promedio" del archivo real
 * de calidad Cerro Jardín a formato largo (tidy)
 * para consumo del dashboard.
 *
 * Toma el Excel más reciente de la carpeta de OneDrive, genera
 * public/data/reporte.json y termina.
 *
 * Dependencias: npm i xlsx   |   npm i -D typescript tsx @types/node
 * Ejecutar:     npx tsx scripts/transform_promedio.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const BASE_DIR = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Configuración
// ============================================================

const CARPETA_ONEDRIVE =
  "C:\\Users\\E-RQMORALES\\OneDrive - CEMEX\\Calidad Agregados Cerro Jardín - 2026 CEJ";

// ============================================================
// Tipos
// ============================================================

type Cell = string | number | boolean | null | undefined;

export interface FilaLarga {
  Fecha: Date;
  Material: string;
  Grupo: string;
  Propiedad: string;
  Valor: number | string;
}

export interface ResumenFila {
  Grupo: string;
  Propiedad: string;
  promedio: number; // NaN si no hay valores numéricos
  dias_con_dato: number;
}

// ============================================================
// Normalización
// ============================================================

export function limpiarMaterial(material: unknown): string {
  return String(material).trim();
}

export function limpiarGrupo(grupo: unknown): string {
  return String(grupo).trim();
}

export function limpiarPropiedad(propRaw: unknown, grupo: string): string {
  let prop = String(propRaw).trim();

  // Normalizar tamices
  prop = prop.split("⅜").join("3/8");
  prop = prop.split("¾").join("3/4");
  prop = prop.split("1½").join("1 1/2");
  prop = prop.split('"').join("");

  // Quitar únicamente sufijos .1
  prop = prop.replace(/\.1$/, "");

  // Columnas simples (%PXL, M.F., etc.)
  if (prop.includes("Unnamed")) {
    return grupo;
  }

  return prop.trim();
}

// ============================================================
// Utilidades (equivalentes a lo que hace pandas internamente)
// ============================================================

const NA_STRINGS = new Set([
  "", "#N/A", "N/A", "NA", "NULL", "NaN", "n/a", "nan", "null", "<NA>", "-nan", "-NaN",
]);

function esVacio(c: Cell): boolean {
  return c === null || c === undefined || (typeof c === "string" && NA_STRINGS.has(c.trim()));
}

/** Rellena celdas combinadas en las filas de encabezado (como pandas.read_excel con header=[...]). */
function fillMiHeader(row: Cell[], controlRow: boolean[]): void {
  let last: Cell = row[0];
  for (let i = 1; i < row.length; i++) {
    if (!controlRow[i]) last = row[i];
    if (row[i] === "" || row[i] === null || row[i] === undefined) {
      row[i] = last;
    } else {
      controlRow[i] = false;
      last = row[i];
    }
  }
}

function aFecha(v: Cell): Date | null {
  if (esVacio(v)) return null;
  let ms: number;
  if (typeof v === "number") {
    ms = Math.round((v - 25569) * 86400000); // serial de Excel -> epoch ms (UTC)
  } else {
    ms = Date.parse(String(v));
  }
  return Number.isNaN(ms) ? null : new Date(ms);
}

function aNumero(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

// ============================================================
// Transformación principal
// ============================================================

export function wideToLongPromedio(
  filePath: string,
  sheetName: string = "Promedio"
): FilaLarga[] {
  // Se lee como buffer para evitar bloqueos si el archivo está abierto en Excel
  const wb = XLSX.read(fs.readFileSync(filePath), { type: "buffer" });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Hoja "${sheetName}" no encontrada`);

  const ref = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const data = XLSX.utils.sheet_to_json<Cell[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
    range: { s: { r: 0, c: 0 }, e: ref.e },
  });

  // header=[3, 4, 5]
  const headerIdx = [3, 4, 5];
  const header: Cell[][] = headerIdx.map((i) => [...(data[i] ?? [])]);
  const ncols = Math.max(...header.map((h) => h.length));
  const controlRow: boolean[] = new Array(ncols).fill(true);
  for (const h of header) {
    while (h.length < ncols) h.push(null);
    fillMiHeader(h, controlRow);
  }

  // Columnas como tuplas (material, grupo, propiedad); vacíos -> "Unnamed: i_level_n"
  const columns: [string, string, string][] = [];
  for (let c = 0; c < ncols; c++) {
    const t = header.map((h, lvl) => {
      const v = h[c];
      return v === null || v === undefined || v === ""
        ? `Unnamed: ${c}_level_${lvl}`
        : String(v);
    });
    columns.push([t[0], t[1], t[2]]);
  }

  const filas: FilaLarga[] = [];

  for (const row of data.slice(6)) {
    const fecha = aFecha(row[1]);
    if (fecha === null) continue;

    for (let c = 2; c < ncols; c++) {
      const col = columns[c];

      const material = limpiarMaterial(col[0]);
      const grupo = limpiarGrupo(col[1]);
      const propiedad = limpiarPropiedad(col[2], grupo);

      const valor = row[c];
      if (esVacio(valor)) continue;

      filas.push({
        Fecha: fecha,
        Material: material,
        Grupo: grupo,
        Propiedad: propiedad,
        Valor: valor as number | string,
      });
    }
  }

  return filas;
}

// ============================================================
// Resumen para dashboard
// ============================================================

export function reporteMaterial(
  dfLong: FilaLarga[],
  material: string,
  start: string,
  end: string
): ResumenFila[] {
  const ini = new Date(start).getTime();
  const fin = new Date(end).getTime();

  const grupos = new Map<
    string,
    { Grupo: string; Propiedad: string; suma: number; n: number; fechas: Set<number> }
  >();

  for (const r of dfLong) {
    const t = r.Fecha.getTime();
    if (r.Material !== material || t < ini || t > fin) continue;

    const key = `${r.Grupo}\u0000${r.Propiedad}`;
    let g = grupos.get(key);
    if (!g) {
      g = { Grupo: r.Grupo, Propiedad: r.Propiedad, suma: 0, n: 0, fechas: new Set() };
      grupos.set(key, g);
    }
    g.fechas.add(t);

    const v = aNumero(r.Valor);
    if (!Number.isNaN(v)) {
      g.suma += v;
      g.n += 1;
    }
  }

  return [...grupos.values()]
    .sort((a, b) =>
      a.Grupo < b.Grupo ? -1 : a.Grupo > b.Grupo ? 1 :
      a.Propiedad < b.Propiedad ? -1 : a.Propiedad > b.Propiedad ? 1 : 0
    )
    .map((g) => ({
      Grupo: g.Grupo,
      Propiedad: g.Propiedad,
      promedio: g.n > 0 ? g.suma / g.n : NaN,
      dias_con_dato: g.fechas.size,
    }));
}

// ============================================================
// Excel más reciente de la carpeta
// ============================================================

function excelMasReciente(carpeta: string): string {
  const archivos = fs
    .readdirSync(carpeta)
    .filter((f) => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"))
    .map((f) => ({ f, t: fs.statSync(path.join(carpeta, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);

  if (archivos.length === 0) throw new Error(`No hay .xlsx en ${carpeta}`);
  return path.join(carpeta, archivos[0].f);
}

// ============================================================
// Generación del JSON
// ============================================================

function generar(filePath: string): void {
  console.log(`\nLeyendo: ${filePath}`);

  const df = wideToLongPromedio(filePath);

  // Exportar JSON para React
  const jsonPath = path.join(BASE_DIR, "..", "public", "data", "reporte.json");
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });

  // pandas.to_json serializa las fechas como epoch en milisegundos
  const registros = df.map((r) => ({ ...r, Fecha: r.Fecha.getTime() }));
  fs.writeFileSync(jsonPath, JSON.stringify(registros, null, 4), "utf-8");

  console.log(`JSON generado: ${jsonPath}`);
  console.log(`Filas: ${df.length}`);
  console.log("Materiales:", [...new Set(df.map((r) => r.Material))].sort());
  console.log("Grupos:", [...new Set(df.map((r) => r.Grupo))].sort());
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    generar(excelMasReciente(CARPETA_ONEDRIVE));
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}