import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import DatosGenerales from "./components/DatosGenerales";
import Especificaciones from "./components/Especificaciones";
import Granulometria from "./components/Granulometria";
import TablaGranulometrica from "./components/TablaGranulometrica";
import TendenciaDiaria from "./components/TendenciaDiaria";
import Firmas from "./components/Firmas";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const toISODate = (ms: number) => new Date(ms).toISOString().split("T")[0];

function App() {
  const [data, setData] = useState<any[]>([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [exportando, setExportando] = useState(false);
  const [propiedadesSeleccionadas, setPropiedadesSeleccionadas] = useState<string[]>([]);

  const exportarPDF = async () => {
    const pagina1 = document.getElementById("pdf-pagina-1");
    const pagina2 = document.getElementById("pdf-pagina-2");

    if (!pagina1 || !pagina2 || exportando) return;

    try {
      setExportando(true);

      const capturarPagina = async (elemento: HTMLElement) => {
        // Guardar estilos inline previos
        const prevWidth = elemento.style.width;
        const prevMaxWidth = elemento.style.maxWidth;
        const prevMinWidth = elemento.style.minWidth;
        const prevBoxShadow = elemento.style.boxShadow;
        const prevBorderRadius = elemento.style.borderRadius;
        const prevPadding = elemento.style.padding;

        // Fijar dimensiones óptimas de reporte y aplicar clase de exportación
        elemento.classList.add("exportando-pdf");
        elemento.style.width = "1000px";
        elemento.style.maxWidth = "1000px";
        elemento.style.minWidth = "1000px";
        elemento.style.boxShadow = "none";
        elemento.style.borderRadius = "0";
        elemento.style.padding = "6px 20px 20px 20px";

        // Retardo para sincronización de SVG de recharts y layout a 1000px
        await new Promise((resolve) => setTimeout(resolve, 250));

        const canvas = await html2canvas(elemento, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: 1000,
          windowWidth: 1000,
        });

        // Restaurar estado original
        elemento.classList.remove("exportando-pdf");
        elemento.style.width = prevWidth;
        elemento.style.maxWidth = prevMaxWidth;
        elemento.style.minWidth = prevMinWidth;
        elemento.style.boxShadow = prevBoxShadow;
        elemento.style.borderRadius = prevBorderRadius;
        elemento.style.padding = prevPadding;

        return canvas;
      };

      const canvas1 = await capturarPagina(pagina1);
      const canvas2 = await capturarPagina(pagina2);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      const agregarCanvasAlPDF = (canvas: HTMLCanvasElement, esPrimera: boolean) => {
        if (!esPrimera) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL("image/png");
        const marginX = 10;
        const marginY = 6; // Margen superior mínimo (6 mm) para iniciar el encabezado arriba
        const printableWidth = pageWidth - marginX * 2; // 190 mm
        const printableHeight = pageHeight - marginY - 10; // 281 mm (dejando margen inferior)

        // Proporción matemática exacta para evitar estiramientos laterales
        let imgWidth = printableWidth;
        let imgHeight = (canvas.height * printableWidth) / canvas.width;

        if (imgHeight > printableHeight) {
          imgHeight = printableHeight;
          imgWidth = (canvas.width * printableHeight) / canvas.height;
        }

        // Posición X centrada, posición Y pegada directamente al margen superior
        const posX = marginX + (printableWidth - imgWidth) / 2;
        const posY = marginY;

        pdf.addImage(imgData, "PNG", posX, posY, imgWidth, imgHeight, undefined, "FAST");
      };

      agregarCanvasAlPDF(canvas1, true);
      agregarCanvasAlPDF(canvas2, false);

      pdf.save(`Reporte_${materialSeleccionado}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    } finally {
      setExportando(false);
    }
  };

  useEffect(() => {
    fetch("/data/reporte.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((error) => console.error("Error cargando JSON:", error));
  }, []);

  const materiales: string[] = useMemo(
    () => [...new Set(data.map((row: any) => row.Material as string))].sort(),
    [data]
  );

  useEffect(() => {
    if (materiales.length > 0 && !materialSeleccionado) {
      setMaterialSeleccionado(materiales[0]);
    }
  }, [materiales, materialSeleccionado]);

  if (!data.length) {
    return (
      <div className="dashboard-container">
        <h2>Cargando...</h2>
      </div>
    );
  }

  const fechas = data
    .map((row: any) => row.Fecha as number)
    .filter((f) => f != null)
    .sort((a, b) => a - b);

  const fechaMin = fechas.length > 0 ? toISODate(fechas[0]) : "";
  const fechaMax = fechas.length > 0 ? toISODate(fechas[fechas.length - 1]) : "";

  const fechaInicioActual = fechaInicio ?? new Date(fechaMin);
  const fechaFinActual = fechaFin ?? new Date(fechaMax);

  const onChangeRangoFechas = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setFechaInicio(start);
    setFechaFin(end);
  };

  const datosMaterial = data.filter((row: any) => {
    if (row.Material !== materialSeleccionado) return false;
    if (row.Fecha == null) return true;

    const fechaRegistro = new Date(row.Fecha);
    return (
      fechaRegistro >= fechaInicioActual &&
      fechaRegistro <= fechaFinActual
    );
  });

  const tamices = datosMaterial.filter(
    (row: any) =>
      String(row.Grupo || "")
        .toLowerCase()
        .includes("granulometr")
  );

  const propiedades = datosMaterial.filter(
    (row: any) =>
      !String(row.Grupo || "")
        .toLowerCase()
        .includes("granulometr")
  );

  const propiedadesUnicas = [
    ...new Set(propiedades.map((p: any) => p.Propiedad)),
  ].sort();

  // Determinar las propiedades activas (máximo 2)
  const propiedadesActivas: string[] =
    propiedadesSeleccionadas.length > 0
      ? propiedadesSeleccionadas.filter((p) => propiedadesUnicas.includes(p))
      : propiedadesUnicas.includes("%H")
        ? ["%H"]
        : propiedadesUnicas.length > 0
          ? [propiedadesUnicas[0]]
          : [];

  // Construir las series para las propiedades seleccionadas
  const seriesMultiples = propiedadesActivas.map((prop) => ({
    nombre: prop,
    datos: propiedades
      .filter((p: any) => p.Propiedad === prop)
      .map((r: any) => ({
        fecha: new Date(r.Fecha).toLocaleDateString("es-MX"),
        valor: Number(r.Valor),
      })),
  }));

  const togglePropiedad = (prop: string) => {
    setPropiedadesSeleccionadas((prev) => {
      if (prev.includes(prop)) {
        // Deseleccionar: no permitir 0 seleccionadas
        if (prev.length <= 1) return prev;
        return prev.filter((p) => p !== prop);
      }
      // Seleccionar: máximo 2
      if (prev.length >= 2) {
        // Reemplaza la más antigua
        return [prev[1], prop];
      }
      return [...prev, prop];
    });
  };

  return (
    <div className="dashboard-container">
      <div className="filtros-card">
        <div className="filtro-grupo">
          <label className="filtro-label">
            Material
          </label>
          <select
            value={materialSeleccionado}
            onChange={(e) =>
              setMaterialSeleccionado(e.target.value)
            }
            className="filtro-select"
          >
            {materiales.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo filtro-rango-fechas">
          <label className="filtro-label">
            Rango de fechas (Inicio - Fin)
          </label>
          <DatePicker
            selectsRange={true}
            startDate={fechaInicioActual}
            endDate={fechaFin ? fechaFinActual : null}
            onChange={onChangeRangoFechas}
            dateFormat="dd/MM/yyyy"
            className="date-picker date-picker-range"
            placeholderText="Seleccionar rango de fechas"
            isClearable={false}
          />
        </div>

        <div className="filtro-acciones">
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="btn-exportar"
            style={{ opacity: exportando ? 0.7 : 1, cursor: exportando ? "not-allowed" : "pointer" }}
          >
            {exportando ? "Generando PDF..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {/* PAGINA 1 */}
      <div id="pdf-pagina-1" className={exportando ? "exportando-pdf" : ""}>
        <Header material={materialSeleccionado} />

        <DatosGenerales
          material={materialSeleccionado}
          fechaInicio={fechaInicioActual.toLocaleDateString("es-MX")}
          fechaFin={fechaFinActual.toLocaleDateString("es-MX")}
        />

        <Especificaciones
          material={materialSeleccionado}
          propiedades={propiedades}
        />
      </div>

      {/* PAGINA 2 */}
      <div id="pdf-pagina-2" className={exportando ? "exportando-pdf" : ""}>
        <div className="gran-layout">
          <Granulometria
            tamices={tamices}
            material={materialSeleccionado}
          />

          <TablaGranulometrica
            tamices={tamices}
            material={materialSeleccionado}
          />
        </div>

        {!materialSeleccionado.includes("Mezcla") && (
          <>
            {!exportando && propiedadesUnicas.length > 0 && (
              <div className="propiedades-selector-container">
                <span className="propiedades-selector-label">
                  Graficar propiedades (máx. 2):
                </span>
                <div className="propiedades-pills">
                  {propiedadesUnicas.map((prop) => (
                    <button
                      key={prop}
                      type="button"
                      className={`propiedad-pill ${propiedadesActivas.includes(prop) ? "activo" : ""}`}
                      onClick={() => togglePropiedad(prop)}
                    >
                      {prop}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TendenciaDiaria
              series={seriesMultiples}
            />
          </>
        )}

        <Firmas />
      </div>
    </div>
  );
}

export default App;
