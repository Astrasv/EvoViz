import React from 'react';
import { StepLog, GALogEntry, DELogEntry, PSOLogEntry, GPLogEntry, ESLogEntry } from '../utils/internal-algo-logs';

interface Props {
  logs: StepLog;
  algo: string;
}

const StepLogView: React.FC<Props> = ({ logs, algo }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mt-6 overflow-x-auto">
      <h3 className="text-sm font-bold uppercase text-slate-300 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Generation Step Details
      </h3>
      
      {algo === 'GA' && logs[0] && 'crossoverPoint' in logs[0] && <GALogTable logs={logs as GALogEntry[]} />}
      {algo === 'DE' && logs[0] && 'targetId' in logs[0] && <DELogTable logs={logs as DELogEntry[]} />}
      {algo === 'PSO' && logs[0] && 'inertiaTerm' in logs[0] && <PSOLogTable logs={logs as PSOLogEntry[]} />}
      {algo === 'GP' && logs[0] && 'expressionBefore' in logs[0] && <GPLogTable logs={logs as GPLogEntry[]} />}
      {algo === 'ES' && logs[0] && 'noiseVector' in logs[0] && <ESLogTable logs={logs as ESLogEntry[]} />}
    </div>
  );
};

const GALogTable: React.FC<{logs: GALogEntry[]}> = ({ logs }) => (
    <table className="w-full text-xs text-left text-slate-300 font-mono">
        <thead className="bg-slate-900 text-slate-500 uppercase">
            <tr>
                <th className="px-3 py-2">Child ID</th>
                <th className="px-3 py-2">Parents</th>
                <th className="px-3 py-2">Cut</th>
                <th className="px-3 py-2">Pre-Mut</th>
                <th className="px-3 py-2">Mut Idx</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">Status</th>
            </tr>
        </thead>
        <tbody>
            {logs.map((log, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-blue-400">#{log.id + 1}</td>
                    <td className="px-3 py-2">
                        {log.parents ? `P${log.parents[0]+1} + P${log.parents[1]+1}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-amber-500">{log.crossoverPoint}</td>
                    <td className="px-3 py-2 text-slate-500">[{log.preMutation.join('')}]</td>
                    <td className="px-3 py-2 text-red-400">{log.mutationIndex !== null ? log.mutationIndex : '-'}</td>
                    <td className="px-3 py-2 text-emerald-400 font-bold">[{log.final.join('')}]</td>
                    <td className="px-3 py-2">
                        {log.isValid ? (
                            <span className="text-green-500">Valid (W:{log.weight})</span>
                        ) : (
                            <span className="text-red-500">Overload (W:{log.weight})</span>
                        )}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const DELogTable: React.FC<{logs: DELogEntry[]}> = ({ logs }) => (
    <table className="w-full text-xs text-left text-slate-300 font-mono">
        <thead className="bg-slate-900 text-slate-500 uppercase">
            <tr>
                <th className="px-3 py-2">Target (Fi)</th>
                <th className="px-3 py-2">Mutant (Vi)</th>
                <th className="px-3 py-2">Trial (Ui)</th>
                <th className="px-3 py-2">Fitness (Fi vs Ui)</th>
                <th className="px-3 py-2">Result</th>
            </tr>
        </thead>
        <tbody>
            {logs.map((log, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2">
                        <div className="text-blue-400">#{(log.targetId + 1)}</div>
                        <div className="text-[10px] text-slate-500">Fit: {log.targetFitness.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-2">
                         <div className="text-amber-500">[{log.mutantVector.map(x=>x.toFixed(1)).join(',')}]</div>
                         <div className="text-[10px] text-slate-400">Fit: {log.mutantFitness.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-2">
                         <div className="text-slate-200">[{log.trialVector.map(x=>x.toFixed(1)).join(',')}]</div>
                         <div className="text-[10px] text-slate-400">Fit: {log.trialFitness.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-2">
                        <div className={`font-bold ${log.replacesTarget ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {log.trialFitness.toFixed(2)} &le; {log.targetFitness.toFixed(2)}
                        </div>
                    </td>
                    <td className="px-3 py-2 font-bold">
                        {log.replacesTarget ? <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded">REPLACE</span> : <span className="text-slate-600">KEEP</span>}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const PSOLogTable: React.FC<{logs: PSOLogEntry[]}> = ({ logs }) => (
    <table className="w-full text-xs text-left text-slate-300 font-mono">
        <thead className="bg-slate-900 text-slate-500 uppercase">
            <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Vel Calc (In + Co + So)</th>
                <th className="px-3 py-2">New Vel</th>
                <th className="px-3 py-2">New Pos</th>
            </tr>
        </thead>
        <tbody>
            {logs.map((log, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-blue-400">#{log.id + 1}</td>
                    <td className="px-3 py-2 text-slate-400">
                        In[{log.inertiaTerm[0]}] + Co[{log.cognitiveTerm[0]}] + So[{log.socialTerm[0]}]
                    </td>
                    <td className="px-3 py-2 text-amber-500">[{log.newVelocity.join(',')}]</td>
                    <td className="px-3 py-2 text-emerald-400 font-bold">[{log.newPosition.map(p => p.toFixed(1)).join(',')}]</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const GPLogTable: React.FC<{logs: GPLogEntry[]}> = ({ logs }) => (
     <table className="w-full text-xs text-left text-slate-300 font-mono">
        <thead className="bg-slate-900 text-slate-500 uppercase">
            <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Parents</th>
                 <th className="px-3 py-2">Cut</th>
                <th className="px-3 py-2">Expression Before</th>
                <th className="px-3 py-2">Mut Idx</th>
                <th className="px-3 py-2">Expression After</th>
            </tr>
        </thead>
        <tbody>
            {logs.map((log, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-blue-400">#{log.id + 1}</td>
                    <td className="px-3 py-2">
                        {log.parents ? `P${log.parents[0]+1} + P${log.parents[1]+1}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-amber-500">{log.crossoverPoint}</td>
                    <td className="px-3 py-2 text-slate-500 truncate max-w-[150px]" title={log.expressionBefore}>{log.expressionBefore}</td>
                    <td className="px-3 py-2 text-red-400">{log.mutationIndex !== null ? log.mutationIndex : '-'}</td>
                    <td className="px-3 py-2 text-emerald-400 font-bold truncate max-w-[150px]" title={log.expressionAfter}>{log.expressionAfter}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const ESLogTable: React.FC<{logs: ESLogEntry[]}> = ({ logs }) => (
    <table className="w-full text-xs text-left text-slate-300 font-mono">
       <thead className="bg-slate-900 text-slate-500 uppercase">
           <tr>
               <th className="px-3 py-2">Parent (Fit)</th>
               <th className="px-3 py-2">Noise (Sigma)</th>
               <th className="px-3 py-2">Child (Fit)</th>
               <th className="px-3 py-2">Survival</th>
           </tr>
       </thead>
       <tbody>
           {logs.map((log, i) => (
               <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                   <td className="px-3 py-2">
                       <div className="text-blue-400">P#{log.parentId + 1}</div>
                       <div className={`text-[10px] ${log.isParentSurvivor ? 'text-green-400 font-bold' : 'text-slate-500'}`}>Fit: {log.parentFitness.toFixed(2)}</div>
                   </td>
                   <td className="px-3 py-2 text-amber-500 truncate max-w-[100px]" title={log.noiseVector.join(', ')}>
                       [{log.noiseVector.map(x=>x.toFixed(1)).join(',')}]
                   </td>
                   <td className="px-3 py-2">
                        <div className="text-fuchsia-400">C#{log.id + 1}</div>
                        <div className="text-[10px] text-slate-400">[{log.childGenes.map(g => g.toFixed(1)).join(',')}]</div>
                        <div className={`text-[10px] ${log.isChildSurvivor ? 'text-green-400 font-bold' : 'text-slate-500'}`}>Fit: {log.childFitness.toFixed(2)}</div>
                   </td>
                   <td className="px-3 py-2">
                        {log.isParentSurvivor && log.isChildSurvivor && <span className="text-emerald-400 font-bold">Both Kept</span>}
                        {log.isParentSurvivor && !log.isChildSurvivor && <span className="text-blue-400">Parent Kept</span>}
                        {!log.isParentSurvivor && log.isChildSurvivor && <span className="text-green-500 font-bold">Child Kept</span>}
                        {!log.isParentSurvivor && !log.isChildSurvivor && <span className="text-red-500/50">Discarded</span>}
                   </td>
               </tr>
           ))}
       </tbody>
   </table>
);

export default StepLogView;
