import { EAConfig, Individual, Population,  } from "../utils/common";
import { calcKnapsackFitness, randomInt  } from "../utils/functions";
import { GALogEntry,StepLog } from "../utils/internal-algo-logs";

export const initGA = (config: EAConfig): Population => {
  const geneLen = config.knapsackItems.length;
  return Array.from({ length: config.populationSize }, (_, i) => {
    // Binary genes
    const genes = Array.from({ length: geneLen }, () => randomInt(0, 1));
    const { fitness } = calcKnapsackFitness(genes, config.knapsackItems, config.knapsackCapacity);
    return {
      id: i,
      genes,
      fitness
    };
  });
};

export const stepGA = (pop: Population, config: EAConfig): { nextPop: Population; logs: StepLog } => {
  // sort Descending for max
  const sorted = [...pop].sort((a, b) => b.fitness - a.fitness);
  const geneLen = config.knapsackItems.length;
  
  const nextPop: Population = [
    { ...sorted[0], id: 0 }, 
    { ...sorted[1], id: 1 }
  ];
  
  const logs: GALogEntry[] = [];

  while (nextPop.length < config.populationSize) {
    const p1 = tournament(pop, config.tournamentSize);
    const p2 = tournament(pop, config.tournamentSize);

    let child1Genes = [...p1.genes];
    let child2Genes = [...p2.genes];
    let crossoverPoint = 0;

    // Check Crossover Rate
    if (geneLen > 1 && Math.random() < config.crossoverRate) {
        crossoverPoint = randomInt(1, geneLen - 1);
        child1Genes = [...p1.genes.slice(0, crossoverPoint), ...p2.genes.slice(crossoverPoint)];
        child2Genes = [...p2.genes.slice(0, crossoverPoint), ...p1.genes.slice(crossoverPoint)];
    }

    const { fitness: f1 } = processChild(child1Genes, config, p1.id, p2.id, crossoverPoint, nextPop.length, logs);
    nextPop.push({ id: nextPop.length, genes: child1Genes, fitness: f1 });

    if (nextPop.length < config.populationSize) {
         const { fitness: f2 } = processChild(child2Genes, config, p2.id, p1.id, crossoverPoint, nextPop.length, logs);
         nextPop.push({ id: nextPop.length, genes: child2Genes, fitness: f2 });
    }
  }

  return { nextPop, logs };
};

const processChild = (
    genes: number[], 
    config: EAConfig, 
    p1Id: number, 
    p2Id: number, 
    cut: number, 
    newId: number, 
    logs: GALogEntry[]
): { fitness: number, weight: number, isValid: boolean } => {
    
    const preMutation = [...genes];
    let mutIdx: number | null = null;
    const geneLen = config.knapsackItems.length;
    
    if (Math.random() < config.mutationRate && geneLen > 0) {
        const idx = randomInt(0, geneLen - 1);
        genes[idx] = genes[idx] === 0 ? 1 : 0; // Flip Bit
        mutIdx = idx;
    }

    const { fitness, weight, isValid } = calcKnapsackFitness(genes, config.knapsackItems, config.knapsackCapacity);

    logs.push({
        id: newId,
        parents: [p1Id, p2Id],
        crossoverPoint: cut,
        preMutation,
        mutationIndex: mutIdx,
        final: [...genes],
        isValid,
        weight
    });

    return { fitness, weight, isValid };
};

const tournament = (pop: Population, tournamentSize: number): Individual => {
  let best = pop[randomInt(0, pop.length - 1)];
  
  for (let i = 1; i < tournamentSize; i++) {
      const challenger = pop[randomInt(0, pop.length - 1)];
      if (challenger.fitness > best.fitness) {
          best = challenger;
      }
  }
  
  return best;
};