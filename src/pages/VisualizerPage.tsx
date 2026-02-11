import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Population, EAConfig, DEFAULT_CONFIG } from '../utils/common';
import { StepLog } from '../utils/internal-algo-logs';
import { initGA, stepGA } from '../algorithms/ga';
import { initDE, stepDE } from '../algorithms/de';
import { initPSO, stepPSO } from '../algorithms/pso';
import { initGP, stepGP } from '../algorithms/gp';
import { initES, stepES } from '../algorithms/es';
import PopulationTable from '../components/PopulationTable';
import Visualizer from '../components/Visualizer';
import ConfigPanel from '../components/ConfigPanel';
import StepLogView from '../components/StepLogView';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/Evo-Viz-Logo.png';

type Algorithm = 'GA' | 'DE' | 'PSO' | 'GP' | 'ES';

const VisualizerPage: React.FC = () => {
    const { algo: algoParam } = useParams<{ algo: string }>();
    const navigate = useNavigate();
    
    // Validate algo param
    const validAlgos: Algorithm[] = ['GA', 'DE', 'PSO', 'GP', 'ES'];
    const algo = (validAlgos.find(a => a === algoParam?.toUpperCase()) || 'GA') as Algorithm;

    // Redirect if param was invalid (optional, but keeps URL clean)
    useEffect(() => {
        if (algoParam?.toUpperCase() !== algo) {
            navigate(`/visualizer/${algo.toLowerCase()}`, { replace: true });
        }
    }, [algoParam, algo, navigate]);

    const [config, setConfig] = useState<EAConfig>(DEFAULT_CONFIG);
    const [pop, setPop] = useState<Population>([]);
    const [gen, setGen] = useState(0);
    const [history, setHistory] = useState<{ generation: number, bestFitness: number, avgFitness: number }[]>([]);
    const [running, setRunning] = useState(false);
    const [stepLogs, setStepLogs] = useState<StepLog>([]);
    const [errorHistoryMaximized, setErrorHistoryMaximized] = useState(false);
    const [scatter2DMaximized, setScatter2DMaximized] = useState(false);
    const [scatter3DMaximized, setScatter3DMaximized] = useState(false);

    // Enforce 2D genome for algorithms using 3D visualization to match plot dimensions
    useEffect(() => {
        setConfig(prev => {
            const is3DViz = algo === 'DE' || algo === 'PSO' || algo === 'ES' || (algo === 'GP' && prev.gpProblem === 'Linear');
            
            let targetGenes = prev.genesCount;
            if (is3DViz) {
                targetGenes = 2;
            } else if (algo === 'GP' && prev.gpProblem === 'Sine') {
                targetGenes = 5;
            }
            
            if (prev.genesCount !== targetGenes) {
                return { ...prev, genesCount: targetGenes };
            }
            return prev;
        });
    }, [algo, config.gpProblem]);

    // Initialize function
    const reset = useCallback(() => {
        let initialPop: Population = [];

        if (algo === 'GA') initialPop = initGA(config);
        if (algo === 'DE') initialPop = initDE(config);
        if (algo === 'PSO') initialPop = initPSO(config);
        if (algo === 'GP') initialPop = initGP(config);
        if (algo === 'ES') initialPop = initES(config);

        setPop(initialPop);
        setGen(0);

        const fits = initialPop.map(p => p.fitness);
        const best = algo === 'GA' ? Math.max(...fits) : Math.min(...fits);
        const avg = fits.reduce((a, b) => a + b, 0) / fits.length;

        setHistory([{
            generation: 0,
            bestFitness: best,
            avgFitness: avg
        }]);
        setStepLogs([]);
        setRunning(false);
    }, [algo, config]);

    // Initial load & when algo changes
    useEffect(() => {
        reset();
    }, [reset]);

    const step = useCallback(() => {
        if (gen >= config.maxGenerations) {
            setRunning(false);
            return;
        }

        setPop(prev => {
            let result: { nextPop: Population; logs: StepLog } = { nextPop: [], logs: [] };

            if (algo === 'GA') result = stepGA(prev, config);
            else if (algo === 'DE') result = stepDE(prev, config);
            else if (algo === 'PSO') result = stepPSO(prev, config);
            else if (algo === 'GP') result = stepGP(prev, config);
            else if (algo === 'ES') result = stepES(prev, config);

            const { nextPop, logs } = result;

            const fits = nextPop.map(p => p.fitness);
            const best = algo === 'GA' ? Math.max(...fits) : Math.min(...fits);
            const avg = fits.reduce((a, b) => a + b, 0) / fits.length;

            setHistory(h => {
                if (h.length > 0 && h[h.length - 1].generation === gen + 1) return h;
                return [...h, { generation: gen + 1, bestFitness: best, avgFitness: avg }];
            });

            setStepLogs(logs);
            return nextPop;
        });
        setGen(g => g + 1);
    }, [algo, gen, config]);

    useEffect(() => {
        let interval: any;
        if (running && gen < config.maxGenerations) {
            interval = setInterval(step, 800);
        } else if (gen >= config.maxGenerations) {
            setRunning(false);
        }
        return () => clearInterval(interval);
    }, [running, gen, step, config.maxGenerations]);

    // Handle completion
    useEffect(() => {
        if (gen > 0 && gen >= config.maxGenerations) {
            const timer = setTimeout(() => {
                alert("Simulation Finished!");
                reset();
                navigate(`/visualizer/${algo.toLowerCase()}`, { replace: true });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [gen, config.maxGenerations, algo, navigate, reset]);

    const handleAlgoChange = (newAlgo: Algorithm) => {
        navigate(`/visualizer/${newAlgo.toLowerCase()}`);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
            <header className="mb-8 py-6 px-6 relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]"></div>
                 </div>

                 <div className="relative z-10 flex items-center gap-6">
                    <Link to="/" className="group p-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all">
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </Link>
                    <div>
                        <img src={logo} alt="EvoViz" className="h-8 md:h-12 mb-1" />
                        <p className="text-slate-500 text-sm">Algorithm Visualization Engine</p>
                    </div>
                 </div>

                 {/* Navigation Tabs */}
                 <div className="relative z-10 flex flex-wrap justify-center gap-2">
                    {validAlgos.map(a => (
                        <button
                            key={a}
                            onClick={() => handleAlgoChange(a)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                algo === a 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                        >
                            {a}
                        </button>
                    ))}
                 </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Left Column: Controls & Configuration */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg xl:sticky xl:top-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm uppercase tracking-wider text-slate-400">Control Panel</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${gen >= config.maxGenerations ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                                Gen: {gen} / {config.maxGenerations}
                            </span>
                        </div>

                        <div className="flex space-x-2 mb-6">
                            <button
                                onClick={() => setRunning(!running)}
                                disabled={gen >= config.maxGenerations}
                                className={`flex-1 py-2 rounded-lg font-bold transition text-sm ${running ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {running ? 'Pause' : 'Start'}
                            </button>
                            <button
                                onClick={step}
                                disabled={running || gen >= config.maxGenerations}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold disabled:opacity-50 text-sm"
                            >
                                Step
                            </button>
                            <button
                                onClick={reset}
                                className="px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg font-semibold border border-red-800 text-sm"
                            >
                                Reset
                            </button>
                        </div>

                        <ConfigPanel config={config} setConfig={setConfig} disabled={running || (gen > 0 && gen < config.maxGenerations)} algo={algo} />

                        {/* Problem Context Info */}
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Problem Context</h4>
                            {algo === 'GA' && (
                                <div className="text-xs space-y-1">
                                    <p className="text-amber-400 font-semibold">Knapsack Problem</p>
                                    <p className="text-slate-400">Capacity: {config.knapsackCapacity}</p>
                                    <p className="text-slate-500 mt-2 italic">See item list in configuration above.</p>
                                </div>
                            )}
                            {(algo === 'DE' || algo === 'PSO' || algo === 'ES') && (
                                <div className="text-xs space-y-1">
                                    {algo === 'ES' && <p className="text-fuchsia-400 font-semibold">Evolution Strategy (ES)</p>}
                                    {algo === 'PSO' && <p className="text-emerald-400 font-semibold">Particle Swarm (PSO)</p>}
                                    {algo === 'DE' && <p className="text-blue-400 font-semibold">Differential Evolution (DE)</p>}
                                    
                                    <p className="text-white font-bold mt-2">{config.problemType || 'Sphere'} Function</p>
                                    
                                    {(!config.problemType || config.problemType === 'Sphere') ? (
                                        <p className="text-slate-400">Minimize f(x) = &sum; x&sup2;</p>
                                    ) : (
                                        <p className="text-slate-400">Min Ackley (Multi-modal)</p>
                                    )}
                                    <p className="text-slate-400">Range: [-5, 5]</p>
                                    <p className="text-slate-400">Target: 0</p>
                                </div>
                            )}
                            {algo === 'GP' && (
                                <div className="text-xs space-y-1">
                                    <p className="text-purple-400 font-semibold">Linear GP</p>
                                    {config.gpProblem === 'Linear' ? (
                                        <>
                                            <p className="text-slate-400">Find ops to reach 0 from 50.</p>
                                            <p className="text-slate-400">Ops: +1, -1, -10, /2</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-slate-400">Find f(x) to match sin(x).</p>
                                            <p className="text-slate-400">Ops: +x, +1, sin, *2</p>
                                            <p className="text-slate-400">Register Start: 0</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Visualization & Data */}
                <div className="xl:col-span-3 space-y-6">
                    <Visualizer 
                        history={history} 
                        currentPop={pop} 
                        algo={algo} 
                        config={config} 
                        errorHistoryMaximized={errorHistoryMaximized}
                        scatter2DMaximized={scatter2DMaximized}
                        scatter3DMaximized={scatter3DMaximized}
                        onToggleErrorHistory={() => {
                            const newState = !errorHistoryMaximized;
                            setErrorHistoryMaximized(newState);
                            // Only minimize others if expanding this one
                            if (newState) {
                                setScatter2DMaximized(false);
                                setScatter3DMaximized(false);
                            }
                        }}
                        onToggleScatter2D={() => {
                            const newState = !scatter2DMaximized;
                            setScatter2DMaximized(newState);
                            // Only minimize others if expanding this one
                            if (newState) {
                                setErrorHistoryMaximized(false);
                                setScatter3DMaximized(false);
                            }
                        }}
                        onToggleScatter3D={() => {
                            const newState = !scatter3DMaximized;
                            setScatter3DMaximized(newState);
                            // Only minimize others if expanding this one
                            if (newState) {
                                setErrorHistoryMaximized(false);
                                setScatter2DMaximized(false);
                            }
                        }}
                    />
                    {!errorHistoryMaximized && !scatter2DMaximized && !scatter3DMaximized && (
                        <>
                            <PopulationTable
                                population={pop}
                                algo={algo}
                                knapsackItems={config.knapsackItems}
                                knapsackCapacity={config.knapsackCapacity}
                                config={config}
                            />
                            <StepLogView logs={stepLogs} algo={algo} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualizerPage;
