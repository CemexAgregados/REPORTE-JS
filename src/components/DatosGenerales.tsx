type Props = {
    material: string;
  };
  
  function DatosGenerales({ material }: Props) {
    const hoy = new Date().toLocaleDateString("es-MX");
  
    return (
      <div>
        <div className="seccion-header">
          Datos Generales
        </div>
  
        <table>
          <thead>
            <tr>
              <th>Campo</th>
              <th>Valor</th>
            </tr>
          </thead>
  
          <tbody>
            <tr>
              <td>Planta</td>
              <td>Cantera Cerro Jardín</td>
            </tr>
  
            <tr>
              <td>Dirección</td>
              <td>
                Domicilio Conocido Poblado de Coayuca S/N,
                Atotonilco de Tula, Hidalgo
              </td>
            </tr>
  
            <tr>
              <td>Teléfono</td>
              <td>N/A</td>
            </tr>
  
            <tr>
              <td>Agregado</td>
              <td>{material}</td>
            </tr>
  
            <tr>
              <td>Litología</td>
              <td>Caliza</td>
            </tr>
  
            <tr>
              <td>Fecha Inicial Periodo</td>
              <td>Últimos 30 días</td>
            </tr>
  
            <tr>
              <td>Fecha Final Periodo</td>
              <td>Actual</td>
            </tr>
  
            <tr>
              <td>Fecha de Emisión</td>
              <td>{hoy}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  
  export default DatosGenerales;