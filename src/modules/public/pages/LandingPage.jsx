import AppointmentForm from '../../components/common/AppointmentForm';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      
      {/* Encabezado temporal */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-title font-bold text-primary mb-4">
          Descubre tu mejor versión
        </h1>
        <p className="text-secondary font-body max-w-lg mx-auto">
          Aquí pondremos próximamente las tarjetas animadas de nuestros servicios, promociones y el catálogo de productos.
        </p>
      </div>

      {/* Aquí inyectamos tu nuevo componente de Citas */}
      <div className="w-full max-w-3xl">
        <AppointmentForm />
      </div>

    </div>
  );
}