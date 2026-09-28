type Props = {
    tamices: any[];
  };
  
  function TablaGranulometrica({ tamices }: Props) {
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
  
    const filas = Object.entries(agrupado).map(
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
          Tabla Granulométrica
        </div>
  
        <table className="tabla-gran">
          <thead>
            <tr>
              <th>Malla</th>
              <th>% Que Pasa</th>
            </tr>
          </thead>
  
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.malla}>
                <td>{fila.malla}</td>
  
                <td>
                  {fila.promedio.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  export default TablaGranulometrica;