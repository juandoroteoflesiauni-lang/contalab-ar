import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Calendar, 
  CreditCard, 
  Truck, 
  DollarSign, 
  AlertCircle, 
  Layers, 
  Check, 
  X,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { 
  Operation, 
  OperationType, 
  PaymentMethod 
} from '../../types/accounting';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/currency';

interface OperationsViewProps {
  isModalOpenExternal?: boolean;
  onCloseModalExternal?: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  isModalOpenExternal,
  onCloseModalExternal
}) => {
  const { 
    activeExercise, 
    addOperation, 
    updateOperation, 
    deleteOperation,
    inventoryCalculation
  } = useAccounting();

  const [filterType, setFilterType] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);

  // Form Fields
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<OperationType>('COMPRA');
  const [voucherType, setVoucherType] = useState('Factura A');
  const [voucherNumber, setVoucherNumber] = useState('0001-00000001');
  const [counterpart, setCounterpart] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CUENTA_CORRIENTE');
  const [productId, setProductId] = useState(() => activeExercise.products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitPrice, setUnitPrice] = useState<number>(100);
  const [applyIva, setApplyIva] = useState(false);
  const [ivaRate, setIvaRate] = useState(21);
  const [additionalExpense, setAdditionalExpense] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);

  // Sincronizar modal externo
  React.useEffect(() => {
    if (isModalOpenExternal) {
      openAddModal();
    }
  }, [isModalOpenExternal]);

  const openAddModal = () => {
    setEditingOperation(null);
    setDate(new Date().toISOString().slice(0, 10));
    setType('COMPRA');
    setVoucherType('Factura A');
    setVoucherNumber(`0001-${String(activeExercise.operations.length + 1).padStart(8, '0')}`);
    setCounterpart('Distribuidora Central S.R.L.');
    setPaymentMethod('CUENTA_CORRIENTE');
    setProductId(activeExercise.products[0]?.id || '');
    setQuantity(10);
    setUnitPrice(500);
    setApplyIva(false);
    setIvaRate(21);
    setAdditionalExpense(0);
    setDiscountPercent(0);
    setNotes('');
    setSelectedSerials([]);
    setIsModalOpen(true);
  };

  const openEditModal = (op: Operation) => {
    setEditingOperation(op);
    setDate(op.date);
    setType(op.type);
    setVoucherType(op.voucherType);
    setVoucherNumber(op.voucherNumber);
    setCounterpart(op.counterpart);
    setPaymentMethod(op.paymentMethod);
    const item = op.items[0];
    if (item) {
      setProductId(item.productId);
      setQuantity(item.quantity);
      setUnitPrice(item.unitPrice);
      setSelectedSerials(item.specificUnitIds || []);
    }
    setApplyIva(!!op.applyIva);
    setIvaRate(op.ivaRate || 21);
    setAdditionalExpense(op.additionalAttributableExpense || 0);
    setDiscountPercent(op.discountPercentage || 0);
    setNotes(op.notes || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (onCloseModalExternal) onCloseModalExternal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      alert('Debes seleccionar un producto.');
      return;
    }

    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }

    // Validar stock disponible para ventas o salidas
    if (type === 'VENTA' || type === 'AJUSTE_FALTANTE') {
      const prodState = inventoryCalculation.productStates.get(productId);
      const currentStock = prodState?.endingUnits || 0;
      // Si estamos editando, sumar la cantidad que tenía esta operación
      const previousOpQty = editingOperation?.items.find(i => i.productId === productId)?.quantity || 0;
      const effectiveAvailable = currentStock + previousOpQty;

      if (quantity > effectiveAvailable) {
        alert(`Stock insuficiente: La operación solicita ${quantity} unidades pero solo hay ${effectiveAvailable} disponibles.`);
        return;
      }
    }

    const subtotal = quantity * unitPrice;

    const opPayload: Omit<Operation, 'id' | 'createdAt' | 'exerciseId'> = {
      date,
      type,
      voucherType,
      voucherNumber,
      counterpart: counterpart.trim() || 'Sin especificar',
      paymentMethod,
      applyIva,
      ivaRate,
      additionalAttributableExpense: additionalExpense > 0 ? additionalExpense : undefined,
      discountPercentage: discountPercent > 0 ? discountPercent : undefined,
      notes,
      items: [
        {
          productId,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          subtotal,
          specificUnitIds: selectedSerials.length > 0 ? selectedSerials : undefined
        }
      ]
    };

    if (editingOperation) {
      updateOperation({
        ...editingOperation,
        ...opPayload
      });
    } else {
      addOperation(opPayload);
    }

    closeModal();
  };

  const handleDelete = (op: Operation) => {
    if (window.confirm(`¿Estás seguro de eliminar la operación ${op.voucherType} Nº ${op.voucherNumber}? Se recalcularán automáticamente el Kardex y el Libro Diario.`)) {
      deleteOperation(op.id);
    }
  };

  // Filtrado de operaciones
  const filteredOperations = activeExercise.operations.filter(op => {
    const matchesFilter = filterType === 'TODAS' || op.type === filterType;
    const matchesSearch = 
      op.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.counterpart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.voucherType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.notes && op.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const selectedProduct = activeExercise.products.find(p => p.id === productId);

  return (
    <div className="space-y-6">
      
      {/* Cabecera y Botón Nueva Operación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            Registro de Operaciones Comerciales
          </h2>
          <p className="text-xs text-slate-400">
            Carga de hechos económicos: compras, ventas, fletes incorporables (RT 17), devoluciones y ajustes
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Operación</span>
        </button>
      </div>

      {/* Barra de Filtros Rápidos */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'COMPRA', label: 'Compras' },
            { id: 'VENTA', label: 'Ventas' },
            { id: 'DEVOLUCION_COMPRA', label: 'Dev. Compras' },
            { id: 'DEVOLUCION_VENTA', label: 'Dev. Ventas' },
            { id: 'AJUSTE_FALTANTE', label: 'Faltantes' },
            { id: 'AJUSTE_SOBRANTE', label: 'Sobrantes' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar comprobante o contraparte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
      </div>

      {/* Tabla de Operaciones */}
      {filteredOperations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No hay operaciones registradas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Registra tu primera compra o venta para comenzar el circuito contable.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Fecha</th>
                <th className="py-3 px-3.5">Tipo</th>
                <th className="py-3 px-3.5">Comprobante</th>
                <th className="py-3 px-3.5">Producto & Cantidad</th>
                <th className="py-3 px-3.5">Precio Unit.</th>
                <th className="py-3 px-3.5">Contraparte</th>
                <th className="py-3 px-3.5">Forma Pago</th>
                <th className="py-3 px-3.5 text-right">Total ($)</th>
                <th className="py-3 px-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOperations.map((op) => {
                const item = op.items[0];
                const prod = activeExercise.products.find(p => p.id === item?.productId);
                const subtotal = item ? item.quantity * item.unitPrice : 0;
                let totalWithExpenses = subtotal + (op.additionalAttributableExpense || 0);
                if (op.discountPercentage) {
                  totalWithExpenses -= totalWithExpenses * (op.discountPercentage / 100);
                }

                const badgeColors: Record<string, string> = {
                  COMPRA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  VENTA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  DEVOLUCION_COMPRA: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  DEVOLUCION_VENTA: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                  AJUSTE_FALTANTE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  AJUSTE_SOBRANTE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                  APERTURA: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
                };

                return (
                  <tr key={op.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 font-mono text-slate-400">{formatDate(op.date)}</td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColors[op.type] || 'bg-slate-800 text-slate-400'}`}>
                        {op.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono font-medium text-white">
                      <div>{op.voucherType}</div>
                      <div className="text-[11px] text-slate-500">Nº {op.voucherNumber}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-200">{prod?.name || 'Varios'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item ? `${formatQuantity(item.quantity)} ${prod?.unitOfMeasure || 'un.'}` : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-300">
                      {item ? formatCurrency(item.unitPrice) : '-'}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="text-slate-200">{op.counterpart}</div>
                      {op.notes && <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{op.notes}</div>}
                    </td>
                    <td className="py-3 px-3.5 text-slate-400">
                      <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {op.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-white">
                      {formatCurrency(totalWithExpenses)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(op)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Editar operación"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(op)}
                          className="p-1 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition"
                          title="Eliminar operación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registrar / Editar Operación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Receipt className="w-5 h-5 text-indigo-400" />
              {editingOperation ? 'Editar Hecho Económico' : 'Registrar Operación Comercial'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Impactará automáticamente en el Kardex permanente y generará el asiento contable balanceado
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Tipo de Operación y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Operación *</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as OperationType;
                      setType(newType);
                      // Ajustar comprobante sugerido
                      if (newType === 'COMPRA') setVoucherType('Factura A');
                      if (newType === 'VENTA') setVoucherType('Factura B');
                      if (newType.startsWith('DEVOLUCION')) setVoucherType('Nota de Crédito');
                      if (newType.startsWith('AJUSTE')) setVoucherType('Minuta Contable');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="COMPRA">Compra de Mercaderías</option>
                    <option value="VENTA">Venta de Mercaderías</option>
                    <option value="DEVOLUCION_COMPRA">Devolución a Proveedor (Baja de Stock)</option>
                    <option value="DEVOLUCION_VENTA">Devolución de Cliente (Reingreso a Stock)</option>
                    <option value="AJUSTE_FALTANTE">Ajuste por Faltante de Stock (Recuento)</option>
                    <option value="AJUSTE_SOBRANTE">Ajuste por Sobrante de Stock (Recuento)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fecha Contable *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Comprobante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Comprobante</label>
                  <input
                    type="text"
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value)}
                    placeholder="ej: Factura A, Factura B, Remito R"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Número de Comprobante</label>
                  <input
                    type="text"
                    required
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    placeholder="ej: 0001-00001234"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Producto, Cantidad y Precio */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Detalle de los Bienes de Cambio</span>
                  {selectedProduct && (
                    <span className="text-[11px] text-cyan-400 font-mono">
                      Stock actual: {inventoryCalculation.productStates.get(selectedProduct.id)?.endingUnits || 0} {selectedProduct.unitOfMeasure}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-1">Producto</label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {activeExercise.products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {type === 'VENTA' ? 'Precio de Venta Unit. ($)' : 'Costo Unit. Compra ($)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Subtotal preliminar */}
                <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                  <span>Subtotal bienes:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(quantity * unitPrice)}</span>
                </div>
              </div>

              {/* Contraparte y Forma de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {type === 'COMPRA' || type === 'DEVOLUCION_COMPRA' ? 'Proveedor' : 'Cliente / Tercero'}
                  </label>
                  <input
                    type="text"
                    value={counterpart}
                    onChange={(e) => setCounterpart(e.target.value)}
                    placeholder="ej: Distribuidora Central S.R.L."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Forma de Pago / Cobro</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CUENTA_CORRIENTE">Cuenta Corriente Comercial (a crédito)</option>
                    <option value="CONTADO_EFECTIVO">Contado Efectivo (Caja)</option>
                    <option value="BANCO_TRANSFERENCIA">Transferencia Bancaria (Banco c/c)</option>
                    <option value="DOCUMENTO">Documentado con Pagaré</option>
                  </select>
                </div>
              </div>

              {/* Opciones Avanzadas Contables (Fletes RT 17, Descuentos, IVA) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                {type === 'COMPRA' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Flete/Gasto Adicional ($) [RT 17]
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={additionalExpense}
                      onChange={(e) => setAdditionalExpense(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Descuento Comercial (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={applyIva}
                      onChange={(e) => setApplyIva(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300">Discriminar IVA (21%)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notas / Concepto</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalle complementario de la operación..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
                >
                  {editingOperation ? 'Actualizar Operación' : 'Registrar Hecho Económico'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
