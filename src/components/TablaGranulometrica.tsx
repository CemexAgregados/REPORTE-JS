import { LIMITES_GRANULOMETRICOS } from "../data/limitesGranulometricos";

type Props = {
  tamices: any[];
  material: string;
};

function TablaGranulometrica({
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

  const filas = Object.entries(agrupado).map(
    ([malla, valores]: any) => {

      const promedio =
        valores.reduce(
          (a: number, b: number) => a + b,
          0
        ) / valores.length;

      const limite = limites[malla];

      const minimo =
        limite?.min ?? "---";

      const maximo =
        limite?.max ?? "---";

      const estado =
        limite
          ? (
              promedio >= minimo &&
              promedio <= maximo
            )
              ? "✅"
              : "🔴"
          : "-";

      return {
        malla,
        promedio,
        minimo,
        maximo,
        estado,
      };
    }
  );

  return (
    <div>

      <div className="seccion-header">
        Tabla Granulométrica
      </div>

      <div className="table-responsive">
        <table className="tabla-gran">

          <thead>
            <tr>
              <th>Malla</th>
              <th>% Pasa</th>
              <th>Min</th>
              <th>Max</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>

            {filas.map((fila) => (

              <tr key={fila.malla}>

                <td>{fila.malla}</td>

                <td>
                  {fila.promedio.toFixed(2)}
                </td>

                <td>
                  {fila.minimo}
                </td>

                <td>
                  {fila.maximo}
                </td>

                <td>
                  {fila.estado}
                </td>

              </tr>

            ))}

          </tbody>

        </table>
      </div>

    </div>
  );
}

export default TablaGranulometrica;