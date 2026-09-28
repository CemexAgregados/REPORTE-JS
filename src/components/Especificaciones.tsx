import {
  ESPECIFICACIONES,
  NOMBRES_REPORTE,
} from "../data/specs";

type Registro = {
  Propiedad: string;
  Valor: number;
};

type Props = {
  material: string;
  propiedades: Registro[];
};

function Especificaciones({ material, propiedades }: Props) {
  const agrupado = propiedades.reduce((acc: Record<string, number[]>, item) => {
    if (!acc[item.Propiedad]) {
      acc[item.Propiedad] = [];
    }
    acc[item.Propiedad].push(Number(item.Valor));
    return acc;
  }, {});

  const specsMaterial = ESPECIFICACIONES[material] || {};

  const filas = Object.entries(specsMaterial).map(
    ([propiedad, spec]: any) => {
      const valores = agrupado[propiedad] || [];

      const promedio =
        valores.length > 0
          ? (
              valores.reduce((a: number, b: number) => a + b, 0) /
              valores.length
            ).toFixed(2)
          : "---";

      return {
        propiedad: NOMBRES_REPORTE[propiedad] || propiedad,
        metodo: spec.metodo ?? "---",
        minimo: spec.min ?? "---",
        maximo: spec.max ?? "---",
        unidad: spec.unidad ?? "---",
        resultado: promedio,
      };
    }
  );

  return (
    <div>
      <div className="seccion-header">Especificaciones</div>

      <table>
        <thead>
          <tr>
            <th>Especificación</th>
            <th>Método</th>
            <th>Mínimo</th>
            <th>Máximo</th>
            <th>Unidad</th>
            <th>Resultado</th>
          </tr>
        </thead>

        <tbody>
          {filas.map((fila, idx) => (
            <tr key={idx}>
              <td>{fila.propiedad}</td>
              <td>{fila.metodo}</td>
              <td>{fila.minimo}</td>
              <td>{fila.maximo}</td>
              <td>{fila.unidad}</td>
              <td>{fila.resultado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Especificaciones;