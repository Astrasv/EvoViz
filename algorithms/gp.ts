
import { EAConfig, Individual, Population } from "../utils/common";
import { randomInt, evaluateGP  } from "../utils/functions";
import { GPLogEntry, StepLog } from "../utils/internal-algo-logs";


export const decodeGP = (genes: number[], config: EAConfig): string => {
  let str = config.gpProblem === 'Linear' ? "50" : "x";
  const ops = config.gpOperations;
  if (ops.length === 0) return str;

  for (const g of genes) {
    const op = ops[g % ops.length];
    switch (op.type) {
        case 'ADD_1': str += " + 1"; break;
        case 'SUB_1': str += " - 1"; break;
        case 'SUB_10': str += " - 10"; break;
        case 'DIV_2': str = `(${str}) / 2`; break;
        case 'MUL_2': str = `(${str}) * 2`; break;
        case 'ADD_X': str += " + x"; break;
        case 'SIN': str = `sin(${str})`; break;
        case 'COS': str = `cos(${str})`; break;
        case 'ADD_CONST': str += " + 5"; break;
    }
  }
  return str;
};

const calcGPFitness = (genes: number[], config: EAConfig): number => {
  if (config.gpProblem === 'Linear') {
      const val = evaluateGP(genes, 0, config);
      return Math.abs(val - 0); 
  } else {
      // Sine Regression SSE over [0, 2pi]
      let error = 0;
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * 2 * Math.PI;
          const target = Math.sin(x);
          const val = evaluateGP(genes, x, config);
          error += (val - target) ** 2;
      }
      return error;
  }
};

export const initGP = (config: EAConfig): Population => {
   const opCount = config.gpOperations.length;
   return Array.from({ length: config.populationSize }, (_, i) => {
    const genes = Array.from({ length: config.genesCount }, () => randomInt(0, opCount - 1));
    return {
      id: i,
      genes,
      fitness: calcGPFitness(genes, config)
    };
  });
};

export const stepGP = (pop: Population, config: EAConfig): { nextPop: Population; logs: StepLog } => {
  const sorted = [...pop].sort((a, b) => a.fitness - b.fitness);
  const nextPop: Population = [
    { ...sorted[0], id: 0 }, 
    { ...sorted[1], id: 1 }
  ];
  
  const logs: GPLogEntry[] = [];
  const opCount = config.gpOperations.length;

  while (nextPop.length < config.populationSize) {
    const p1 = tournament(pop, config.populationSize);
    const p2 = tournament(pop, config.populationSize);

    const crossoverPoint = randomInt(1, config.genesCount - 1);
    
    const child1Genes = [...p1.genes.slice(0, crossoverPoint), ...p2.genes.slice(crossoverPoint)];
    const child2Genes = [...p2.genes.slice(0, crossoverPoint), ...p1.genes.slice(crossoverPoint)];

    const log1: GPLogEntry = {
        id: nextPop.length,
        parents: [p1.id, p2.id],
        crossoverPoint,
        mutationIndex: null,
        expressionBefore: decodeGP(child1Genes, config),
        expressionAfter: ""
    };
    mutate(child1Genes, config, log1, opCount);
    log1.expressionAfter = decodeGP(child1Genes, config);
    
    nextPop.push({
        id: nextPop.length,
        genes: child1Genes,
        fitness: calcGPFitness(child1Genes, config)
    });
    logs.push(log1);

    if (nextPop.length < config.populationSize) {
        const log2: GPLogEntry = {
            id: nextPop.length,
            parents: [p2.id, p1.id],
            crossoverPoint,
            mutationIndex: null,
            expressionBefore: decodeGP(child2Genes, config),
            expressionAfter: ""
        };
        mutate(child2Genes, config, log2, opCount);
        log2.expressionAfter = decodeGP(child2Genes, config);

        nextPop.push({
            id: nextPop.length,
            genes: child2Genes,
            fitness: calcGPFitness(child2Genes, config)
        });
        logs.push(log2);
    }
  }

  return { nextPop, logs };
};

const tournament = (pop: Population, size: number): Individual => {
  const i1 = randomInt(0, size - 1);
  const i2 = randomInt(0, size - 1);
  return pop[i1].fitness < pop[i2].fitness ? pop[i1] : pop[i2];
};

const mutate = (genes: number[], config: EAConfig, log: GPLogEntry, opCount: number) => {
  if (Math.random() < config.mutationRate && opCount > 0) {
      const idx = randomInt(0, config.genesCount - 1);
      genes[idx] = randomInt(0, opCount - 1);
      log.mutationIndex = idx;
  }
};
