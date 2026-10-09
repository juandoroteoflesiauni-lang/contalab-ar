import React, { useState } from 'react';
import { 
  GraduationCap, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  DollarSign, 
  ArrowRight, 
  Check, 
  X,
  Scale,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/currency';

export const StudyModeView: React.FC = () => {
  const { 
    activeExercise, 
    activeMethod, 
    journalEntries, 
    inventoryCalculation 
  } = useAccounting();

  const [selectedOperationId, setSelectedOperationId] = useState<string>(() => {
    return activeExercise.operations[0]?.id || '';
  });

  // Estado para el Quiz interactivo de estudio
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const selectedOp = activeExercise.operations.find(o => o.id === selectedOperationId) || activeExercise.operations[0];
  const associatedEntries = journalEntries.filter(e => e.operationId === selectedOp?.id);
  const selectedItem = selectedOp?.items[0];
  const selectedProduct = activeExercise.products.find(p => p.id === selectedItem?.productId);
  const prodState = selectedProduct ? inventoryCalculation.productStates.get(selectedProduct.id) : null;
  const kardexRow = prodState?.kardex.find(k => k.operationId === selectedOp?.id);

  // Preguntas de práctica de cátedra para autoevaluación
  const studyQuestions = [
    {
      question: 'En un contexto con precios de compra crecientes (inflación), ¿cuál de los métodos reportará el menor Costo de Mercaderías Vendidas (CMV) y mayor Resultado Bruto?',
      options: [
        'PEPS (Primero Entrado, Primero Salido)',
        'UEPS (Último Entrado, Primero Salido)',
        'Precio Promedio Ponderado (PPP)',
        'Identificación Específica arbitraria'
      ],
      correctIndex: 0,
      explanation: 'PEPS asigna a las salidas los costos de las compras más antiguas (más bajas), por lo que el CMV es menor y la ganancia bruta contable resulta mayor.'
    },
    {
      question: 'Según la RT 17 de la FACPCE en Argentina, ¿cómo se tratan los fletes y seguros directamente atribuibles a la adquisición de mercaderías?',
      options: [
        'Se debitan directamente a una cuenta de pérdida del período (Resultado Negativo)',
        'Se incorporan al costo de adquisición de las mercaderías (activables en bienes de cambio)',
        'Se registran como pasivo no corriente',
        'Se deducen del capital social'
      ],
      correctIndex: 1,
      explanation: 'La RT 17 establece que todos los costos necesarios para poner el bien en condiciones de comercialización (fletes, seguros de transporte, aranceles) integran el costo de incorporación del activo.'
    },
    {
      question: 'En el sistema de inventario permanente, ¿cuándo se registra el asiento de devengamiento del CMV?',
      options: [
        'Únicamente al cierre del ejercicio contable anual',
        'Al final de cada mes calendario',
        'Simultáneamente con cada operación de venta individual',
        'Cuando se paga al proveedor'
      ],
      correctIndex: 2,
      explanation: 'La característica central del inventario permanente es el reconocimiento inmediato del costo de lo vendido en cada transacción de venta, manteniendo el saldo de stock actualizado en todo momento.'
    }
  ];

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleCheckQuiz = () => {
    let score = 0;
    studyQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera Didáctica */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Tutor Contable Inteligente
          </span>
          <span className="text-xs text-slate-400">
            Sistemas de Información Contable (SIC)
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-400" />
          Modo Estudio: Análisis Contable y Razonamiento Paso a Paso
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">
          Aprende el porqué de cada asiento contable, el desglose de capas consumidas y la igualdad patrimonial por partida doble.
        </p>
      </div>

      {/* Selector de Operación a Analizar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Selecciona una Operación para Auditar:</span>
        </div>

        <select
          value={selectedOperationId}
          onChange={(e) => setSelectedOperationId(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
        >
          {activeExercise.operations.map(op => (
            <option key={op.id} value={op.id}>
              {formatDate(op.date)} - {op.type} ({op.voucherType} Nº {op.voucherNumber}) - {op.counterpart}
            </option>
          ))}
        </select>
      </div>

      {/* Tarjeta de Análisis Exhaustivo en 7 Puntos Contables */}
      {selectedOp ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bloque 1: Resumen Económico y Efecto en Inventario */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              1. Hecho Económico e Impacto en Inventario
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-semibold block text-[11px] uppercase font-mono">¿Qué ocurrió económicamente?</span>
                <p className="leading-relaxed">
                  Se celebró una operación de <strong>{selectedOp.type.replace(/_/g, ' ')}</strong> formalizada mediante <strong>{selectedOp.voucherType} Nº {selectedOp.voucherNumber}</strong> con <strong>{selectedOp.counterpart}</strong>, cancelada mediante <strong>{selectedOp.paymentMethod.replace(/_/g, ' ')}</strong>.
                </p>
                {selectedOp.notes && (
                  <p className="text-[11px] text-slate-400 italic">Observaciones: {selectedOp.notes}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-semibold block text-[11px] uppercase font-mono">¿Cómo afecta a las existencias físicas?</span>
                <p className="leading-relaxed">
                  {selectedOp.type === 'COMPRA' && `Incrementa el activo Mercaderías en ${selectedItem?.quantity} unidades a un costo de adquisición de ${formatCurrency(selectedItem?.unitPrice)} cada una.`}
                  {selectedOp.type === 'VENTA' && `Disminuye el inventario disponible en ${selectedItem?.quantity} unidades. El precio de venta pactado fue ${formatCurrency(selectedItem?.unitPrice)}, mientras que su costo de salida (CMV método ${activeMethod}) fue de ${formatCurrency(kardexRow?.outTotalCost || 0)}.`}
                  {selectedOp.type === 'DEVOLUCION_VENTA' && `Reingresan al stock ${selectedItem?.quantity} unidades devueltas por el cliente, restableciendo la valuación original y reduciendo el CMV del período.`}
                  {selectedOp.type === 'AJUSTE_FALTANTE' && `Reconoce una pérdida física de ${selectedItem?.quantity} unidades constatada en inventario, dando de baja el activo.`}
                </p>
              </div>

              {/* Capas y Cálculo de CMV */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block text-[11px] uppercase font-mono">
                  ¿Cómo se determinó el costo de la operación? (Método: {activeMethod})
                </span>
                
                {kardexRow?.consumedLayers && kardexRow.consumedLayers.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400">Tramos o capas de inventario consumidas:</span>
                    {kardexRow.consumedLayers.map((l, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg font-mono text-[11px]">
                        <span>Tramo {i+1} ({formatDate(l.date)}): {l.quantity} un. a {formatCurrency(l.unitCost)}</span>
                        <span className="font-bold text-rose-300">{formatCurrency(l.subtotal)}</span>
                      </div>
                    ))}
                    <div className="pt-1 flex justify-between items-center font-mono font-bold text-xs text-white border-t border-slate-800">
                      <span>CMV Total Asignado:</span>
                      <span className="text-rose-400">{formatCurrency(kardexRow.outTotalCost)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    Operación de incorporación a costo directo o saldo sin consumo de capas anteriores.
                  </p>
                )}

                {kardexRow?.pppCalculationFormula && (
                  <div className="font-mono text-cyan-300 text-[11px] bg-slate-900 p-2 rounded-lg">
                    {kardexRow.pppCalculationFormula}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloque 2: Razonamiento de Cuentas y Partida Doble */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              2. Asientos Contables y Teoría de las Cuentas
            </h3>

            <div className="space-y-4">
              {associatedEntries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-indigo-300">
                      Asiento Nº {entry.entryNumber}
                    </span>
                    <span className="text-slate-400">{formatDate(entry.date)}</span>
                  </div>

                  <p className="text-xs text-slate-300 italic">
                    {entry.gloss}
                  </p>

                  <div className="space-y-1.5 font-mono text-xs">
                    {entry.lines.map((line) => (
                      <div key={line.id} className="flex justify-between items-center py-1 border-b border-slate-800/40">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-sans">
                            {line.accountType[0]}+
                          </span>
                          <span className={line.debit > 0 ? 'font-semibold text-white font-sans' : 'pl-4 text-slate-300 font-sans'}>
                            {line.debit === 0 && <span className="text-indigo-400 mr-1">a</span>}
                            {line.accountName}
                          </span>
                        </div>
                        <div>
                          {line.debit > 0 ? (
                            <span className="text-blue-300">Debe: {formatCurrency(line.debit)}</span>
                          ) : (
                            <span className="text-emerald-300">Haber: {formatCurrency(line.credit)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fundamentación Teórica de la Partida Doble */}
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-[11px] text-indigo-200 leading-relaxed space-y-1">
                    <strong className="block text-indigo-300">¿Por qué se debita y se acredita cada cuenta?</strong>
                    {entry.gloss.includes('compra') && (
                      <p>
                        Se <strong>debita Mercaderías</strong> (Activo que aumenta) por el costo de incorporación. Se <strong>acredita Proveedores o Caja</strong> (Pasivo que aumenta o Activo que disminuye) como contraprestación pactada.
                      </p>
                    )}
                    {entry.gloss.includes('venta') && !entry.gloss.includes('CMV') && (
                      <p>
                        Se <strong>debita Deudores por Ventas o Caja</strong> (Activo que aumenta) por el derecho de cobro comercial. Se <strong>acredita Ventas de Mercaderías</strong> (Resultado Positivo que aumenta) por el ingreso económico devengado.
                      </p>
                    )}
                    {entry.gloss.includes('CMV') && (
                      <p>
                        Se <strong>debita CMV</strong> (Resultado Negativo que aumenta) para reconocer el sacrificio económico de entregar los bienes. Se <strong>acredita Mercaderías</strong> (Activo que disminuye) para reflejar la baja física del depósito.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 text-sm">
          No hay operaciones para auditar en este ejercicio.
        </div>
      )}

      {/* Bloque 3: Cuestionario Interactivo de Autoevaluación Contable */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              Autoevaluación de Cátedra: Sistemas de Información Contable
            </h3>
            <p className="text-xs text-slate-400">
              Pon a prueba tus conocimientos sobre inventario permanente, métodos de valuación y normas argentinas
            </p>
          </div>
          {quizScore !== null && (
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Resultado: {quizScore} / {studyQuestions.length} correctas
            </span>
          )}
        </div>

        <div className="space-y-4">
          {studyQuestions.map((q, qIdx) => {
            const isAnswered = selectedAnswers[qIdx] !== undefined;
            const isCorrect = isAnswered && selectedAnswers[qIdx] === q.correctIndex;

            return (
              <div key={qIdx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-white">
                  {qIdx + 1}. {q.question}
                </div>

                <div className="space-y-1.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(qIdx, optIdx)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {quizScore !== null && (
                  <div className={`p-2.5 rounded-lg text-xs leading-relaxed border ${
                    isCorrect 
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' 
                      : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                  }`}>
                    <strong>{isCorrect ? '¡Correcto!' : 'Respuesta Incorrecta.'}</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCheckQuiz}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
          >
            Comprobar Respuestas
          </button>
        </div>
      </div>

    </div>
  );
};
