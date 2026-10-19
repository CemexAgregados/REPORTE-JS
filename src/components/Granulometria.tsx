import { LIMITES_GRANULOMETRICOS } from "../data/limitesGranulometricos";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from "recharts";

type Props = {
  tamices: any[];
  material: string;
};

function Granulometria({
  tamices,
  material,
}: Props) {

  const limites =
    (LIMITES_GRANULOMETRICOS as any)[material] || {};

  const agrupado = tamices.reduce(
    (acc: any, item: any) => {

      if (!acc[item.Propiedad]) {
        acc[item.Propiedad] = [];
      }

      acc[item.Propiedad].push(
        Number(item.Valor)
      );

      return acc;

    },
    {}
  );

  const dataGrafica = Object.entries(agrupado).map(
    ([malla, valores]: any) => {

      const promedio =
        valores.reduce(
          (a: number, b: number) => a + b,
          0
        ) / valores.length;

      const limite = limites[malla as string];

      return {
        malla,
        promedio,
      
        min: limite?.min ?? null,
      
        rango:
          limite
            ? limite.max - limite.min
            : null,
      
        max: limite?.max ?? null,
      };
    }
  );

  return (
    <div>

      <div className="seccion-header">
        Curva Granulométrica
      </div>

      <div className="chart-wrapper">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <ComposedChart data={dataGrafica}>

            <CartesianGrid
              stroke="#B8B8B8"
            />

            <XAxis
              dataKey="malla"
              tick={{
                fill: "#000000",
                fontSize: 13,
              }}
            />

            <YAxis
              domain={[-10, 110]}
              tick={{
                fill: "#000000",
                fontSize: 13,
              }}
            />

            <Tooltip />

            <Legend />

            <Area
              type="monotone"
              dataKey="min"
              stackId="1"
              stroke="none"
              fill="transparent"
              name=""
            />

            <Area
              type="monotone"
              dataKey="rango" 
              stackId="1"
              stroke="none"
              fill="rgba(0, 63, 172, 0.51)"
            />

            <Line
              type="monotone"
              dataKey="max"
              stroke="#003DA5"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={false}
              name="Límite superior"
            />

            <Line
              type="monotone"
              dataKey="min"
              stroke="#003DA5"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={false}
              name="Límite inferior"
            />

            <Line
              type="monotone"
              dataKey="promedio"
              stroke="#C8102E"
              strokeWidth={2.5}
              dot={{
                fill: "#C8102E",
                r: 5,
              }}
              name="% que pasa"
            />

          </ComposedChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default Granulometria;