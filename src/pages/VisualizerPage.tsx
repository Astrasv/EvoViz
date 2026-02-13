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
import logo from '../assets/Evo-Viz-Logo.png';

type Algorithm = 'GA' | 'DE' | 'PSO' | 'GP' | 'ES';

const VisualizerPage: React.FC = () => {
    const { algo: algoParam } = useParams<{ algo: string }>();
    const navigate = useNavigate();
    
    // Validate algo param
    const validAlgos: Algorithm[] = ['GA', 'DE', 'PSO', 'GP', 'ES'];
    const algo = (validAlgos.find(a => a === algoParam?.toUpperCase()) || 'GA') as Algorithm;

    // Scroll to top when component mounts or algo changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [algo]);

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

    // Handle completion - auto-stop when reaching max generations
    useEffect(() => {
        if (gen >= config.maxGenerations && running) {
            setRunning(false);
        }
    }, [gen, config.maxGenerations, running]);

    const handleAlgoChange = (newAlgo: Algorithm) => {
        navigate(`/visualizer/${newAlgo.toLowerCase()}`);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
            <header className="mb-8 py-0.5 px-4 relative overflow-visible rounded-3xl border border-white/5 bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-2">
                 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-3xl">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]"></div>
                 </div>

                 {/* Left: Logo */}
                 <div className="relative z-10 order-1 md:order-none flex items-center -my-1">
                    <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity block">
                        <img src={logo} alt="EvoViz" className="h-20 md:h-28 block" />
                    </Link>
                 </div>

                 {/* Center: Title */}
                 <div className="relative z-10 w-full md:flex-1 flex items-center justify-center order-2 md:order-none">
                    <p className="text-slate-300 text-lg md:text-xl font-bold text-center">Algorithm Visualization Engine</p>
                 </div>

                 {/* Right: Navigation Tabs */}
                 <div className="relative z-10 flex flex-wrap justify-center gap-2 order-3 md:order-none">
                    {validAlgos.map((a, index) => {
                        const algoNames: Record<Algorithm, string> = {
                            'GA': 'Genetic Algorithm',
                            'DE': 'Differential Evolution',
                            'PSO': 'Particle Swarm Optimization',
                            'GP': 'Genetic Programming',
                            'ES': 'Evolution Strategies'
                        };
                        // Show tooltip above for last 2 buttons (GP, ES) to prevent overflow
                        const showTooltipAbove = index >= 3;
                        return (
                            <button
                                key={a}
                                onClick={() => handleAlgoChange(a)}
                                title={algoNames[a]}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all relative group ${
                                    algo === a 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                }`}
                            >
                                {a}
                                <span className={`absolute ${showTooltipAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-slate-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-slate-700 shadow-lg z-50`}>
                                    {algoNames[a]}
                                </span>
                            </button>
                        );
                    })}
                 </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Left Column: Controls & Configuration */}
                <div className="xl:col-span-1">
                    <div className="xl:sticky xl:top-4 space-y-6">
                        {/* Problem Context - Separate Section */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                            <h4 className="text-sm font-bold uppercase text-slate-300 mb-4">Problem Context</h4>
                            {algo === 'GA' && (
                                <div className="text-sm space-y-2">
                                    <p className="text-amber-400 font-semibold text-base">Knapsack Problem</p>
                                    <p className="text-slate-300">Capacity: <span className="text-amber-400 font-semibold">{config.knapsackCapacity}</span></p>
                                    <p className="text-slate-400 mt-3 italic text-xs">See item list in configuration above.</p>
                                </div>
                            )}
                            {(algo === 'DE' || algo === 'PSO' || algo === 'ES') && (
                                <div className="text-sm space-y-2">
                                    {algo === 'ES' && <p className="text-fuchsia-400 font-semibold text-base">Evolution Strategy (ES)</p>}
                                    {algo === 'PSO' && <p className="text-emerald-400 font-semibold text-base">Particle Swarm (PSO)</p>}
                                    {algo === 'DE' && <p className="text-blue-400 font-semibold text-base">Differential Evolution (DE)</p>}
                                    
                                    <p className="text-white font-bold mt-3 text-base">{config.problemType || 'Sphere'} Function</p>
                                    
                                    {(!config.problemType || config.problemType === 'Sphere') ? (
                                        <p className="text-slate-300">Minimize <span className="font-mono text-blue-400">f(x) = Σ x²</span></p>
                                    ) : (
                                        <p className="text-slate-300">Min Ackley <span className="text-slate-400">(Multi-modal)</span></p>
                                    )}
                                    <p className="text-slate-300">Range: <span className="text-emerald-400">[-5, 5]</span></p>
                                    <p className="text-slate-300">Target: <span className="text-emerald-400 font-semibold">0</span></p>
                                </div>
                            )}
                            {algo === 'GP' && (
                                <div className="text-sm space-y-2">
                                    <p className="text-purple-400 font-semibold text-base">Genetic Programming</p>
                                    {config.gpProblem === 'Linear' ? (
                                        <>
                                            <p className="text-slate-300">Find ops to reach <span className="text-purple-400 font-semibold">0</span> from <span className="text-purple-400 font-semibold">50</span>.</p>
                                            <p className="text-slate-300">Ops: <span className="font-mono text-blue-400">+1, -1, -10, /2</span></p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-slate-300">Find <span className="font-mono text-purple-400">f(x)</span> to match <span className="font-mono text-purple-400">sin(x)</span>.</p>
                                            <p className="text-slate-300">Ops: <span className="font-mono text-blue-400">+x, +1, sin, *2</span></p>
                                            <p className="text-slate-300">Register Start: <span className="text-purple-400 font-semibold">0</span></p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm uppercase tracking-wider text-slate-400">Control Panel</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${gen >= config.maxGenerations ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                                Gen: {gen} / {config.maxGenerations}
                            </span>
                        </div>

                        <div className="flex space-x-2 mb-6">
                            <button
                                onClick={() => {
                                    if (gen >= config.maxGenerations) {
                                        reset();
                                    } else {
                                        setRunning(!running);
                                    }
                                }}
                                className={`flex-1 py-2 rounded-lg font-bold transition text-sm ${
                                    gen >= config.maxGenerations 
                                        ? 'bg-blue-600 hover:bg-blue-500' 
                                        : running 
                                            ? 'bg-amber-600 hover:bg-amber-500' 
                                            : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                            >
                                {gen >= config.maxGenerations ? 'Finish' : running ? 'Pause' : 'Start'}
                            </button>
                            <button
                                onClick={step}
                                disabled={running || gen >= config.maxGenerations}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

                        <ConfigPanel config={config} setConfig={setConfig} disabled={running || gen > 0} algo={algo} />
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
