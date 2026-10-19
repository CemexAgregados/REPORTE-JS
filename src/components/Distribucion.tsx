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
        Distribución {propiedad ? `(${propiedad})` : ""}
      </div>

      <div className="chart-wrapper">
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
            autosize: true,
            margin: {
              t: 20,
              l: 40,
              r: 20,
              b: 40,
            },
            paper_bgcolor: "#FFFFFF",
            plot_bgcolor: "#FFFFFF",
          }}
          useResizeHandler={true}
          config={{
            responsive: true,
            displayModeBar: false,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}

export default Distribucion;