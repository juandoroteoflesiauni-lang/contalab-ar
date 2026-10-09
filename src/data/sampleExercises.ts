import { AccountingExercise } from '../types/accounting';
import { DEFAULT_ACCOUNTS } from './defaultAccounts';

export const INITIAL_EXERCISE: AccountingExercise = {
  id: 'ejercicio_inicial',
  name: 'Ejercicio Contable #1',
  description: 'Espacio de trabajo listo para cargar operaciones del ejercicio contable',
  companyName: 'Mi Empresa Comercial S.A.',
  cuit: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  currency: 'ARS ($)',
  valuationMethod: 'PEPS',
  accounts: [...DEFAULT_ACCOUNTS],
  products: [],
  operations: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const SAMPLE_EXERCISES: AccountingExercise[] = [INITIAL_EXERCISE];
