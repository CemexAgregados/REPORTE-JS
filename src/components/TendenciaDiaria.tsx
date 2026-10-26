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

const COLORES = [
  { linea: "#003DA5", punto: "#C8102E", promedio: "#C8102E" },
  { linea: "#E67E22", punto: "#8E44AD", promedio: "#8E44AD" },
];

type SerieData = {
  nombre: string;
  datos: { fecha: string; valor: number }[];
};

type Props = {
  series: SerieData[];
};

function TendenciaDiaria({ series }: Props) {
  if (!series.length || series.every((s) => s.datos.length === 0)) {
    return null;
  }

  // Combinar todas las fechas y crear un dataset unificado
  const todasLasFechas = [
    ...new Set(series.flatMap((s) => s.datos.map((d) => d.fecha))),
  ];

  const datosUnificados = todasLasFechas.map((fecha) => {
    const punto: Record<string, string | number> = { fecha };
    series.forEach((s) => {
      const encontrado = s.datos.find((d) => d.fecha === fecha);
      if (encontrado) {
        punto[s.nombre] = encontrado.valor;
      }
    });
    return punto;
  });

  // Calcular promedios por serie
  const promedios = series.map((s) => {
    const sum = s.datos.reduce((acc, d) => acc + d.valor, 0);
    return s.datos.length > 0 ? sum / s.datos.length : 0;
  });

  // Título dinámico
  const titulo =
    series.length === 1
      ? `Tendencia Diaria (${series[0].nombre})`
      : `Tendencia Diaria (${series.map((s) => s.nombre).join(" vs ")})`;

  return (
    <div>
      <div className="seccion-header">
        {titulo}
      </div>

      <div className="chart-wrapper-tendencia-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datosUnificados}>
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

            <YAxis yAxisId="left" />
            {series.length > 1 && (
              <YAxis yAxisId="right" orientation="right" />
            )}

            <Tooltip />
            <Legend />

            {series.map((s, i) => (
              <ReferenceLine
                key={`prom-${s.nombre}`}
                yAxisId={i === 0 ? "left" : series.length > 1 ? "right" : "left"}
                y={promedios[i]}
                stroke={COLORES[i].promedio}
                strokeDasharray="5 5"
                label={`Prom. ${s.nombre} ${promedios[i].toFixed(2)}`}
              />
            ))}

            {series.map((s, i) => (
              <Line
                key={s.nombre}
                yAxisId={i === 0 ? "left" : series.length > 1 ? "right" : "left"}
                dataKey={s.nombre}
                stroke={COLORES[i].linea}
                strokeWidth={3}
                dot={{
                  fill: COLORES[i].punto,
                  r: 4,
                }}
                name={s.nombre}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TendenciaDiaria;
