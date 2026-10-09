// Utilidades para precisión monetaria argentina, redondeo contable y formato de fechas

/**
 * Redondeo contable a 2 decimales para importes monetarios.
 * Evita anomalías de coma flotante binaria (0.1 + 0.2 = 0.30000000000000004).
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Redondeo a 4 decimales para costos unitarios en PPP (Precio Promedio Ponderado).
 */
export function round4(num: number): number {
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
}

/**
 * Formatea un número como pesos argentinos ($ 1.250,50)
 */
export function formatCurrency(amount: number | null | undefined, currencySymbol = '$'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currencySymbol} 0,00`;
  }
  const rounded = round2(amount);
  const parts = Math.abs(rounded).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${currencySymbol} ${integerPart},${decimalPart}`;
}

/**
 * Formatea cantidades con separadores de miles
 */
export function formatQuantity(qty: number | null | undefined, decimals = 2): string {
  if (qty === null || qty === undefined || isNaN(qty)) return '0';
  const isInt = Number.isInteger(qty);
  if (isInt) {
    return qty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  const parts = Math.abs(qty).toFixed(decimals).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];
  const sign = qty < 0 ? '-' : '';
  return `${sign}${intPart},${decPart}`;
}

/**
 * Formato de fecha en formato argentino DD/MM/AAAA
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  // Si viene en formato YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  // Si es un Date o timestamp
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generador de identificadores únicos
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
