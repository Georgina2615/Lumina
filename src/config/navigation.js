import { FaHome, FaCalendarAlt, FaUsers, FaCashRegister, FaNotesMedical, FaChartPie } from 'react-icons/fa';

export const menuItems = [
  // VISTAS DE RECEPCIÓN 
  { 
    id: 'reception-home', 
    label: 'Inicio', 
    path: '/dashboard/reception', 
    icon: FaHome, 
    roles: ['admin', 'recepcion'] 
  },
  { 
    id: 'reception-calendar', 
    label: 'Agenda', 
    path: '/dashboard/calendar', 
    icon: FaCalendarAlt, 
    roles: ['admin', 'recepcion'] 
  },
  { 
    id: 'reception-clients', 
    label: 'Clientes', 
    path: '/dashboard/clientes', 
    icon: FaUsers, 
    roles: ['admin', 'recepcion'] 
  },
  { 
    id: 'reception-pos', 
    label: 'Punto de Venta', 
    path: '/dashboard/pos', 
    icon: FaCashRegister, 
    roles: ['admin', 'recepcion'] 
  },

  // VISTAS CLÍNICAS (Cabina / Cosmetóloga)
  { 
    id: 'clinical-home', 
    label: 'Mi Agenda', 
    path: '/dashboard/clinical', 
    icon: FaNotesMedical, 
    roles: ['admin', 'cosmetologa'] 
  },
  { 
    id: 'clinical-patients', 
    label: 'Pacientes', 
    path: '/dashboard/pacientes-clinicos', 
    icon: FaUsers, 
    roles: ['admin', 'cosmetologa'] 
  },

  // VISTAS DE ADMINISTRACIÓN
  { 
    id: 'admin-home', 
    label: 'Métricas', 
    path: '/dashboard/admin', 
    icon: FaChartPie, 
    roles: ['admin'] 
  }
];