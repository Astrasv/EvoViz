import { DEFAULT_CONFIG, Population, EAConfig } from './utils/common';
import { initGA, stepGA } from './algorithms/ga';
import { initDE, stepDE } from './algorithms/de';
import { initES, stepES } from './algorithms/es';
import { initPSO, stepPSO } from './algorithms/pso';
import { initGP, stepGP } from './algorithms/gp';

import { StepLog } from './utils/internal-algo-logs';

type AlgoInit = (config: EAConfig) => Population;
type AlgoStep = (pop: Population, config: EAConfig) => { nextPop: Population; logs: StepLog };

interface AlgoRunner {
    name: string;
    init: AlgoInit;
    step: AlgoStep;
}

const formatValue = (val: any): string => {
    if (Array.isArray(val)) {
        return `[${val.map(v => typeof v === 'number' ? Number(v).toFixed(2) : v).join(', ')}]`;
    }
    if (typeof val === 'number') {
        return Number(val).toFixed(4);
    }
    if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
    }
    return String(val);
};

const printTable = (data: any[]) => {
    if (data.length === 0) return;

    // format data for console.table
    const formattedData = data.map(row => {
        const newRow: any = {};
        for (const key in row) {
            newRow[key] = formatValue(row[key]);
        }
        return newRow;
    });

    console.table(formattedData);
};

const runAlgo = (runner: AlgoRunner, config: EAConfig) => {
    console.log(`\n========================================`);
    console.log(`Running Algorithm: ${runner.name}`);
    console.log(`========================================\n`);

    let population = runner.init(config);
    console.log(`Initial Population (Size: ${population.length}):`);
    const initialSummary = population.map(p => ({
        id: p.id,
        fitness: p.fitness,
        genes: p.genes
    }));
    printTable(initialSummary);

    for (let gen = 1; gen <= config.maxGenerations; gen++) {
        console.log(`\n--- Generation ${gen} ---`);
        
        const result = runner.step(population, config);
        population = result.nextPop;
        const logs = result.logs;

        console.log(`Logs for Generation ${gen}:`);
        printTable(logs);

        // Calculate and print stats
        const best = population.reduce((prev, current) => (prev.fitness > current.fitness) ? prev : current);
        console.log(`Gen ${gen} Best Fitness: ${best.fitness.toFixed(4)}`);
    }

    console.log(`\n${runner.name} Finished.`);
    const finalBest = population.reduce((prev, current) => (prev.fitness > current.fitness) ? prev : current);
    console.log(`Final Best Individual: ID ${finalBest.id}, Fitness ${finalBest.fitness.toFixed(4)}`);
    console.log(`Genes: ${formatValue(finalBest.genes)}`);
};

const main = () => {
    const algorithms: AlgoRunner[] = [
        { name: 'Genetic Algorithm (GA)', init: initGA, step: stepGA },
        { name: 'Differential Evolution (DE)', init: initDE, step: stepDE },
        { name: 'Evolution Strategy (ES)', init: initES, step: stepES },
        { name: 'Particle Swarm Optimization (PSO)', init: initPSO, step: stepPSO },
        { name: 'Genetic Programming (GP)', init: initGP, step: stepGP },
    ];


    const config = { ...DEFAULT_CONFIG };

    algorithms.forEach(algo => {
        try {
            runAlgo(algo, config);
        } catch (error) {
            console.error(`Error running ${algo.name}:`, error);
        }
    });
};

main();
