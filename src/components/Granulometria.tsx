import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    Tooltip,
  } from "recharts";
  
  type Props = {
    tamices: any[];
  };
  
  function Granulometria({ tamices }: Props) {
    const agrupado = tamices.reduce(
      (acc: any, item: any) => {
        if (!acc[item.Propiedad]) {
          acc[item.Propiedad] = [];
        }
  
        acc[item.Propiedad].push(Number(item.Valor));
  
        return acc;
      },
      {}
    );
  
    const dataGrafica = Object.entries(agrupado).map(
      ([malla, valores]: any) => ({
        malla,
        promedio:
          valores.reduce(
            (a: number, b: number) => a + b,
            0
          ) / valores.length,
      })
    );
  
    return (
      <div>
        <div className="seccion-header">
          Curva Granulométrica
        </div>
  
        <div style={{ height: 450 }}>
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={dataGrafica}>
              <CartesianGrid stroke="#B8B8B8" />
  
              <XAxis
                dataKey="malla"
              />
  
              <YAxis
                domain={[0, 110]}
              />
  
              <Tooltip />
  
              <Legend />
  
              <Line
                type="monotone"
                dataKey="promedio"
                stroke="#C8102E"
                strokeWidth={3}
                dot={{
                  fill: "#C8102E",
                  r: 5,
                }}
                name="% que pasa"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  
  export default Granulometria;