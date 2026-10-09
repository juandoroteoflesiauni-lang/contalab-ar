import { PracticeData } from '../types/practice';

export const DEFAULT_PRACTICE_DATA: PracticeData = {
  journalRows: [],
  tAccounts: [
    // Plantillas iniciales de cuentas en T listas para usar (sin movimientos ni saldos)
    {
      id: 't_caja',
      category: 'ACTIVO',
      name: 'Caja',
      code: '1.1.01',
      debits: [],
      credits: []
    },
    {
      id: 't_mercaderias',
      category: 'ACTIVO',
      name: 'Mercaderías',
      code: '1.1.05',
      debits: [],
      credits: []
    },
    {
      id: 't_proveedores',
      category: 'PASIVO',
      name: 'Proveedores',
      code: '2.1.01',
      debits: [],
      credits: []
    },
    {
      id: 't_capital',
      category: 'PATRIMONIO_NETO',
      name: 'Capital Social',
      code: '3.1.01',
      debits: [],
      credits: []
    },
    {
      id: 't_ventas',
      category: 'RESULTADOS',
      name: 'Ventas de Mercaderías',
      code: '4.1.01',
      debits: [],
      credits: []
    },
    {
      id: 't_cmv',
      category: 'RESULTADOS',
      name: 'CMV',
      code: '5.1.01',
      debits: [],
      credits: []
    }
  ],
  inventorySheets: [
    {
      id: 'sheet_inventario_1',
      title: 'Planilla de Inventario Permanente #1',
      productName: 'Producto Principal',
      unitOfMeasure: 'Unidad',
      method: 'PEPS',
      rows: []
    }
  ],
  genericCostSheets: [
    {
      id: 'cost_sheet_adquisicion',
      title: 'Determinación del Costo de Adquisición (RT 17)',
      description: 'Cálculo de componentes activables al costo de incorporación',
      rows: []
    }
  ]
};
