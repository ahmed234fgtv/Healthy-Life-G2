import ActivityForm from '../components/ActivityForm'
import MovementIllustration from '../components/MovementIllustration'

export default function RegisterActivityPage() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#activity-form">
        Ir al formulario
      </a>
      <header className="site-header">
        <div className="brand" aria-label="Healthy Life">
          <span className="brand-symbol" aria-hidden="true">
            h<span>l</span>
            <i />
          </span>
          <span className="brand-wordmark">
            healthy<span>life.</span>
          </span>
        </div>
        <div className="header-context">
          <span>SCRUM &amp; RUN</span>
          <span>E2 · Hábitos saludables</span>
        </div>
      </header>

      <main className="workspace">
        <section className="introduction" aria-labelledby="page-title">
          <p className="eyebrow">
            <span className="section-marker">E2</span> SEGUIMIENTO DE HÁBITOS
          </p>
          <h1 id="page-title">
            Registrar <br />
            <em>actividad física</em>
          </h1>
          <p className="intro-copy">
            Anota qué has hecho y cuándo.
            <br className="desktop-break" /> Un lugar para registrar tu
            movimiento, actividad a actividad.
          </p>
          <MovementIllustration />
          <div className="intro-note">
            <span className="note-line" aria-hidden="true" />
            <p>
              Caminar, correr, entrenar…
              <br />
              Elige la actividad que mejor describa la tuya.
            </p>
          </div>
        </section>

        <ActivityForm />
      </main>

      <footer className="site-footer">
        <span>
          HEALTHY LIFE <span className="footer-separator">/</span> Módulo E2
        </span>
        <span>
          Proyecto académico · Universidad Rey Juan Carlos{' '}
          <span className="footer-year">2026–27</span>
        </span>
      </footer>
    </div>
  )
}
