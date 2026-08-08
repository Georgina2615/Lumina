import { FiArrowLeft, FiArrowRight, FiLock } from 'react-icons/fi';
import {
  PublicBookingDetailsStep,
  PublicBookingPaymentStep,
  PublicBookingProgress,
  PublicBookingServiceStep,
  PublicBookingSuccess
} from '../components';
import { usePublicBooking } from '../hooks/UsePublicBooking';
import { Reveal } from '../../../shared/components';

// Compone la solicitud publica por etapas
export default function PublicBookingPage() {
  const booking = usePublicBooking();

  // Devuelve la pantalla completa de agendamiento
  return (
    <section className="bg-background px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Agenda en línea</p>
          <h1 className="mt-3 text-3xl sm:text-5xl">Reserva un momento para tu piel</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted sm:mt-4 sm:leading-7">Selecciona tu tratamiento y paga el anticipo para reservar tu horario.</p>
        </div>

        <div className="rounded-3xl border border-surface-hover bg-surface shadow-xl shadow-primary/5 sm:rounded-[2rem]">
          {booking.step < 4 && <div className="border-b border-surface-hover px-5 py-5 sm:px-10 sm:py-6"><PublicBookingProgress currentStep={booking.step} /></div>}
          <div className="px-5 py-6 sm:px-10 sm:py-9">
            <Reveal key={`booking-step-${booking.step}`} variant="right">
              {booking.step === 1 && <PublicBookingServiceStep error={booking.catalog.error} loading={booking.catalog.loading} onSelect={(value) => booking.updateField('serviceId', value)} selectedId={booking.fields.serviceId} services={booking.catalog.services} />}
              {booking.step === 2 && <PublicBookingDetailsStep availabilityLoading={booking.availabilityLoading} fields={booking.fields} onChange={booking.updateField} service={booking.selectedService} timeOptions={booking.timeOptions} />}
              {booking.step === 3 && <PublicBookingPaymentStep depositAmountCents={booking.depositAmountCents} fields={booking.fields} onChange={booking.updateField} service={booking.selectedService} />}
              {booking.step === 4 && <PublicBookingSuccess fields={booking.fields} result={booking.result} service={booking.selectedService} />}
            </Reveal>

            {booking.error && booking.step < 4 && <p className="mt-6 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">{booking.error}</p>}
            {booking.step < 4 && (
              <div className="sticky bottom-0 z-10 -mx-5 mt-7 flex flex-col-reverse justify-between gap-3 border-t border-surface-hover bg-surface/95 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:static sm:mx-0 sm:mt-8 sm:flex-row sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6 sm:backdrop-blur-none">
                {booking.step > 1 ? <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-surface-hover px-6 text-sm font-semibold transition hover:bg-background active:scale-[0.98]" onClick={booking.goBack} type="button"><FiArrowLeft aria-hidden="true" />Regresar</button> : <span />}
                {booking.step < 3 ? <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-surface shadow-md shadow-primary/10 transition hover:bg-secondary active:scale-[0.98]" onClick={booking.goNext} type="button">Continuar<FiArrowRight aria-hidden="true" /></button> : <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-surface shadow-md shadow-primary/10 transition enabled:hover:bg-secondary enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50" disabled={booking.submitting} onClick={booking.submit} type="button"><FiLock aria-hidden="true" />{booking.submitting ? 'Preparando pago' : 'Pagar con Mercado Pago'}</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
