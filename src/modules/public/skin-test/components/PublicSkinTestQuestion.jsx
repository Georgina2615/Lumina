import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

// Presenta una pregunta y sus respuestas
export default function PublicSkinTestQuestion({ test }) {
  const questionNumber = test.currentIndex + 1;

  // Devuelve el paso actual del test
  return (
    <section aria-labelledby="skin-question-title">
      <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        <span>Pregunta {questionNumber} de {test.questionsCount}</span>
        <span>{test.progress} por ciento</span>
      </div>
      <div aria-hidden="true" className="mt-4 flex gap-1.5">
        {Array.from({ length: test.questionsCount }, (_, index) => (
          <span className={`h-2 flex-1 rounded-full transition-colors duration-300 ${index <= test.currentIndex ? 'bg-status-confirmed' : 'bg-surface-hover'}`} key={index} />
        ))}
      </div>
      <h1 className="mt-10 text-3xl leading-tight text-primary sm:text-4xl" id="skin-question-title">
        {test.currentQuestion.text}
      </h1>
      <div className="mt-8 grid gap-3">
        {test.currentQuestion.options.map((option) => {
          const selected = option.id === test.selectedOptionId;
          return (
            <button aria-pressed={selected} className={`min-h-16 rounded-2xl border px-5 py-4 text-left text-sm font-medium transition duration-200 ${selected ? 'border-secondary bg-status-pending/20 text-primary shadow-sm' : 'border-surface-hover bg-background text-muted hover:border-secondary/40 hover:text-primary'}`} key={option.id} onClick={() => test.selectOption(option.id)} type="button">
              <span className="flex items-center gap-4">
                <span aria-hidden="true" className={`h-4 w-4 shrink-0 rounded-full border-4 ${selected ? 'border-secondary bg-background' : 'border-surface-hover bg-background'}`} />
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      {test.error && <p className="mt-5 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">{test.error}</p>}
      <div className="mt-8 flex items-center justify-between gap-4">
        {test.currentIndex > 0 ? <button className="inline-flex min-h-12 items-center gap-2 rounded-full border border-surface-hover px-5 text-sm font-semibold text-primary transition hover:bg-surface" onClick={test.goBack} type="button"><FiArrowLeft aria-hidden="true" />Anterior</button> : <span />}
        <button className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-surface transition enabled:hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50" disabled={test.evaluating} onClick={test.continueTest} type="button">
          {test.evaluating ? 'Preparando resultado' : test.currentIndex === test.questionsCount - 1 ? 'Ver mi orientación' : 'Continuar'}
          {!test.evaluating && <FiArrowRight aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}
