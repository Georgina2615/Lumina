import { useEffect } from 'react';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Presenta documentos legales con una estructura reutilizable
export default function PublicLegalPage({ sections, summary, title, updatedAt }) {
  // Lleva cada documento al inicio al abrirlo
  useEffect(() => {
    window.scrollTo({ behavior: 'instant', top: 0 });
  }, []);

  // Devuelve el documento y su indice accesible
  return (
    <article className="min-h-dvh bg-background">
      <header className="relative overflow-hidden bg-primary px-5 py-14 text-surface sm:px-8 lg:px-12 lg:py-20">
        <div aria-hidden="true" className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-status-pending/20" />
        <div className="relative mx-auto max-w-6xl">
          <Link className="inline-flex items-center gap-2 text-sm text-surface/65 transition hover:text-surface" to="/">
            <FiArrowLeft aria-hidden="true" />
            Volver al inicio
          </Link>
          <div className="mt-10 flex max-w-3xl items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-status-pending/15 text-status-pending">
              <FiShield aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-status-pending">Información y transparencia</p>
              <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-surface/70 sm:text-base">{summary}</p>
              <p className="mt-5 text-xs text-surface/50">Última actualización {updatedAt}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[15rem_1fr] lg:px-12 lg:py-20">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">Contenido</p>
          <nav aria-label={`Contenido de ${title}`} className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {sections.map((section, index) => (
              <a className="shrink-0 rounded-xl border border-surface-hover bg-surface px-3 py-2 text-xs text-muted transition hover:border-secondary/30 hover:text-primary lg:border-transparent lg:bg-transparent" href={`#${section.id}`} key={section.id}>
                {index + 1} {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          {sections.map((section, index) => (
            <section className="scroll-mt-28 rounded-3xl border border-surface-hover bg-surface p-6 shadow-sm sm:p-8" id={section.id} key={section.id}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Sección {String(index + 1).padStart(2, '0')}</p>
              <h2 className="mt-2 text-2xl text-primary">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items?.length > 0 && (
                  <ul className="space-y-2 pl-5">
                    {section.items.map((item) => <li className="list-disc pl-1" key={item}>{item}</li>)}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
