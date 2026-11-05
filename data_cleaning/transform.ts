/**
 * transform.ts
 *
 * Transformación de la hoja "Promedio" del archivo real
 * de calidad Cerro Jardín a formato largo (tidy)
 * para consumo del dashboard.
 *
 * Busca automáticamente el archivo Excel más reciente en:
 * 1. Variable de entorno CARPETA_EXCEL (si existe)
 * 2. Carpeta de OneDrive del usuario actual
 * 3. Carpeta local data_cleaning/
 *
 * Si no encuentra un nuevo Excel pero ya existe reporte.json,
 * conserva los datos existentes sin interrumpir la ejecución.
 *
 * Dependencias: npm i xlsx | npm i -D typescript tsx @types/node
 * Ejecutar:     npx tsx data_cleaning/transform.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const BASE_DIR = path.dirname(fileURLToPath(import.meta.url));

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
// Utilidades
// ============================================================

const NA_STRINGS = new Set([
  "", "#N/A", "N/A", "NA", "NULL", "NaN", "n/a", "nan", "null", "<NA>", "-nan", "-NaN",
]);

function esVacio(c: Cell): boolean {
  return c === null || c === undefined || (typeof c === "string" && NA_STRINGS.has(c.trim()));
}

/** Rellena celdas combinadas en las filas de encabezado */
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
  if (!ws) throw new Error(`Hoja "${sheetName}" no encontrada en ${filePath}`);

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

  // Columnas como tuplas (material, grupo, propiedad)
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
// Búsqueda de archivos Excel
// ============================================================

function obtenerArchivosExcel(carpetasCandidatas: string[]): string[] {
  const archivosEncontrados: { ruta: string; mtime: number }[] = [];
  const nombresVistos = new Set<string>();

  for (const carpeta of carpetasCandidatas) {
    if (!carpeta || !fs.existsSync(carpeta)) continue;

    try {
      const archivos = fs
        .readdirSync(carpeta)
        .filter((f) => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"));

      for (const f of archivos) {
        // Normalizar nombre unicode para evitar duplicados en nombres con tildes NFD/NFC
        const normName = f.normalize("NFC").toLowerCase();
        if (nombresVistos.has(normName)) continue;
        nombresVistos.add(normName);

        const rutaCompleta = path.join(carpeta, f);
        archivosEncontrados.push({
          ruta: rutaCompleta,
          mtime: fs.statSync(rutaCompleta).mtimeMs,
        });
      }
    } catch {
      // Ignora errores de permiso o bloqueo y prueba la siguiente carpeta
    }
  }

  // Ordenar de más antiguo a más reciente para que los datos nuevos sobrescriban a los viejos si hay conflicto
  return archivosEncontrados.sort((a, b) => a.mtime - b.mtime).map((a) => a.ruta);
}

// ============================================================
// Generación y Fusión Incremental del JSON
// ============================================================

interface RegistroJSON {
  Fecha: number;
  Material: string;
  Grupo: string;
  Propiedad: string;
  Valor: number | string;
}

interface MetadatosProceso {
  archivosProcesados: Record<string, number>; // nombre_archivo -> mtimeMs
}

function generarHistorico(rutasExcel: string[]): void {
  const jsonPath = path.join(BASE_DIR, "..", "public", "data", "reporte.json");
  const metaPath = path.join(BASE_DIR, "..", "public", "data", ".metadata_excel.json");
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });

  // 1. Cargar metadatos previos de archivos procesados
  let metadata: MetadatosProceso = { archivosProcesados: {} };
  if (fs.existsSync(metaPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {
      metadata = { archivosProcesados: {} };
    }
  }

  // 2. Determinar cuáles archivos son realmente nuevos o fueron modificados
  const archivosPorProcesar = rutasExcel.filter((filePath) => {
    const nombre = path.basename(filePath).normalize("NFC");
    try {
      const mtimeActual = fs.statSync(filePath).mtimeMs;
      const mtimePrevio = metadata.archivosProcesados[nombre];
      return mtimePrevio === undefined || mtimeActual > mtimePrevio;
    } catch {
      return true;
    }
  });

  // Si ya existe reporte.json y no hay archivos nuevos/modificados, terminamos inmediatamente sin costo de CPU
  if (archivosPorProcesar.length === 0 && fs.existsSync(jsonPath)) {
    console.log("[Datos] ⚡ Sin cambios: Todos los archivos Excel ya están en el histórico.");
    return;
  }

  console.log(`[Datos] 📂 Archivos nuevos o modificados a procesar: ${archivosPorProcesar.length}`);

  // 3. Cargar histórico existente si existe
  const registrosMap = new Map<string, RegistroJSON>();
  if (fs.existsSync(jsonPath)) {
    try {
      const previo: RegistroJSON[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      for (const reg of previo) {
        // Clave única: Fecha_Material_Grupo_Propiedad
        const key = `${reg.Fecha}|${reg.Material}|${reg.Grupo}|${reg.Propiedad}`;
        registrosMap.set(key, reg);
      }
      console.log(`[Datos] ℹ️ Histórico previo cargado: ${registrosMap.size} registros únicos.`);
    } catch {
      console.warn("[Datos] ⚠️ No se pudo leer el histórico previo; se generará desde cero.");
    }
  }

  // 4. Procesar ÚNICAMENTE los archivos nuevos/modificados e integrar
  let totalFilasProcesadas = 0;
  for (const filePath of archivosPorProcesar) {
    const nombre = path.basename(filePath).normalize("NFC");
    console.log(`[Datos] Procesando Excel: ${nombre}`);
    try {
      const df = wideToLongPromedio(filePath);
      for (const r of df) {
        const ms = r.Fecha.getTime();
        const key = `${ms}|${r.Material}|${r.Grupo}|${r.Propiedad}`;
        registrosMap.set(key, {
          Fecha: ms,
          Material: r.Material,
          Grupo: r.Grupo,
          Propiedad: r.Propiedad,
          Valor: r.Valor,
        });
      }
      totalFilasProcesadas += df.length;
      // Actualizar mtime en metadatos para este archivo
      metadata.archivosProcesados[nombre] = fs.statSync(filePath).mtimeMs;
    } catch (err) {
      console.error(`[Datos] ❌ Error procesando ${nombre}:`, err);
    }
  }

  // 5. Ordenar cronológicamente (Fecha ascendente)
  const consolidado = Array.from(registrosMap.values()).sort((a, b) => a.Fecha - b.Fecha);

  // 6. Guardar archivo consolidado y metadatos
  fs.writeFileSync(jsonPath, JSON.stringify(consolidado, null, 4), "utf-8");
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 4), "utf-8");

  console.log(`[Datos] ✅ reporte.json consolidado exitosamente en: ${jsonPath}`);
  console.log(`[Datos] Filas añadidas/actualizadas en esta corrida: ${totalFilasProcesadas}`);
  console.log(`[Datos] Total registros consolidados en histórico: ${consolidado.length}`);
  const materiales = [...new Set(consolidado.map((r) => r.Material))].sort();
  console.log("[Datos] Materiales:", materiales.join(", "));
  if (consolidado.length > 0) {
    const dIni = new Date(consolidado[0].Fecha).toISOString().slice(0, 10);
    const dFin = new Date(consolidado[consolidado.length - 1].Fecha).toISOString().slice(0, 10);
    console.log(`[Datos] Cobertura de fechas en histórico: ${dIni} hasta ${dFin}`);
  }
}

// ============================================================
// Ejecución Principal
// ============================================================

export function ejecutarActualizacion(): void {
  const jsonPath = path.join(BASE_DIR, "..", "public", "data", "reporte.json");

  // Carpetas candidatas donde buscar el Excel (orden de prioridad)
  const userProfile = process.env.USERPROFILE || process.env.HOME || "";
  const carpetasCandidatas = [
    process.env.CARPETA_EXCEL || "",
    path.join(userProfile, "OneDrive - CEMEX", "Calidad Agregados Cerro Jardín - 2026 CEJ"),
    BASE_DIR, // carpeta data_cleaning/ local del proyecto
  ].filter(Boolean);

  const archivosExcel = obtenerArchivosExcel(carpetasCandidatas);

  if (archivosExcel.length > 0) {
    generarHistorico(archivosExcel);
  } else {
    if (fs.existsSync(jsonPath)) {
      console.warn(
        "\n[Datos] ⚠️ No se encontró ningún archivo .xlsx en las rutas candidatas."
      );
      console.warn("[Datos] ℹ️ Se conservará el reporte.json existente.");
    } else {
      console.error(
        "\n[Datos] ❌ No se encontró ningún archivo .xlsx ni existe un reporte.json previo."
      );
      process.exit(1);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    ejecutarActualizacion();
  } catch (e) {
    console.error("[Datos] ❌ Error en la transformación:", e);
    // Si ya existe reporte.json, no rompemos el build para permitir seguir operando
    const jsonPath = path.join(BASE_DIR, "..", "public", "data", "reporte.json");
    if (!fs.existsSync(jsonPath)) {
      process.exit(1);
    }
  }
}
