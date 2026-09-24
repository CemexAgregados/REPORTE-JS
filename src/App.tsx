import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/data/reporte.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      })
      .catch((error) => {
        console.error("Error cargando JSON:", error);
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard Calidad CEMEX</h1>

      <p>Registros cargados: {data.length}</p>

      <pre>
        {JSON.stringify(data.slice(0, 5), null, 2)}
      </pre>
    </div>
  );
}

export default App;