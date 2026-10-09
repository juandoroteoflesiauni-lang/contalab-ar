import { PracticeData } from '../types/practice';

export const DEFAULT_PRACTICE_DATA: PracticeData = {
  journalRows: [
    {
      id: 'p_row_1',
      entryNumber: 1,
      date: '2026-03-05',
      accountCode: '1.1.05',
      accountName: 'Mercaderías',
      detail: 'Por compra de 100 unidades a $500 c/u según Factura A 0001-00004510',
      debit: 50000,
      credit: 0
    },
    {
      id: 'p_row_2',
      entryNumber: 1,
      date: '2026-03-05',
      accountCode: '2.1.01',
      accountName: 'Proveedores',
      detail: 'Deuda comercial en cuenta corriente a 30 días',
      debit: 0,
      credit: 50000
    },
    {
      id: 'p_row_3',
      entryNumber: 2,
      date: '2026-03-12',
      accountCode: '1.1.03',
      accountName: 'Deudores por Ventas',
      detail: 'Por venta de 60 unidades a $950 c/u según Factura B 0001-00000120',
      debit: 57000,
      credit: 0
    },
    {
      id: 'p_row_4',
      entryNumber: 2,
      date: '2026-03-12',
      accountCode: '4.1.01',
      accountName: 'Ventas de Mercaderías',
      detail: 'Ingreso comercial por venta a crédito',
      debit: 0,
      credit: 57000
    },
    {
      id: 'p_row_5',
      entryNumber: 3,
      date: '2026-03-12',
      accountCode: '5.1.01',
      accountName: 'Costo de Mercaderías Vendidas (CMV)',
      detail: 'Por devengamiento del costo de 60 unidades a $500',
      debit: 30000,
      credit: 0
    },
    {
      id: 'p_row_6',
      entryNumber: 3,
      date: '2026-03-12',
      accountCode: '1.1.05',
      accountName: 'Mercaderías',
      detail: 'Baja de stock por venta efectuada',
      debit: 0,
      credit: 30000
    }
  ],
  ledgerAccounts: [
    {
      id: 'acc_mercaderias',
      accountCode: '1.1.05',
      accountName: 'Mercaderías',
      movements: [
        {
          id: 'mov_1',
          date: '2026-03-05',
          detail: 'Compra Factura A Nº 0001-00004510',
          entryRef: 'Asiento Nº 1',
          debit: 50000,
          credit: 0
        },
        {
          id: 'mov_2',
          date: '2026-03-12',
          detail: 'CMV por Venta Factura B Nº 0001-00000120',
          entryRef: 'Asiento Nº 3',
          debit: 0,
          credit: 30000
        }
      ]
    },
    {
      id: 'acc_proveedores',
      accountCode: '2.1.01',
      accountName: 'Proveedores',
      movements: [
        {
          id: 'mov_3',
          date: '2026-03-05',
          detail: 'Compra a crédito Factura A Nº 0001-00004510',
          entryRef: 'Asiento Nº 1',
          debit: 0,
          credit: 50000
        }
      ]
    },
    {
      id: 'acc_deudores',
      accountCode: '1.1.03',
      accountName: 'Deudores por Ventas',
      movements: [
        {
          id: 'mov_4',
          date: '2026-03-12',
          detail: 'Venta a crédito Factura B Nº 0001-00000120',
          entryRef: 'Asiento Nº 2',
          debit: 57000,
          credit: 0
        }
      ]
    },
    {
      id: 'acc_cmv',
      accountCode: '5.1.01',
      accountName: 'Costo de Mercaderías Vendidas (CMV)',
      movements: [
        {
          id: 'mov_5',
          date: '2026-03-12',
          detail: 'Devengamiento de costo por 60 unidades',
          entryRef: 'Asiento Nº 3',
          debit: 30000,
          credit: 0
        }
      ]
    }
  ],
  costSheets: [
    {
      id: 'sheet_adquisicion_rt17',
      title: 'Determinación del Costo de Adquisición de Bienes de Cambio (RT 17)',
      description: 'Cálculo de los costos necesarios activables para incorporar las mercaderías al patrimonio.',
      rows: [
        {
          id: 'c_row_1',
          concept: 'Precio de factura del proveedor (neto de impuestos recuperables)',
          quantity: 200,
          unitCost: 600,
          total: 120000,
          notes: 'Factura A de compra'
        },
        {
          id: 'c_row_2',
          concept: 'Flete de traslado desde depósito proveedor (RT 17 atribuible)',
          quantity: 1,
          unitCost: 8000,
          total: 8000,
          notes: 'Gasto necesario de transporte'
        },
        {
          id: 'c_row_3',
          concept: 'Seguro de transporte en tránsito',
          quantity: 1,
          unitCost: 2000,
          total: 2000,
          notes: 'Costo de cobertura durante el traslado'
        },
        {
          id: 'c_row_4',
          concept: 'Descuento comercial obtenido por volumen',
          quantity: 1,
          unitCost: -4000,
          total: -4000,
          notes: 'Bonificación que disminuye el costo de compra'
        }
      ]
    },
    {
      id: 'sheet_costo_lote',
      title: 'Hoja de Costos de Reacondicionamiento y Embalaje',
      description: 'Costos incurridos para poner el producto en condiciones de ser vendido.',
      rows: [
        {
          id: 'c_row_5',
          concept: 'Materia prima directa / Embalaje especial',
          quantity: 200,
          unitCost: 45,
          total: 9000,
          notes: 'Cajas rotuladas'
        },
        {
          id: 'c_row_6',
          concept: 'Mano de obra directa de acondicionamiento',
          quantity: 10,
          unitCost: 850,
          total: 8500,
          notes: 'Horas operario'
        }
      ]
    }
  ]
};
