import { FiPlus, FiRefreshCw, FiSave } from 'react-icons/fi';
import SkinTestQuestionCard from '../components/SkinTestQuestionCard';
import SkinTestResultCard from '../components/SkinTestResultCard';
import { useAdminSkinTest } from '../hooks/UseAdminSkinTest';
import { skinResultOptions } from '../services/AdminSkinTestDefaults';

// Presenta la configuración administrativa del test
export default function AdminSkinTest() {
  const skinTest = useAdminSkinTest();

  if (skinTest.loading && !skinTest.draft) {
    return <p className="rounded-2xl bg-surface px-6 py-12 text-center text-sm text-muted">Cargando test de piel</p>;
  }

  if (!skinTest.draft) {
    return <div className="rounded-2xl bg-error/10 p-5 text-sm text-error" role="alert">{skinTest.error}<button className="ml-3 font-semibold underline" onClick={skinTest.refresh} type="button">Reintentar</button></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Administración</p><h1 className="mt-1 text-3xl sm:text-4xl">Test de piel</h1><p className="mt-1 text-sm text-muted">Preguntas y recomendaciones que verá la clienta</p></div>
        <div className="flex gap-2"><button aria-label="Actualizar test" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold hover:bg-surface-hover" onClick={skinTest.refresh} type="button"><FiRefreshCw />Actualizar</button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface shadow-sm transition hover:bg-secondary disabled:opacity-50" disabled={skinTest.saving} onClick={skinTest.save} type="button"><FiSave />{skinTest.saving ? 'Guardando' : 'Guardar cambios'}</button></div>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
        <div><h2 className="text-xl">Disponibilidad del test</h2><p className="mt-1 text-sm text-muted">Guárdalo como borrador hasta terminar las recomendaciones</p></div>
        <label className="flex items-center gap-3 text-sm font-semibold"><span>{skinTest.draft.active ? 'Publicado' : 'Borrador'}</span><input checked={skinTest.draft.active} className="h-5 w-5 accent-primary" onChange={(event) => skinTest.setActive(event.target.checked)} type="checkbox" /></label>
      </section>

      {skinTest.error && <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">{skinTest.error}</p>}
      {skinTest.feedback && <p className="rounded-2xl bg-status-confirmed/10 px-4 py-3 text-sm text-status-confirmed" role="status">{skinTest.feedback}</p>}

      <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl">Preguntas</h2><p className="text-sm text-muted">De tres a diez preguntas con hasta cinco respuestas</p></div><button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold hover:bg-surface-hover disabled:opacity-40" disabled={skinTest.draft.questions.length >= 10} onClick={skinTest.addQuestion} type="button"><FiPlus />Agregar pregunta</button></div><div className="space-y-4">{skinTest.draft.questions.map((question, index) => <SkinTestQuestionCard canMoveDown={index < skinTest.draft.questions.length - 1} canMoveUp={index > 0} canRemove={skinTest.draft.questions.length > 3} index={index} key={question.id} onAddOption={() => skinTest.addOption(question.id)} onMove={(direction) => skinTest.moveQuestion(question.id, direction)} onRemove={() => skinTest.removeQuestion(question.id)} onRemoveOption={(optionId) => skinTest.removeOption(question.id, optionId)} onUpdate={(patch) => skinTest.updateQuestion(question.id, patch)} onUpdateOption={(optionId, patch) => skinTest.updateOption(question.id, optionId, patch)} question={question} />)}</div></section>

      <section><div className="mb-4"><h2 className="text-2xl">Resultados</h2><p className="text-sm text-muted">Relaciona cada necesidad con un servicio y productos disponibles</p></div><div className="grid gap-4 xl:grid-cols-2">{skinResultOptions.map((option) => <SkinTestResultCard key={option.key} label={option.label} onUpdate={(patch) => skinTest.updateResult(option.key, patch)} products={skinTest.products} result={skinTest.draft.results[option.key]} services={skinTest.services} />)}</div></section>
    </div>
  );
}
