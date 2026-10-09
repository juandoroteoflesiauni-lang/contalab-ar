import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FileSpreadsheet, 
  Barcode, 
  Layers, 
  DollarSign, 
  Info, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { Product, InventoryItemUnit } from '../../types/accounting';
import { formatCurrency, formatQuantity, generateId } from '../../utils/currency';
import { ActiveTab } from '../layout/Sidebar';

interface ProductsViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onNavigateTab }) => {
  const { 
    activeExercise, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    inventoryCalculation,
    setActiveProductId
  } = useAccounting();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Formulario State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('Unidad');
  const [initialQuantity, setInitialQuantity] = useState(0);
  const [initialUnitCost, setInitialUnitCost] = useState(0);
  const [isSpecificIdentification, setIsSpecificIdentification] = useState(false);
  const [serialTagsInput, setSerialTagsInput] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setCode(`PROD-${String(activeExercise.products.length + 1).padStart(3, '0')}`);
    setName('');
    setDescription('');
    setCategory('Mercaderías de Reventa');
    setUnitOfMeasure('Unidad');
    setInitialQuantity(0);
    setInitialUnitCost(0);
    setIsSpecificIdentification(activeExercise.valuationMethod === 'ESPECIFICA');
    setSerialTagsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setCode(prod.code);
    setName(prod.name);
    setDescription(prod.description);
    setCategory(prod.category);
    setUnitOfMeasure(prod.unitOfMeasure);
    setInitialQuantity(prod.initialQuantity);
    setInitialUnitCost(prod.initialUnitCost);
    setIsSpecificIdentification(!!prod.isSpecificIdentification);
    setSerialTagsInput(prod.units?.map(u => u.id).join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Por favor completa el código y el nombre del producto.');
      return;
    }

    let parsedUnits: InventoryItemUnit[] = [];
    if (isSpecificIdentification && serialTagsInput.trim()) {
      const serials = serialTagsInput.split(',').map(s => s.trim()).filter(Boolean);
      parsedUnits = serials.map(s => ({
        id: s,
        cost: initialUnitCost,
        isSold: false,
        purchaseDate: 'Saldo Inicial',
        purchaseVoucher: 'Inventario Inicial'
      }));
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        code,
        name,
        description,
        category,
        unitOfMeasure,
        initialQuantity: Number(initialQuantity),
        initialUnitCost: Number(initialUnitCost),
        isSpecificIdentification,
        units: parsedUnits.length > 0 ? parsedUnits : editingProduct.units
      });
    } else {
      addProduct({
        code,
        name,
        description,
        category,
        unitOfMeasure,
        initialQuantity: Number(initialQuantity),
        initialUnitCost: Number(initialUnitCost),
        isSpecificIdentification,
        units: parsedUnits
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (prod: Product) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${prod.name}" (${prod.code})? Esto también eliminará sus movimientos asociados.`)) {
      deleteProduct(prod.id);
    }
  };

  const handleOpenKardex = (prodId: string) => {
    setActiveProductId(prodId);
    onNavigateTab('kardex');
  };

  const filteredProducts = activeExercise.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Cabecera con Buscador y Botón Agregar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Catálogo de Productos y Existencias
          </h2>
          <p className="text-xs text-slate-400">
            Bienes de cambio inventariables bajo el sistema de inventario permanente
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o rubro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64 transition"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Grid de Productos */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No se encontraron productos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Crea tu primer producto para comenzar a registrar compras y ventas.'}
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition"
            >
              Crear Producto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const state = inventoryCalculation.productStates.get(prod.id);
            const unitsAvailable = state?.endingUnits ?? prod.initialQuantity;
            const inventoryValue = state?.endingCost ?? (prod.initialQuantity * prod.initialUnitCost);
            const currentUnitCost = unitsAvailable > 0 ? inventoryValue / unitsAvailable : prod.initialUnitCost;

            return (
              <div 
                key={prod.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-semibold border border-slate-700">
                        {prod.code}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">{prod.category}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Editar producto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod)}
                        className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {prod.description || 'Sin descripción adicional.'}
                  </p>

                  {/* Badges de Identificación Específica */}
                  {prod.isSpecificIdentification && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-950/40 px-2 py-1 rounded-lg border border-purple-800/40">
                      <Barcode className="w-3.5 h-3.5 text-purple-400" />
                      <span>Identificación por Nº de Serie o Lote</span>
                    </div>
                  )}

                  {/* Métricas del Producto */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Stock Disponible</div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {formatQuantity(unitsAvailable)} {prod.unitOfMeasure}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Costo Unit. Prom./Capa</div>
                      <div className="text-sm font-bold text-slate-300 font-mono mt-0.5">
                        {formatCurrency(currentUnitCost)}
                      </div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Valuación Total:</span>
                      <span className="text-sm font-bold text-cyan-400 font-mono">
                        {formatCurrency(inventoryValue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón Ver Kardex */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenKardex(prod.id)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition group-hover:border-indigo-500/50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Abrir Ficha de Stock (Kardex)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Agregar / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-indigo-400" />
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto / Bien de Cambio'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Configura los atributos y saldos de apertura para el inventario permanente
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="ej: CAF-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rubro / Categoría</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="ej: Alimentos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="ej: Café Tostado en Grano 1kg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Detalles sobre presentación, empaque o características contables..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unidad Medida</label>
                  <input
                    type="text"
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="ej: Unidad, Kg, Litro"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cant. Inicial</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Costo Unit. Inicial ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={initialUnitCost}
                    onChange={(e) => setInitialUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Toggle de Identificación Específica */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpecificIdentification}
                    onChange={(e) => setIsSpecificIdentification(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    Habilitar Identificación Específica (Números de Serie / Lotes)
                  </span>
                </label>
                {isSpecificIdentification && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Números de Serie iniciales (separados por coma):
                    </label>
                    <input
                      type="text"
                      value={serialTagsInput}
                      onChange={(e) => setSerialTagsInput(e.target.value)}
                      placeholder="ej: SN-101, SN-102, SN-103"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
