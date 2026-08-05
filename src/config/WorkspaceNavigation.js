import {
  FaBoxOpen,
  FaCalendarAlt,
  FaCashRegister,
  FaChartPie,
  FaExchangeAlt,
  FaFolderOpen,
  FaFlask,
  FaHome,
  FaMoneyBillWave,
  FaNotesMedical,
  FaCog,
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
    icon: FaMoneyBillWave,
    id: 'admin-payments-report',
    label: 'Cobros y ventas',
    mobileLabel: 'Cobros',
    path: '/dashboard/admin/cobros',
    roles: ['admin']
  },
  {
    icon: FaCashRegister,
    id: 'admin-cash-close',
    label: 'Corte diario',
    mobileHidden: true,
    mobileLabel: 'Corte',
    path: '/dashboard/admin/corte-diario',
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
    icon: FaCog,
    id: 'admin-settings',
    label: 'Configuración',
    mobileHidden: true,
    mobileLabel: 'Ajustes',
    path: '/dashboard/admin/configuracion/servicios',
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
    icon: FaFolderOpen,
    id: 'clinical-records',
    label: 'Expedientes',
    mobileLabel: 'Expedientes',
    path: '/dashboard/clinical/expedientes',
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
