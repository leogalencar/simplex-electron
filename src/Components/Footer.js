export default function Footer({ version }) {
    return (
        <div className="footer bg-light text-center align-items-center d-flex justify-content-center">
            <div className="col-md-3">v{version}</div>
            <div className="col-md-3">SP Simplex  &#169; - Todos os direitos reservados</div>
            <div className="col-md-3">
                <a className="link" href="https://github.com/leogalencar/simplex-electron" target="_blank">GitHub</a>
            </div>
        </div>
    );
}
