import { AccountingExercise } from '../types/accounting';
import { DEFAULT_ACCOUNTS } from './defaultAccounts';

export const SAMPLE_EXERCISES: AccountingExercise[] = [
  {
    id: 'exercise_rio_de_la_plata',
    name: 'Caso 1: Comercializadora Río de la Plata S.A.',
    description: 'Ejercicio integral de cátedra con inflación progresiva, flete activable (RT 17), devoluciones y análisis comparativo de CMV entre métodos.',
    companyName: 'Comercializadora Río de la Plata S.A.',
    cuit: '30-71458921-8',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    currency: 'ARS ($)',
    valuationMethod: 'PEPS',
    accounts: [...DEFAULT_ACCOUNTS],
    products: [
      {
        id: 'prod_cafe_01',
        code: 'CAF-01',
        name: 'Café Especial Colombiano Grano 1kg',
        description: 'Bolsa de café en grano tostado especial para cafeterías',
        category: 'Alimentos y Bebidas',
        unitOfMeasure: 'Bolsa 1kg',
        initialQuantity: 100,
        initialUnitCost: 500.00,
        isSpecificIdentification: false
      }
    ],
    operations: [
      {
        id: 'op_01_compra',
        exerciseId: 'exercise_rio_de_la_plata',
        date: '2026-03-02',
        voucherType: 'Factura A',
        voucherNumber: '0001-00001234',
        type: 'COMPRA',
        counterpart: 'Importadora Andina S.R.L.',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'Compra de 150 unidades a $600 con flete de traslado incorporado de $3.000 ($20/un según RT 17)',
        applyIva: false,
        additionalAttributableExpense: 3000,
        items: [
          {
            productId: 'prod_cafe_01',
            quantity: 150,
            unitPrice: 600.00,
            subtotal: 90000.00
          }
        ],
        createdAt: 1772400000000
      },
      {
        id: 'op_02_venta',
        exerciseId: 'exercise_rio_de_la_plata',
        date: '2026-03-08',
        voucherType: 'Factura B',
        voucherNumber: '0001-00000456',
        type: 'VENTA',
        counterpart: 'Cafetería El Faro',
        paymentMethod: 'CONTADO_EFECTIVO',
        notes: 'Venta de 120 unidades al contado efectivo',
        applyIva: false,
        items: [
          {
            productId: 'prod_cafe_01',
            quantity: 120,
            unitPrice: 1100.00,
            subtotal: 132000.00
          }
        ],
        createdAt: 1772900000000
      },
      {
        id: 'op_03_compra',
        exerciseId: 'exercise_rio_de_la_plata',
        date: '2026-03-15',
        voucherType: 'Factura A',
        voucherNumber: '0001-00001300',
        type: 'COMPRA',
        counterpart: 'Importadora Andina S.R.L.',
        paymentMethod: 'BANCO_TRANSFERENCIA',
        notes: 'Nueva compra con incremento por reposición a $750/un',
        applyIva: false,
        items: [
          {
            productId: 'prod_cafe_01',
            quantity: 200,
            unitPrice: 750.00,
            subtotal: 150000.00
          }
        ],
        createdAt: 1773500000000
      },
      {
        id: 'op_04_venta',
        exerciseId: 'exercise_rio_de_la_plata',
        date: '2026-03-20',
        voucherType: 'Factura B',
        voucherNumber: '0001-00000480',
        type: 'VENTA',
        counterpart: 'Distribuidora San Telmo',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'Venta a crédito a 30 días',
        applyIva: false,
        items: [
          {
            productId: 'prod_cafe_01',
            quantity: 180,
            unitPrice: 1350.00,
            subtotal: 243000.00
          }
        ],
        createdAt: 1774000000000
      },
      {
        id: 'op_05_dev_venta',
        exerciseId: 'exercise_rio_de_la_plata',
        date: '2026-03-25',
        voucherType: 'Nota de Crédito B',
        voucherNumber: '0001-00000012',
        type: 'DEVOLUCION_VENTA',
        counterpart: 'Distribuidora San Telmo',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'El cliente devuelve 10 unidades en perfecto estado por error de pedido',
        applyIva: false,
        items: [
          {
            productId: 'prod_cafe_01',
            quantity: 10,
            unitPrice: 1350.00,
            subtotal: 13500.00
          }
        ],
        createdAt: 1774400000000
      },
      {
        id: 'op_06_faltante',
        exerciseId: 'exercise_rio_de_la_plata',
        date: '2026-03-28',
        voucherType: 'Minuta Contable',
        voucherNumber: 'MC-001',
        type: 'AJUSTE_FALTANTE',
        counterpart: 'Auditoría Interna de Stock',
        paymentMethod: 'CONTADO_EFECTIVO',
        notes: 'Se constata merma física de 5 paquetes por rotura en depósito',
        applyIva: false,
        items: [
          {
            productId: 'prod_cafe_01',
            quantity: 5,
            unitPrice: 0,
            subtotal: 0
          }
        ],
        createdAt: 1774700000000
      }
    ],
    createdAt: 1772300000000,
    updatedAt: 1772300000000
  },
  {
    id: 'exercise_tecnosur_especifica',
    name: 'Caso 2: TecnoSur Computación S.A. (Identificación Específica)',
    description: 'Ejercicio práctico con trazabilidad por número de serie para equipos de alto valor unitario.',
    companyName: 'TecnoSur Computación S.A.',
    cuit: '30-88123456-9',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    currency: 'ARS ($)',
    valuationMethod: 'ESPECIFICA',
    accounts: [...DEFAULT_ACCOUNTS],
    products: [
      {
        id: 'prod_notebook_gamer',
        code: 'NOTE-GP16',
        name: 'Notebook Gamer ThinkPro 16 32GB RAM',
        description: 'Computadora portátil para diseño y cómputo de alta gama con número de serie individual',
        category: 'Informática y Tecnología',
        unitOfMeasure: 'Unidad',
        initialQuantity: 2,
        initialUnitCost: 1200000.00,
        isSpecificIdentification: true,
        units: [
          {
            id: 'SN-001',
            cost: 1200000.00,
            isSold: false,
            purchaseDate: '2026-03-20',
            purchaseVoucher: 'Saldo Inicial'
          },
          {
            id: 'SN-002',
            cost: 1200000.00,
            isSold: false,
            purchaseDate: '2026-03-20',
            purchaseVoucher: 'Saldo Inicial'
          }
        ]
      }
    ],
    operations: [
      {
        id: 'op_tec_01',
        exerciseId: 'exercise_tecnosur_especifica',
        date: '2026-04-05',
        voucherType: 'Factura A',
        voucherNumber: '0005-00045612',
        type: 'COMPRA',
        counterpart: 'Lenovo Distribución Mayorista',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'Ingresan dos equipos con seriales SN-003 y SN-004',
        applyIva: false,
        items: [
          {
            productId: 'prod_notebook_gamer',
            quantity: 2,
            unitPrice: 1350000.00,
            subtotal: 2700000.00,
            specificUnitIds: ['SN-003', 'SN-004']
          }
        ],
        createdAt: 1775300000000
      },
      {
        id: 'op_tec_02',
        exerciseId: 'exercise_tecnosur_especifica',
        date: '2026-04-12',
        voucherType: 'Factura A',
        voucherNumber: '0002-00000101',
        type: 'VENTA',
        counterpart: 'Estudio Jurídico Mar del Plata',
        paymentMethod: 'BANCO_TRANSFERENCIA',
        notes: 'Venta de dos equipos asignando exactamente las unidades SN-001 (costo $1.200.000) y SN-004 (costo $1.350.000)',
        applyIva: false,
        items: [
          {
            productId: 'prod_notebook_gamer',
            quantity: 2,
            unitPrice: 2200000.00,
            subtotal: 4400000.00,
            specificUnitIds: ['SN-001', 'SN-004']
          }
        ],
        createdAt: 1775900000000
      }
    ],
    createdAt: 1775000000000,
    updatedAt: 1775000000000
  },
  {
    id: 'exercise_pampeana_ppp',
    name: 'Caso 3: Distribuidora Pampeana (PPP y Bonificaciones)',
    description: 'Ejercicio de Precio Promedio Ponderado móvil con descuentos comerciales obtenidos y devolución a proveedor.',
    companyName: 'Distribuidora Pampeana S.R.L.',
    cuit: '30-66441122-3',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    currency: 'ARS ($)',
    valuationMethod: 'PPP',
    accounts: [...DEFAULT_ACCOUNTS],
    products: [
      {
        id: 'prod_aceite_oliva',
        code: 'ACE-EV500',
        name: 'Aceite de Oliva Extra Virgen 500ml',
        description: 'Botella de vidrio oscurecido 500ml',
        category: 'Alimentos Gourmet',
        unitOfMeasure: 'Botella 500ml',
        initialQuantity: 50,
        initialUnitCost: 3000.00,
        isSpecificIdentification: false
      }
    ],
    operations: [
      {
        id: 'op_pamp_01',
        exerciseId: 'exercise_pampeana_ppp',
        date: '2026-05-04',
        voucherType: 'Factura A',
        voucherNumber: '0003-00008819',
        type: 'COMPRA',
        counterpart: 'Olivares Cuyanos S.A.',
        paymentMethod: 'CONTADO_EFECTIVO',
        notes: 'Compra de 100 botellas a $3.500 con descuento comercial por volumen del 5%',
        applyIva: false,
        discountPercentage: 5,
        items: [
          {
            productId: 'prod_aceite_oliva',
            quantity: 100,
            unitPrice: 3500.00,
            subtotal: 350000.00
          }
        ],
        createdAt: 1777800000000
      },
      {
        id: 'op_pamp_02',
        exerciseId: 'exercise_pampeana_ppp',
        date: '2026-05-10',
        voucherType: 'Remito R',
        voucherNumber: '0001-00000129',
        type: 'DEVOLUCION_COMPRA',
        counterpart: 'Olivares Cuyanos S.A.',
        paymentMethod: 'CONTADO_EFECTIVO',
        notes: 'Devolución de 10 botellas con etiqueta dañada al proveedor a precio de costo neto',
        applyIva: false,
        items: [
          {
            productId: 'prod_aceite_oliva',
            quantity: 10,
            unitPrice: 3325.00,
            subtotal: 33250.00
          }
        ],
        createdAt: 1778400000000
      },
      {
        id: 'op_pamp_03',
        exerciseId: 'exercise_pampeana_ppp',
        date: '2026-05-18',
        voucherType: 'Factura B',
        voucherNumber: '0001-00000912',
        type: 'VENTA',
        counterpart: 'Restaurante Gourmet La Pampa',
        paymentMethod: 'CUENTA_CORRIENTE',
        notes: 'Venta de 80 botellas a $5.200 valuadas al PPP móvil vigente',
        applyIva: false,
        items: [
          {
            productId: 'prod_aceite_oliva',
            quantity: 80,
            unitPrice: 5200.00,
            subtotal: 416000.00
          }
        ],
        createdAt: 1779100000000
      }
    ],
    createdAt: 1777000000000,
    updatedAt: 1777000000000
  }
];
