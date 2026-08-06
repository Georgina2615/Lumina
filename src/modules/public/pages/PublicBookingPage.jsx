import { FiArrowLeft, FiArrowRight, FiLock } from 'react-icons/fi';
import {
  PublicBookingDetailsStep,
  PublicBookingPaymentStep,
  PublicBookingProgress,
  PublicBookingServiceStep,
  PublicBookingSuccess
} from '../components';
import { usePublicBooking } from '../hooks/UsePublicBooking';

// Compone la solicitud publica por etapas
export default function PublicBookingPage() {
  const booking = usePublicBooking();

  // Devuelve la pantalla completa de agendamiento
  return (
    <section className="bg-background px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Agenda en línea</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Reserva un momento para tu piel</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted">Selecciona tu tratamiento, envía el anticipo y recepción verificará tu solicitud.</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-surface-hover bg-surface shadow-xl shadow-primary/5">
          {booking.step < 4 && <div className="border-b border-surface-hover px-6 py-6 sm:px-10"><PublicBookingProgress currentStep={booking.step} /></div>}
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {booking.step === 1 && <PublicBookingServiceStep error={booking.catalog.error} loading={booking.catalog.loading} onSelect={(value) => booking.updateField('serviceId', value)} selectedId={booking.fields.serviceId} services={booking.catalog.services} />}
            {booking.step === 2 && <PublicBookingDetailsStep availabilityLoading={booking.availabilityLoading} fields={booking.fields} onChange={booking.updateField} timeOptions={booking.timeOptions} />}
            {booking.step === 3 && <PublicBookingPaymentStep config={booking.paymentConfig} configError={booking.configError} depositAmountCents={booking.depositAmountCents} fields={booking.fields} onChange={booking.updateField} onProof={booking.selectProof} processingProof={booking.processingProof} service={booking.selectedService} />}
            {booking.step === 4 && <PublicBookingSuccess fields={booking.fields} result={booking.result} service={booking.selectedService} />}

            {booking.error && booking.step < 4 && <p className="mt-6 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">{booking.error}</p>}
            {booking.step < 4 && (
              <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-surface-hover pt-6 sm:flex-row">
                {booking.step > 1 ? <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-surface-hover px-6 text-sm font-semibold transition hover:bg-background" onClick={booking.goBack} type="button"><FiArrowLeft aria-hidden="true" />Regresar</button> : <span />}
                {booking.step < 3 ? <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-surface transition hover:bg-secondary" onClick={booking.goNext} type="button">Continuar<FiArrowRight aria-hidden="true" /></button> : <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-surface transition enabled:hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50" disabled={booking.submitting || booking.processingProof || !booking.paymentConfig} onClick={booking.submit} type="button"><FiLock aria-hidden="true" />{booking.submitting ? 'Enviando solicitud' : 'Enviar para revisión'}</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
