import { FaInstagram, FaTiktok, FaWhatsapp, FaMapMarkerAlt } from 'react-icons/fa';

export default function PublicFooter() {
  return (
    <footer>
      <div className="bg-primary text-surface py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
          
          <div>
            <h2 className="font-title text-3xl font-bold mb-4">LUMINA Skin </h2>
            <p className="text-surface/80 text-sm">
              Tecnología y naturaleza para el cuidado de tu piel. 
              Descubre tu mejor versión con nuestros tratamientos especializados.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold uppercase tracking-wider mb-2">Enlaces Legales</h3>
            <a href="#" className="text-surface/80 hover:text-white transition-colors text-sm">Aviso de Privacidad</a>
            <a href="#" className="text-surface/80 hover:text-white transition-colors text-sm">Términos y Condiciones</a>
            <a href="#" className="text-surface/80 hover:text-white transition-colors text-sm">Política de Cancelación</a>
          </div>

          <div className="flex flex-col gap-2 md:items-start items-center">
            <h3 className="font-bold uppercase tracking-wider mb-2">Encuéntranos</h3>
            <p className="flex items-center gap-2 text-surface/80 text-sm">
              <FaMapMarkerAlt /> Plaza Central, Local 12, Ciudad.
            </p>
          </div>

        </div>
      </div>

      <div className="bg-[#2A2121] py-6 border-t border-surface/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-surface/60 text-xs tracking-widest uppercase">
            © {new Date().getFullYear()} Lumina Clinical System. Todos los derechos reservados.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-surface/60 hover:text-white hover:scale-110 transition-all text-xl"><FaInstagram /></a>
            <a href="#" className="text-surface/60 hover:text-white hover:scale-110 transition-all text-xl"><FaTiktok /></a>
            <a href="#" className="text-surface/60 hover:text-white hover:scale-110 transition-all text-xl"><FaWhatsapp /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}