import { EAConfig, Population, Individual } from '../utils/common';
import { calcSphereFitness, calcAckleyFitness, randomInt, randomGaussian } from '../utils/functions';
import { ESLogEntry, StepLog } from '../utils/internal-algo-logs';

export const initES = (config: EAConfig): Population => {
  const calcFitness = config.problemType === 'Ackley' ? calcAckleyFitness : calcSphereFitness;
  return Array.from({ length: config.populationSize }, (_, i) => {
    const genes = Array.from({ length: config.genesCount }, () => randomInt(-5, 5));
    return {
      id: i,
      genes,
      fitness: calcFitness(genes)
    };
  });
};

export const stepES = (pop: Population, config: EAConfig): { nextPop: Population; logs: StepLog } => {
  // (mu + lambda) Strategy:
  // generate lambda children from current mu parents (random selection)
  // Pool = mu + lambda
  // Select best mu
  
  const children: Individual[] = [];
  const logs: ESLogEntry[] = [];
  const calcFitness = config.problemType === 'Ackley' ? calcAckleyFitness : calcSphereFitness;
  
  const lambda = config.offspringSize ?? config.populationSize; // Default to mu if not set
  
  for (let i = 0; i < lambda; i++) {
      // Randomly select a parent
      const parentIdx = randomInt(0, pop.length - 1);
      const parent = pop[parentIdx];

      const noiseVec: number[] = [];
      const childGenes = parent.genes.map(g => {
          const sigma = config.sigma ?? 1.0;
          const noise = randomGaussian(0, sigma);
          noiseVec.push(parseFloat(noise.toFixed(2)));
          
          let val = g + noise;
          // Clamp for only viz
          if (val < -5) val = -5;
          if (val > 5) val = 5;
          return val;
      });

      const childFitness = calcFitness(childGenes);
      
      const childId = config.populationSize + i; // Temporary ID: start after last parent

      children.push({
          id: childId,
          genes: childGenes,
          fitness: childFitness
      });

      // Prepare partial log - survival status known after sorting
      logs.push({
          id: childId,
          parentId: parent.id,
          parentGenes: [...parent.genes],
          parentFitness: parent.fitness,
          noiseVector: noiseVec,
          childGenes: childGenes,
          childFitness: childFitness,
          isChildSurvivor: false, // Updated later
          isParentSurvivor: false // Updated later
      });
  }

  const pool = [...pop, ...children];
  pool.sort((a, b) => a.fitness - b.fitness);
  
  const survivors = pool.slice(0, config.populationSize);
  
  // Update IDs for next gen
  const nextPop = survivors.map((ind, i) => ({
      ...ind,
      id: i
  }));

  // update logs with survival status
  const survivorOriginalIds = new Set(survivors.map(s => s.id)); 
  
  logs.forEach(log => {
      
      // Check if Child Survived
      if (survivorOriginalIds.has(log.id)) {
          log.isChildSurvivor = true;
      }
      
      // Check if Parent Survived
      if (survivorOriginalIds.has(log.parentId)) {
          log.isParentSurvivor = true;
      }
  });

  return { nextPop, logs };
};
