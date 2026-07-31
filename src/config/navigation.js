import { FaHome, FaCalendarAlt, FaUsers, FaCashRegister, FaNotesMedical, FaChartPie } from 'react-icons/fa';

// Define únicamente rutas visibles para cada rol
export const menuItems = [
  {
    id: 'admin-home',
    label: 'Administración',
    mobileLabel: 'Admin',
    path: '/dashboard/admin',
    icon: FaChartPie,
    roles: ['admin']
  },
  {
    id: 'reception-home',
    label: 'Inicio',
    mobileLabel: 'Inicio',
    path: '/dashboard/reception',
    icon: FaHome,
    roles: ['admin', 'recepcion']
  },
  {
    id: 'reception-calendar',
    label: 'Agenda',
    mobileLabel: 'Agenda',
    path: '/dashboard/calendar',
    icon: FaCalendarAlt,
    roles: ['admin', 'recepcion']
  },
  {
    id: 'reception-clients',
    label: 'Clientes',
    mobileLabel: 'Clientes',
    path: '/dashboard/clientes',
    icon: FaUsers,
    roles: ['admin', 'recepcion']
  },
  {
    id: 'reception-pos',
    label: 'Punto de Venta',
    mobileLabel: 'Venta',
    path: '/dashboard/pos',
    icon: FaCashRegister,
    roles: ['admin', 'recepcion']
  },
  {
    id: 'clinical-home',
    label: 'Mi Agenda',
    mobileLabel: 'Agenda',
    path: '/dashboard/clinical',
    icon: FaNotesMedical,
    roles: ['cosmetologa']
  },
  {
    id: 'clinical-patients',
    label: 'Pacientes',
    mobileLabel: 'Pacientes',
    path: '/dashboard/pacientes-clinicos',
    icon: FaUsers,
    roles: ['cosmetologa']
  }
];
