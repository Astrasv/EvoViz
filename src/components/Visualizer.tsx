import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, ReferenceLine } from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Individual, EAConfig } from '../utils/common';
import { evaluateGP } from '../utils/functions';
import ThreeDScatter from './ThreeDScatter';

interface HistoryPoint {
  generation: number;
  bestFitness: number;
  avgFitness: number;
}

interface Props {
  history: HistoryPoint[];
  currentPop: Individual[];
  algo: string;
  config: EAConfig;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

const Visualizer: React.FC<Props> = ({ history, currentPop, algo, config, isMaximized = false, onToggleMaximize }) => {
  const isKnapsack = algo === 'GA';
  const isGPSine = algo === 'GP' && config.gpProblem === 'Sine';
  
  const scatterData = useMemo(() => {
    if (isKnapsack) {
        return currentPop.map(p => {
            let totalWeight = 0;
            let totalValue = 0;
            p.genes.forEach((g, i) => {
                if (g === 1 && config.knapsackItems[i]) {
                    totalWeight += config.knapsackItems[i].weight;
                    totalValue += config.knapsackItems[i].value;
                }
            });
            return {
                x: totalWeight,
                y: totalValue,
                z: p.fitness,
                id: p.id,
                isValid: totalWeight <= config.knapsackCapacity
            };
        });
    }

    return currentPop.map(p => ({ 
        x: p.genes[0], 
        y: p.genes[1], 
        z: p.fitness,
        id: p.id
    }));
  }, [currentPop, isKnapsack, config]);

  // Generate sine wave data for GP Sine
  const sineData = useMemo(() => {
      if (!isGPSine) return [];
      
      const bestInd = [...currentPop].sort((a,b) => a.fitness - b.fitness)[0];
      const data = [];
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * 2 * Math.PI;
          data.push({
              x: parseFloat(x.toFixed(2)),
              target: parseFloat(Math.sin(x).toFixed(2)),
              best: bestInd ? parseFloat(evaluateGP(bestInd.genes, x, config).toFixed(2)) : 0
          });
      }
      return data;
  }, [currentPop, isGPSine, config]);

  const isRealValued = !isKnapsack && !isGPSine;

  const heightClass = isMaximized ? 'h-[40vh]' : 'h-64';

  return (
    <div className="relative">
        {onToggleMaximize && (
            <button 
                onClick={onToggleMaximize}
                className="absolute -top-3 -right-3 z-10 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full shadow-lg border border-slate-500 transition-all"
                title={isMaximized ? "Minimize" : "Maximize"}
            >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
        )}
        
        <div className={`flex flex-col lg:grid ${isRealValued ? (isMaximized ? 'grid-cols-2' : 'xl:grid-cols-3 lg:grid-cols-2') : 'lg:grid-cols-2'} gap-4 w-full`}>
        {/* Fitness History */}
        <div className={`bg-slate-800/50 p-4 rounded-lg border border-slate-700 ${heightClass}`}>
            <h3 className="text-xs uppercase text-slate-400 mb-2">
                {isKnapsack ? 'Value History (Higher is Better)' : 'Error History (Lower is Better)'}
            </h3>
            <div style={{ width: '100%', height: '85%' }}>
            <ResponsiveContainer>
                <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="generation" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="bestFitness" name="Best" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avgFitness" name="Avg" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className={`bg-slate-800/50 p-4 rounded-lg border border-slate-700 ${heightClass}`}>
            <h3 className="text-xs uppercase text-slate-400 mb-2">
                {isGPSine ? 'Function Fit (Target vs Best)' : (isKnapsack ? 'Knapsack State (Weight vs Value)' : '2D Projection (Gene 0 vs Gene 1)')}
            </h3>
            <div style={{ width: '100%', height: '85%' }}>
            <ResponsiveContainer>
                {isGPSine ? (
                    <LineChart data={sineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="x" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} domain={[-2, 2]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                        <Line type="monotone" dataKey="target" name="Target (sin)" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="best" name="Best Evolved" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                ) : (
                    <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                        type="number" dataKey="x" 
                        name={isKnapsack ? "Total Weight" : "Gene 0"} 
                        stroke="#94a3b8" 
                        domain={isKnapsack ? [0, 'auto'] : [-6, 6]} 
                        allowDecimals={true} 
                        label={isKnapsack ? { value: 'Total Weight', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 } : undefined}
                    />
                    <YAxis 
                        type="number" dataKey="y" 
                        name={isKnapsack ? "Total Value" : "Gene 1"} 
                        stroke="#94a3b8" 
                        domain={isKnapsack ? [0, 'auto'] : [-6, 6]} 
                        allowDecimals={true} 
                        label={isKnapsack ? { value: 'Total Value', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 } : undefined}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                    {isKnapsack && (
                        <ReferenceLine x={config.knapsackCapacity} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Max Cap', fill: '#ef4444', position: 'insideTopRight', fontSize: 10 }} />
                    )}
                    <Scatter name="Population" data={scatterData} fill="#f472b6">
                        {scatterData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={isKnapsack ? (entry.x <= config.knapsackCapacity ? '#10b981' : '#ef4444') : '#f472b6'} />
                        ))}
                    </Scatter>
                    </ScatterChart>
                )}
            </ResponsiveContainer>
            </div>
        </div>

        {/* 3D Scatter (Only for Real Valued) */}
        {isRealValued && (
            <div className={`${isMaximized ? 'col-span-2 h-[60vh]' : 'h-64'}`}>
                <ThreeDScatter 
                    points={scatterData.map(d => ({ x: d.x, y: d.y, z: d.z, color: '#f472b6' }))} 
                    range={5} 
                    title={`3D ${config.problemType || 'Sphere'} Landscape (Drag to Rotate)`}
                    functionType={config.problemType}
                />
            </div>
        )}
        </div>
    </div>
  );
};

export default Visualizer;