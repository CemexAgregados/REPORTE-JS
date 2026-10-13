import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import DatosGenerales from "./components/DatosGenerales";
import Especificaciones from "./components/Especificaciones";
import Granulometria from "./components/Granulometria";
import TablaGranulometrica from "./components/TablaGranulometrica";
import TendenciaDiaria from "./components/TendenciaDiaria";
import Distribucion from "./components/Distribucion";
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

  const exportarPDF = async () => {

    const pagina1 =
      document.getElementById("pdf-pagina-1");
  
    const pagina2 =
      document.getElementById("pdf-pagina-2");
  
    if (!pagina1 || !pagina2) return;
  
    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );
  
    const capturarPagina = async (
      elemento: HTMLElement
    ) => {
  
      const canvas = await html2canvas(
        elemento,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        }
      );
  
      return canvas.toDataURL("image/png");
    };
  
    const img1 =
      await capturarPagina(pagina1);
  
    const img2 =
      await capturarPagina(pagina2);
  
    const pageWidth =
      pdf.internal.pageSize.getWidth();
  
    const pageHeight =
      pdf.internal.pageSize.getHeight();
  
    pdf.addImage(
      img1,
      "PNG",
      0,
      0,
      pageWidth,
      pageHeight
    );
  
    pdf.addPage();
  
    pdf.addImage(
      img2,
      "PNG",
      0,
      0,
      pageWidth,
      pageHeight
    );
  
    pdf.save(
      `Reporte_${materialSeleccionado}.pdf`
    );
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

  
  const datosMaterial = data.filter((row: any) => {

    if (row.Material !== materialSeleccionado)
      return false;
  
    if (row.Fecha == null)
      return true;
  
    const fechaRegistro =
      new Date(row.Fecha);
  
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

  const propiedadSeleccionada = propiedadesUnicas[0];

  const serie = propiedades.filter(
    (p: any) => p.Propiedad === propiedadSeleccionada
  );


  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    fontSize: "1.05rem",
  } as const;

  const inputStyle = {
    padding: "6px 8px",
    fontSize: "1.35rem",
    fontWeight: 500,
    minWidth: "280px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  } as const;

  return (
    <div className="dashboard-container">
  
      <div
        style={{
          marginBottom: "30px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: "30px",
          flexWrap: "wrap",
        }}
      >
  
        <div>
          <label style={labelStyle}>
            Material
          </label>
  
          <select
            value={materialSeleccionado}
            onChange={(e) =>
              setMaterialSeleccionado(e.target.value)
            }
            style={inputStyle}
          >
            {materiales.map((m) => (
              <option
                key={m}
                value={m}
              >
                {m}
              </option>
            ))}
          </select>
        </div>
  
        <div>
          <label style={labelStyle}>
            Fecha inicio
          </label>
  
          <DatePicker
          selected={fechaInicioActual}
          onChange={(date: Date | null) =>
            setFechaInicio(date)
          }
          dateFormat="dd/MM/yyyy"
          className="date-picker"
        />
        </div>
  
        <div>
          <label style={labelStyle}>
            Fecha fin
          </label>
  
          <DatePicker
            selected={fechaFinActual}
            onChange={(date: Date | null) =>
              setFechaFin(date)
            }
            dateFormat="dd/MM/yyyy"
            className="date-picker"
          />

        </div>
  
        <div>
          <button
            onClick={exportarPDF}
            style={{
              padding: "12px 20px",
              background: "#003DA5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Exportar PDF
          </button>
        </div>
  
      </div>
  
      {/* PAGINA 1 */}
  
      <div id="pdf-pagina-1">
  
        <Header
          material={materialSeleccionado}
        />
  
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
  
      <div id="pdf-pagina-2">
  
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
  
          <div className="gran-layout">
  
            <TendenciaDiaria
              serie={serie}
              propiedad={propiedadSeleccionada}
            />
  
            <Distribucion
              serie={serie}
              propiedad={propiedadSeleccionada}
            />
  
          </div>
  
        )}
  
        <Firmas />
  
      </div>
  
    </div>
  );
  }
  
  export default App;
  