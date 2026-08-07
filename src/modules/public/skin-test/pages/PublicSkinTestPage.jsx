import { FiArrowRight, FiRefreshCw, FiShield } from 'react-icons/fi';
import PublicSkinTestQuestion from '../components/PublicSkinTestQuestion';
import PublicSkinTestResult from '../components/PublicSkinTestResult';
import { usePublicSkinTest } from '../hooks/UsePublicSkinTest';

// Presenta el test público de orientación estética
export default function PublicSkinTestPage() {
  const test = usePublicSkinTest();

  // Devuelve un estado de carga estable
  if (test.loading) {
    return <main className="min-h-[70vh] bg-surface px-5 py-16 sm:px-8"><div aria-label="Cargando test de piel" className="mx-auto h-96 max-w-4xl animate-pulse rounded-[2rem] bg-surface-hover/60" /></main>;
  }

  // Devuelve una recuperación sin datos inventados
  if (!test.currentQuestion) {
    return (
      <main className="min-h-[70vh] bg-surface px-5 py-16 sm:px-8">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-surface-hover bg-background p-8 text-center shadow-sm" role="alert">
          <h1 className="text-3xl text-primary">Test no disponible</h1>
          <p className="mt-4 text-sm leading-6 text-muted">{test.error || 'Vuelve a intentarlo más tarde'}</p>
          <button className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-surface" onClick={test.load} type="button"><FiRefreshCw aria-hidden="true" />Intentar nuevamente</button>
        </section>
      </main>
    );
  }

  // Devuelve la introducción el recorrido o el resultado
  return (
    <main className="min-h-[75vh] bg-gradient-to-b from-background to-surface px-5 py-14 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[2rem] border border-surface-hover bg-background shadow-xl shadow-primary/5">
          {!test.started && !test.result && (
            <section className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_0.65fr] lg:p-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Conoce mejor tu piel</p>
                <h1 className="mt-4 text-4xl leading-tight text-primary sm:text-5xl">Encuentra un cuidado pensado para ti</h1>
                <p className="mt-5 text-base leading-7 text-muted">Responde unas preguntas sencillas y conoce qué tratamiento puede ajustarse mejor a lo que buscas</p>
                <button className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-surface transition hover:bg-secondary" onClick={() => test.setStarted(true)} type="button">Comenzar test<FiArrowRight aria-hidden="true" /></button>
              </div>
              <div className="flex flex-col justify-center rounded-3xl bg-surface p-6">
                <FiShield aria-hidden="true" className="text-status-confirmed" size={28} />
                <h2 className="mt-5 text-2xl text-primary">Tus respuestas son privadas</h2>
                <p className="mt-3 text-sm leading-6 text-muted">No pedimos tu nombre ni guardamos tus respuestas El resultado es únicamente una orientación estética</p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{test.questionsCount} preguntas</p>
              </div>
            </section>
          )}
          {test.started && !test.result && <div className="p-7 sm:p-10 lg:p-14"><PublicSkinTestQuestion test={test} /></div>}
          {test.result && <div className="p-7 sm:p-10 lg:p-14"><PublicSkinTestResult onRestart={test.restart} result={test.result} /></div>}
        </div>
      </div>
    </main>
  );
}
