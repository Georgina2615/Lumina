import {
  FaBoxOpen,
  FaCalendarAlt,
  FaCashRegister,
  FaChartPie,
  FaExchangeAlt,
  FaFlask,
  FaHome,
  FaNotesMedical,
  FaUsers
} from 'react-icons/fa';

const adminWorkspaceItems = [
  {
    end: true,
    icon: FaChartPie,
    id: 'admin-home',
    label: 'Resumen',
    mobileLabel: 'Resumen',
    path: '/dashboard/admin',
    roles: ['admin']
  },
  {
    icon: FaBoxOpen,
    id: 'admin-retail-inventory',
    label: 'Productos para venta',
    mobileLabel: 'Productos',
    path: '/dashboard/admin/inventario-retail',
    roles: ['admin']
  },
  {
    icon: FaFlask,
    id: 'admin-cabin-inventory',
    label: 'Insumos de cabina',
    mobileLabel: 'Cabina',
    path: '/dashboard/admin/inventario-cabina',
    roles: ['admin']
  },
  {
    icon: FaExchangeAlt,
    id: 'open-reception',
    intent: 'switch',
    label: 'Ir a recepción',
    mobileLabel: 'Recepción',
    path: '/dashboard/reception',
    roles: ['admin']
  }
];

const receptionWorkspaceItems = [
  {
    end: true,
    icon: FaHome,
    id: 'reception-home',
    label: 'Inicio',
    mobileLabel: 'Inicio',
    path: '/dashboard/reception',
    roles: ['admin', 'recepcion']
  },
  {
    icon: FaCalendarAlt,
    id: 'reception-calendar',
    label: 'Agenda',
    mobileLabel: 'Agenda',
    path: '/dashboard/reception/agenda',
    roles: ['admin', 'recepcion']
  },
  {
    icon: FaUsers,
    id: 'reception-clients',
    label: 'Clientes',
    mobileLabel: 'Clientes',
    path: '/dashboard/reception/clientes',
    roles: ['admin', 'recepcion']
  },
  {
    icon: FaCashRegister,
    id: 'reception-pos',
    label: 'Punto de Venta',
    mobileLabel: 'Venta',
    path: '/dashboard/reception/venta',
    roles: ['admin', 'recepcion']
  }
];

const adminReturnItem = {
  icon: FaExchangeAlt,
  id: 'return-admin',
  intent: 'switch',
  label: 'Volver a administración',
  mobileHidden: true,
  mobileLabel: 'Admin',
  path: '/dashboard/admin',
  roles: ['admin']
};

const clinicalWorkspaceItems = [
  {
    icon: FaNotesMedical,
    id: 'clinical-home',
    label: 'Mi Agenda',
    mobileLabel: 'Agenda',
    path: '/dashboard/clinical',
    roles: ['cosmetologa']
  },
  {
    icon: FaUsers,
    id: 'clinical-patients',
    label: 'Pacientes',
    mobileLabel: 'Pacientes',
    path: '/dashboard/pacientes-clinicos',
    roles: ['cosmetologa']
  }
];

// Detecta el espacio operativo vigente
const isReceptionWorkspace = (pathname) => (
  pathname === '/dashboard/reception'
  || pathname.startsWith('/dashboard/reception/')
  || ['/dashboard/calendar', '/dashboard/clientes', '/dashboard/pos']
    .includes(pathname)
);

// Devuelve únicamente la navegación pertinente al contexto
export const getWorkspaceMenu = ({ pathname, role }) => {
  let items = [];

  if (role === 'admin') {
    items = isReceptionWorkspace(pathname)
      ? [...receptionWorkspaceItems, adminReturnItem]
      : adminWorkspaceItems;
  } else if (role === 'recepcion') {
    items = receptionWorkspaceItems;
  } else if (role === 'cosmetologa') {
    items = clinicalWorkspaceItems;
  }

  return items.filter((item) => item.roles.includes(role));
};
