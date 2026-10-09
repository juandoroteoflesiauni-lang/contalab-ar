# ContaLab AR — Plataforma de Sistemas de Información Contable (SIC)
### Herramienta Educativa Universitaria para Estudiantes de la Carrera de Contador Público
#### Inventario Permanente, Métodos de Valuación (PEPS, UEPS, PPP, Identificación Específica) y Generación Automática de Asientos Contables

---

## 📌 Descripción del Proyecto

**ContaLab AR** es una aplicación web contable integral diseñada específicamente para estudiantes de la carrera de **Contador Público** que cursan la materia **Sistemas de Información Contable**. 

La plataforma permite registrar transacciones comerciales completas, gestionar el inventario permanente de bienes de cambio, calcular el Costo de las Mercaderías Vendidas (**CMV**), emitir la Ficha de Stock (**Kardex**), generar automáticamente el **Libro Diario** balanceado por partida doble y confeccionar el **Libro Mayor** y el **Balance de Comprobación de Sumas y Saldos**.

---

## 🚀 Métodos de Valuación Implementados

1. **PEPS — FIFO (Primero Entrado, Primero Salido):**
   - Consume en cada salida las capas más antiguas de inventario.
   - En contextos inflacionarios, reporta un menor CMV y mayor Resultado Bruto, dejando el inventario final valuado a costos recientes más cercanos a reposición.
2. **UEPS — LIFO (Último Entrado, Primero Salido) [Uso Académico]:**
   - Consume las capas de incorporación más recientes.
   - *Nota pedagógica:* Se incluye con fines estrictamente comparativos para el aprendizaje universitario. En la República Argentina, la **RT 17 (FACPCE)** y las **NIIF (NIC 2)** no admiten UEPS para la confección de estados contables por distorsionar la valuación del inventario final. La app advierte automáticamente esta situación mediante banners institucionales.
3. **PPP — Precio Promedio Ponderado Móvil:**
   - Recalcula el costo promedio unitario tras cada entrada de bienes:
     $$\text{PPP} = \frac{\text{Costo Total Acumulado} + \text{Costo Entrada}}{\text{Unidades Previas} + \text{Unidades Entrada}}$$
   - Mantiene alta precisión decimal y no altera retroactivamente salidas anteriores.
4. **Identificación Específica (Costo Real Individual):**
   - Administra bienes con número de serie individual o identificación por lote específico (ej. equipos de alta gama, vehículos, obras de arte).
   - Permite seleccionar las unidades exactas en cada venta, calculando el CMV a partir de su costo histórico individual real.

---

## 🏛️ Características y Normativa Contable Aplicada

- **Partida Doble Estricta:** Cada asiento cumple de forma determinista la igualdad fundamental $\text{Total Debe} = \text{Total Haber}$.
- **Plan de Cuentas Universitario Configurable:** Cuentas codificadas por rubros (Activo, Pasivo, Patrimonio Neto, Resultados Positivos y Resultados Negativos).
- **Tratamiento de Costos Atribuibles (RT 17):** Los fletes y seguros directamente atribuibles a la adquisición se activan como mayor valor de costo de las mercaderías.
- **Doble Registro en Ventas:** Por cada venta se genera el asiento de devengamiento del ingreso (Ventas) y el asiento simultáneo de baja de existencias y reconocimiento del CMV.
- **Devoluciones y Ajustes Físicos:** Soporte para devoluciones de compras, devoluciones de ventas con reingreso a stock y reversión de CMV, faltantes y sobrantes de inventario detectados en recuentos físicos.
- **Comparador 4 en 1:** Permite contrastar simultáneamente los 4 métodos sobre el mismo conjunto de operaciones del ejercicio, visualizando las diferencias en CMV, Resultado Bruto e Inventario Final.
- **Modo Estudio y Explicación Paso a Paso:** Desglose interactivo en 7 puntos de cada operación económica, con fundamentación doctrinaria de las cuentas debitadas y acreditadas, y autoevaluación interactiva.
- **Exportación Profesional:** Generación de libros de **Excel (.xlsx)** con pestañas separadas (Resumen, Kardex, Libro Diario, Sumas y Saldos, Comparativa), **CSV**, impresión directa a **PDF** y respaldo/restauración de ejercicios en formato **JSON**.

---

## 💻 Requisitos y Pila Tecnológica

- **Node.js:** v18 o superior (probado en Node v24.15.0)
- **Framework:** React 19 + TypeScript
- **Estilos:** Tailwind CSS v4 con tokens de diseño moderno (modo oscuro con paleta slate/indigo/cyan)
- **Iconografía:** Lucide React
- **Exportación:** SheetJS (XLSX)
- **Runner de Pruebas:** Vitest + Test Runner interactivo en el navegador

---

## 🛠️ Instrucciones de Instalación y Ejecución

### 1. Clonar o ingresar a la carpeta del proyecto
```bash
cd c:\Users\flesi\OneDrive\Desktop\CarreraContador
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible de forma inmediata en:
👉 **http://localhost:5173/**

### 4. Ejecutar las pruebas unitarias por consola
```bash
npm test
```
*Se ejecutarán 9 pruebas unitarias automatizadas que auditan la precisión matemática y contable de los motores.*

### 5. Compilar para producción
```bash
npm run build
```

---

## 📚 Casos Prácticos Pre-cargados (Cátedra)

1. **Caso 1: Comercializadora Río de la Plata S.A.**
   - Caso integral con inflación progresiva de compras ($500 -> $600 -> $750), flete activable de traslado (RT 17), ventas parciales, devolución de clientes y merma física en depósito.
2. **Caso 2: TecnoSur Computación S.A.**
   - Ejercicio enfocado en **Identificación Específica** con trazabilidad por número de serie individual (Notebooks ThinkPro 16'' con números de serie SN-001 a SN-004).
3. **Caso 3: Distribuidora Pampeana S.R.L.**
   - Caso de **Precio Promedio Ponderado (PPP)** con descuentos comerciales obtenidos del 5% y devolución de mercaderías defectuosas al proveedor.

---

## 🧪 Pruebas Automatizadas Verificadas

| Nº | Caso de Prueba | Resultado |
| :--- | :--- | :---: |
| 1 | **PEPS (FIFO):** Prelación cronológica y consumo estricto de capas antiguas | ✓ Aprobado |
| 2 | **UEPS (LIFO):** Prelación de capas recientes y divergencia inflacionaria | ✓ Aprobado |
| 3 | **PPP:** Recálculo exacto del costo promedio ponderado móvil | ✓ Aprobado |
| 4 | **Identificación Específica:** Asignación unívoca del costo por serial/lote | ✓ Aprobado |
| 5 | **Libro Diario:** Partida Doble absoluta (Total Debe = Total Haber) | ✓ Aprobado |
| 6 | **Balance de Sumas y Saldos:** Igualdad de sumas y de saldos | ✓ Aprobado |
| 7 | **Costos Atribuibles (RT 17):** Activación de fletes al costo del bien | ✓ Aprobado |
| 8 | **Devoluciones:** Reingreso simétrico a stock y reversión de CMV | ✓ Aprobado |
| 9 | **Ajustes de Inventario:** Tratamiento contable de mermas y sobrantes | ✓ Aprobado |

---

Desarrollado con dedicación profesional para la formación de futuros Contadores Públicos. 🎓
