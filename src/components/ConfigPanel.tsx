import React, { useState } from 'react';
import { EAConfig } from '../utils/common';
import { KnapsackItem } from '../data/knapsack';
import { GPOpType, GPOperation } from '../data/gp-ops';
import { Settings, Plus, Trash2 } from 'lucide-react';

interface Props {
  config: EAConfig;
  setConfig: React.Dispatch<React.SetStateAction<EAConfig>>;
  disabled: boolean;
  algo: string;
}

const AVAILABLE_OPS: { type: GPOpType; label: string }[] = [
    { type: 'ADD_1', label: '+ 1' },
    { type: 'SUB_1', label: '- 1' },
    { type: 'SUB_10', label: '- 10' },
    { type: 'DIV_2', label: '/ 2' },
    { type: 'MUL_2', label: '* 2' },
    { type: 'ADD_X', label: '+ x' },
    { type: 'SIN', label: 'sin(val)' },
    { type: 'COS', label: 'cos(val)' },
    { type: 'ADD_CONST', label: '+ 5' },
];

const ConfigPanel: React.FC<Props> = ({ config, setConfig, disabled, algo }) => {
  const [newItemName, setNewItemName] = useState('New');
  const [newItemWeight, setNewItemWeight] = useState(2);
  const [newItemValue, setNewItemValue] = useState(10);
  const [selectedOpType, setSelectedOpType] = useState<GPOpType>('ADD_1');

  const handleChange = (key: keyof EAConfig, value: any) => {
    // When changing GP problem, reset ops to defaults
    if (key === 'gpProblem') {
        const isSine = value === 'Sine';
        setConfig(prev => ({
            ...prev,
            gpProblem: value,
            gpOperations: isSine 
                ? [
                    { id: 0, type: 'ADD_X', label: '+ x' },
                    { id: 1, type: 'ADD_1', label: '+ 1' },
                    { id: 2, type: 'SIN', label: 'sin(val)', isLocked: true },
                    { id: 3, type: 'MUL_2', label: '* 2' }
                  ]
                : [
                    { id: 0, type: 'ADD_1', label: '+ 1' },
                    { id: 1, type: 'SUB_1', label: '- 1' },
                    { id: 2, type: 'SUB_10', label: '- 10' },
                    { id: 3, type: 'DIV_2', label: '/ 2' }
                  ]
        }));
    } else {
        setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const addItem = () => {
    if (config.knapsackItems.length >= 15) return;
    const newItem: KnapsackItem = {
        id: config.knapsackItems.length > 0 ? Math.max(...config.knapsackItems.map(i => i.id)) + 1 : 0,
        name: newItemName,
        weight: newItemWeight,
        value: newItemValue
    };
    setConfig(prev => ({ ...prev, knapsackItems: [...prev.knapsackItems, newItem] }));
  };

  const removeItem = (id: number) => {
    setConfig(prev => ({ ...prev, knapsackItems: prev.knapsackItems.filter(i => i.id !== id) }));
  };

  const addOp = () => {
      if (config.gpOperations.length >= 5) return;
      const opDef = AVAILABLE_OPS.find(o => o.type === selectedOpType);
      if (!opDef) return;
      
      const newOp: GPOperation = {
          id: Date.now(),
          type: opDef.type,
          label: opDef.label
      };
      setConfig(prev => ({ ...prev, gpOperations: [...prev.gpOperations, newOp] }));
  };

  const removeOp = (idx: number) => {
      setConfig(prev => {
          const newOps = [...prev.gpOperations];
          if (newOps[idx].isLocked) return prev; // Cannot delete locked
          newOps.splice(idx, 1);
          return { ...prev, gpOperations: newOps };
      });
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center space-x-2 border-b border-slate-700 pb-2 mb-4">
        <Settings className="text-blue-400 w-5 h-5" />
        <h3 className="text-sm font-bold uppercase text-slate-300">Configuration</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* General Settings */}
        <div className="col-span-2 space-y-2">
            <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>
                {algo === 'ES' ? 'Parent Size (μ)' : 'Population Size'}
            </label>
            <input 
                type="number" 
                value={config.populationSize}
                disabled={disabled}
                onChange={(e) => handleChange('populationSize', parseInt(e.target.value))}
                className={`w-full rounded px-2 py-1 text-sm outline-none ${
                    disabled 
                        ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                        : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                }`}
            />
        </div>
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Genes / Items</label>
            <input 
                type="number" 
                value={algo === 'GA' ? config.knapsackItems.length : config.genesCount}
                disabled={true} 
                title={algo === 'GA' ? "Determined by Item Count" : "Fixed for Sphere/GP"}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-500 cursor-not-allowed"
            />
        </div>
        <div className="space-y-2">
            <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Generations</label>
            <input 
                type="number" 
                value={config.maxGenerations}
                disabled={disabled}
                onChange={(e) => handleChange('maxGenerations', parseInt(e.target.value))}
                className={`w-full rounded px-2 py-1 text-sm outline-none ${
                    disabled 
                        ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                        : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                }`}
            />
        </div>

        {/* Problem Selection for Real-Valued Algos */}
        {(algo === 'DE' || algo === 'PSO' || algo === 'ES') && (
            <div className="space-y-2">
                <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Problem Function</label>
                <div className={`flex p-1 rounded ${disabled ? 'bg-slate-900/50 opacity-50 cursor-not-allowed' : 'bg-slate-900'}`}>
                    {['Sphere', 'Ackley'].map((p) => (
                        <button
                            key={p}
                            onClick={() => handleChange('problemType', p)}
                            disabled={disabled}
                            className={`flex-1 text-xs py-1 rounded transition ${
                                disabled 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : config.problemType === p 
                                        ? 'bg-blue-600 text-white shadow' 
                                        : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* GA/DE/GP Params */}
        {(algo === 'GA' || algo === 'DE' || algo === 'GP') && (
            <>
                <div className="col-span-2 border-t border-slate-700 pt-2 mt-2">
                    <p className={`text-xs mb-2 font-bold ${disabled ? 'text-blue-400/50' : 'text-blue-400'}`}>Evolution Parameters</p>
                </div>
                {algo === 'DE' && (
                    <div className="space-y-2">
                        <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Diff Weight (F)</label>
                        <input 
                            type="number" step="0.1"
                            value={config.F}
                            disabled={disabled}
                            onChange={(e) => handleChange('F', parseFloat(e.target.value))}
                            className={`w-full rounded px-2 py-1 text-sm outline-none ${
                                disabled 
                                    ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                    : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                            }`}
                        />
                    </div>
                )}
                {algo === 'GP' && (
                    <div className="col-span-2 space-y-2">
                        <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>GP Problem</label>
                        <div className={`flex p-1 rounded ${disabled ? 'bg-slate-900/50 opacity-50 cursor-not-allowed' : 'bg-slate-900'}`}>
                            {['Linear', 'Sine'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handleChange('gpProblem', p)}
                                    disabled={disabled}
                                    className={`flex-1 text-xs py-1 rounded transition ${
                                        disabled 
                                            ? 'cursor-not-allowed opacity-50' 
                                            : config.gpProblem === p 
                                                ? 'bg-blue-600 text-white shadow' 
                                                : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Mutation Rate</label>
                    <input 
                        type="number" step="0.05"
                        value={config.mutationRate}
                        disabled={disabled}
                        onChange={(e) => handleChange('mutationRate', parseFloat(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>
                <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Crossover Rate</label>
                    <input 
                        type="number" step="0.1"
                        value={config.crossoverRate}
                        disabled={disabled}
                        onChange={(e) => handleChange('crossoverRate', parseFloat(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>
                {algo === 'GA' && (
                    <div className="space-y-2">
                        <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Tournament Size</label>
                        <input 
                            type="number" 
                            value={config.tournamentSize}
                            disabled={disabled}
                            onChange={(e) => handleChange('tournamentSize', parseInt(e.target.value))}
                            className={`w-full rounded px-2 py-1 text-sm outline-none ${
                                disabled 
                                    ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                    : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                            }`}
                        />
                    </div>
                )}
            </>
        )}

        {/* GP Operation Editor */}
        {algo === 'GP' && (
             <div className="col-span-2 border-t border-slate-700 pt-2 mt-2">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-purple-400 font-bold">GP Operations ({config.gpOperations.length}/5)</p>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto mb-4 border border-slate-800 rounded p-1">
                    {config.gpOperations.map((op, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded text-xs">
                            <span className="font-bold w-6 text-slate-400">{idx+1}.</span>
                            <span className="flex-1 text-slate-300 font-mono">{op.label}</span>
                            {op.isLocked ? (
                                <span className="text-[10px] text-slate-500 uppercase font-bold px-2">Locked</span>
                            ) : (
                                <button 
                                    onClick={() => removeOp(idx)}
                                    disabled={disabled}
                                    className="ml-2 text-red-500 hover:text-red-400 disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Op Form */}
                <div className="bg-slate-900 p-2 rounded border border-slate-700 flex gap-2">
                    <select 
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-1 text-xs text-white outline-none"
                        value={selectedOpType}
                        onChange={e => setSelectedOpType(e.target.value as GPOpType)}
                    >
                        {AVAILABLE_OPS.map(op => (
                            <option key={op.type} value={op.type}>{op.label}</option>
                        ))}
                    </select>
                    <button 
                        onClick={addOp}
                        disabled={disabled || config.gpOperations.length >= 5}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded disabled:opacity-50 flex items-center"
                    >
                        <Plus size={14} className="mr-1"/> Add
                    </button>
                </div>
            </div>
        )}

        {/* PSO Params */}
        {algo === 'PSO' && (
            <>
                <div className="col-span-2 border-t border-slate-700 pt-2 mt-2">
                    <p className={`text-xs mb-2 font-bold ${disabled ? 'text-emerald-400/50' : 'text-emerald-400'}`}>PSO Parameters</p>
                </div>
                <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Inertia (w)</label>
                    <input 
                        type="number" step="0.1"
                        value={config.w}
                        disabled={disabled}
                        onChange={(e) => handleChange('w', parseFloat(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>
                <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Cognitive (c1)</label>
                    <input 
                        type="number" step="0.1"
                        value={config.c1}
                        disabled={disabled}
                        onChange={(e) => handleChange('c1', parseFloat(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>
                <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Social (c2)</label>
                    <input 
                        type="number" step="0.1"
                        value={config.c2}
                        disabled={disabled}
                        onChange={(e) => handleChange('c2', parseFloat(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>
            </>
        )}

        {/* ES Params */}
        {algo === 'ES' && (
            <>
                <div className="col-span-2 border-t border-slate-700 pt-2 mt-2">
                    <p className={`text-xs mb-2 font-bold ${disabled ? 'text-fuchsia-400/50' : 'text-fuchsia-400'}`}>ES Parameters</p>
                </div>
                <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Offspring Size (λ)</label>
                    <input 
                        type="number" 
                        value={config.offspringSize}
                        disabled={disabled}
                        onChange={(e) => handleChange('offspringSize', parseInt(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>
                <div className="space-y-2">
                    <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Sigma</label>
                    <input 
                        type="number" step="0.1"
                        value={config.sigma}
                        disabled={disabled}
                        onChange={(e) => handleChange('sigma', parseFloat(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>
            </>
        )}

        {/* Knapsack Editor */}
        {algo === 'GA' && (
            <div className="col-span-2 border-t border-slate-700 pt-2 mt-2">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-amber-400 font-bold">Knapsack Items ({config.knapsackItems.length}/15)</p>
                </div>
                
                {/* Capacity Input */}
                <div className="mb-4">
                     <label className={`block text-xs font-semibold uppercase ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>Max Capacity</label>
                     <input 
                        type="number" 
                        value={config.knapsackCapacity}
                        disabled={disabled}
                        onChange={(e) => handleChange('knapsackCapacity', parseInt(e.target.value))}
                        className={`w-full rounded px-2 py-1 text-sm outline-none ${
                            disabled 
                                ? 'bg-slate-900/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' 
                                : 'bg-slate-900 border border-slate-700 text-slate-200 focus:border-blue-500'
                        }`}
                    />
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto mb-4 border border-slate-800 rounded p-1">
                    {config.knapsackItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between bg-slate-900 p-2 rounded text-xs">
                            <span className="font-bold w-6 text-slate-400">{idx+1}.</span>
                            <span className="flex-1 text-slate-300 font-mono">{item.name}</span>
                            <span className="text-slate-500 w-12 text-right">W:{item.weight}</span>
                            <span className="text-emerald-500 w-12 text-right">${item.value}</span>
                            <button 
                                onClick={() => removeItem(item.id)}
                                disabled={disabled}
                                className="ml-2 text-red-500 hover:text-red-400 disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Item Form */}
                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                    <p className="text-[10px] uppercase text-slate-500 mb-2">Add New Item</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <input 
                            type="text" placeholder="Name" 
                            className="bg-slate-800 border border-slate-700 rounded px-1 text-xs text-white"
                            value={newItemName} onChange={e => setNewItemName(e.target.value)}
                        />
                        <input 
                            type="number" placeholder="W" 
                            className="bg-slate-800 border border-slate-700 rounded px-1 text-xs text-white"
                            value={newItemWeight} onChange={e => setNewItemWeight(parseInt(e.target.value) || 0)}
                        />
                        <input 
                            type="number" placeholder="Val" 
                            className="bg-slate-800 border border-slate-700 rounded px-1 text-xs text-white"
                            value={newItemValue} onChange={e => setNewItemValue(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <button 
                        onClick={addItem}
                        disabled={disabled || config.knapsackItems.length >= 15}
                        className="w-full flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded disabled:opacity-50"
                    >
                        <Plus size={14} /> <span>Add Item</span>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;