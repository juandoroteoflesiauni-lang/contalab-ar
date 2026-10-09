import { Account } from '../types/accounting';

export const DEFAULT_ACCOUNTS: Account[] = [
  // 1. ACTIVO
  { code: '1.1.01', name: 'Caja', type: 'ACTIVO', description: 'Disponibilidades en efectivo' },
  { code: '1.1.02', name: 'Banco Cuenta Corriente', type: 'ACTIVO', description: 'Depósitos bancarios a la vista' },
  { code: '1.1.03', name: 'Deudores por Ventas', type: 'ACTIVO', description: 'Créditos por venta de mercaderías en cuenta corriente' },
  { code: '1.1.04', name: 'Documentos a Cobrar', type: 'ACTIVO', description: 'Pagarés y compromisos documentados exigibles' },
  { code: '1.1.05', name: 'Mercaderías', type: 'ACTIVO', description: 'Bienes de cambio destinados a la reventa' },
  { code: '1.1.06', name: 'IVA Crédito Fiscal', type: 'ACTIVO', description: 'Impuesto facturado por compras a computar' },
  { code: '1.1.07', name: 'Anticipo a Proveedores', type: 'ACTIVO', description: 'Pagos a cuenta de futuras compras' },

  // 2. PASIVO
  { code: '2.1.01', name: 'Proveedores', type: 'PASIVO', description: 'Deudas comerciales en cuenta corriente por mercaderías' },
  { code: '2.1.02', name: 'Documentos a Pagar', type: 'PASIVO', description: 'Pagarés comerciales firmados por la empresa' },
  { code: '2.1.03', name: 'IVA Débito Fiscal', type: 'PASIVO', description: 'Impuesto facturado por ventas adeudado al fisco' },
  { code: '2.1.04', name: 'IVA Saldo a Pagar', type: 'PASIVO', description: 'Posición neta deudora/acreedora del período' },
  { code: '2.1.05', name: 'Acreedores Varios', type: 'PASIVO', description: 'Deudas por compras de bienes o servicios no mercaderías' },

  // 3. PATRIMONIO NETO
  { code: '3.1.01', name: 'Capital Social', type: 'PATRIMONIO_NETO', description: 'Aportes comprometidos o integrados por los socios' },
  { code: '3.2.01', name: 'Resultados Acumulados', type: 'PATRIMONIO_NETO', description: 'Ganancias o pérdidas de ejercicios anteriores' },
  { code: '3.2.02', name: 'Resultado del Ejercicio', type: 'PATRIMONIO_NETO', description: 'Superávit o déficit del ejercicio actual' },

  // 4. RESULTADOS POSITIVOS (INGRESOS / GANANCIAS)
  { code: '4.1.01', name: 'Ventas de Mercaderías', type: 'RESULTADO_POSITIVO', description: 'Ingresos por venta de bienes de cambio' },
  { code: '4.1.02', name: 'Sobrantes de Inventario', type: 'RESULTADO_POSITIVO', description: 'Diferencia favorable detectada en recuento físico' },
  { code: '4.1.03', name: 'Descuentos Comerciales Obtenidos', type: 'RESULTADO_POSITIVO', description: 'Bonificaciones financieras o comerciales' },
  { code: '4.1.04', name: 'Intereses Ganados', type: 'RESULTADO_POSITIVO', description: 'Rendimientos financieros cobrados o devengados' },

  // 5. RESULTADOS NEGATIVOS (COSTOS Y GASTOS)
  { code: '5.1.01', name: 'Costo de Mercaderías Vendidas (CMV)', type: 'RESULTADO_NEGATIVO', description: 'Costo de incorporación de los bienes vendidos' },
  { code: '5.1.02', name: 'Faltantes de Inventario', type: 'RESULTADO_NEGATIVO', description: 'Pérdida por diferencia negativa en inventario físico' },
  { code: '5.1.03', name: 'Fletes y Acarreos (No activables)', type: 'RESULTADO_NEGATIVO', description: 'Gastos de distribución o fletes no atribuibles al bien' },
  { code: '5.1.04', name: 'Descuentos Cedidos', type: 'RESULTADO_NEGATIVO', description: 'Bonificaciones y quitas otorgadas a clientes' },
  { code: '5.1.05', name: 'Gastos de Comercialización', type: 'RESULTADO_NEGATIVO', description: 'Costos operativos de venta' },
  { code: '5.1.06', name: 'Gastos de Administración', type: 'RESULTADO_NEGATIVO', description: 'Costos operativos administrativos' },
];
