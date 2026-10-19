import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ReferenceLine,
  } from "recharts";
  
  type Props = {
    serie: any[];
    propiedad: string;
  };
  
  function TendenciaDiaria({
    serie,
    propiedad,
  }: Props) {
    const promedio =
      serie.reduce(
        (acc, item) => acc + Number(item.Valor),
        0
      ) / serie.length;
  
    const datos = serie.map((r) => ({
      fecha: new Date(r.Fecha)
        .toLocaleDateString("es-MX"),
      valor: Number(r.Valor),
    }));
  
    return (
      <div>
        <div className="seccion-header">
          Tendencia Diaria
        </div>
  
        <div className="chart-wrapper-tendencia">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos}>
              <CartesianGrid stroke="#B8B8B8" />
  
              <XAxis
                dataKey="fecha"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{
                  fill: "#000000",
                  fontSize: 12,
                }}
              />
  
              <YAxis />
  
              <Tooltip />
  
              <Legend />
  
              <ReferenceLine
                y={promedio}
                stroke="#C8102E"
                strokeDasharray="5 5"
                label={`Promedio ${promedio.toFixed(2)}`}
              />
  
              <Line
                dataKey="valor"
                stroke="#003DA5"
                strokeWidth={3}
                dot={{
                  fill: "#C8102E",
                  r: 5,
                }}
                name={propiedad}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  
  export default TendenciaDiaria;