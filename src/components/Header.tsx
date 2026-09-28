type HeaderProps = {
    material: string;
  };
  
  function Header({ material }: HeaderProps) {
    return (
      <>
        <div className="logo-container">
            <img src="/assets/logo_cemex.png" alt="Logo CEMEX" style={{ height: "100px", width: "auto" }} />
        </div>
  
        <h1>CEMEX AGREGADOS MÉXICO</h1>
        <h2>Informe de Resultados</h2>
        <h3>{material}</h3>
  
        <hr />
      </>
    );
  }
  
  export default Header;