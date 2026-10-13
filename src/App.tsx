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

const toISODate = (ms: number) => new Date(ms).toISOString().split("T")[0];

function App() {
  const [data, setData] = useState<any[]>([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const exportarPDF = async () => {

    const reporte =
      document.getElementById("reporte-pdf");
  
    if (!reporte) return;
  
    const canvas = await html2canvas(
      reporte,
      {
        scale: 2,
        useCORS: true,
      }
    );
  
    const imgData =
      canvas.toDataURL("image/png");
  
    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );
  
    const pdfWidth =
      pdf.internal.pageSize.getWidth();
  
    const pdfHeight =
      (canvas.height * pdfWidth) /
      canvas.width;
  
    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
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

  const fechaInicioActual = fechaInicio || fechaMin;
  const fechaFinActual = fechaFin || fechaMax;

  const datosMaterial = data.filter((row: any) => {
    if (row.Material !== materialSeleccionado) return false;
    if (row.Fecha == null) return true;
    const fecha = toISODate(row.Fecha);
    return fecha >= fechaInicioActual && fecha <= fechaFinActual;
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
    padding: "12px 14px",
    fontSize: "1.05rem",
    minWidth: "280px",
    borderRadius: "6px",
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
          <label style={labelStyle}>Material</label>
  
          <select
            value={materialSeleccionado}
            onChange={(e) =>
              setMaterialSeleccionado(e.target.value)
            }
            style={inputStyle}
          >
            {materiales.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
  
        <div>
          <label style={labelStyle}>
            Fecha inicio
          </label>
  
          <input
            type="date"
            value={fechaInicioActual}
            min={fechaMin}
            max={fechaMax}
            onChange={(e) =>
              setFechaInicio(e.target.value)
            }
            style={{
              ...inputStyle,
              minWidth: "200px",
            }}
          />
        </div>
  
        <div>
          <label style={labelStyle}>
            Fecha fin
          </label>
  
          <input
            type="date"
            value={fechaFinActual}
            min={fechaMin}
            max={fechaMax}
            onChange={(e) =>
              setFechaFin(e.target.value)
            }
            style={{
              ...inputStyle,
              minWidth: "200px",
            }}
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
  
      <div id="reporte-pdf">
  
        <Header
          material={materialSeleccionado}
        />
  
        <DatosGenerales
          material={materialSeleccionado}
        />
  
        <Especificaciones
          material={materialSeleccionado}
          propiedades={propiedades}
        />
  
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