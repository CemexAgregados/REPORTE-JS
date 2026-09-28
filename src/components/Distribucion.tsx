import Plot from "react-plotly.js";

type Props = {
  serie: any[];
  propiedad: string;
};

function Distribucion({
  serie,
  propiedad,
}: Props) {
  const valores = serie.map(
    (r) => Number(r.Valor)
  );

  return (
    <div>
      <div className="seccion-header">
        Distribución
      </div>

      <Plot
        data={[
          {
            y: valores,
            type: "box",
            name: propiedad,
            marker: {
              color: "#003DA5",
            },
          },
        ]}
        layout={{
          height: 455,
          margin: {
            t: 20,
            l: 40,
            r: 20,
            b: 40,
          },
          paper_bgcolor: "#FFFFFF",
          plot_bgcolor: "#FFFFFF",
        }}
        config={{
          displayModeBar: false,
        }}
        style={{
          width: "100%",
        }}
      />
    </div>
  );
}

export default Distribucion;