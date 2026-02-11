// Initial plan is to build of
// GA,DE,ES,PSO,GP

import { KnapsackItem, DEFAULT_KNAPSACK_ITEMS, DEFAULT_CAPACITY } from '../data/knapsack';
import { GPOperation, DEFAULT_GP_LINEAR_OPS } from '../data/gp-ops';

export type Individual = {
  id: number;
  genes: number[];
  fitness: number;
  bestPosition?: number[];
  bestFitness?: number;
  
  // PSO specific
  position?: number[];
  velocity?: number[];
};

export type Population = Individual[];



export interface EAConfig {
  populationSize: number;
  genesCount: number;
  maxGenerations: number;
  mutationRate: number;
  crossoverRate: number;
  w: number;
  c1: number;
  c2: number;
  sigma: number; 
  knapsackItems: KnapsackItem[];
  knapsackCapacity: number;
  
  // GA Specific
  tournamentSize: number;

  // GP Specific
  gpProblem: 'Linear' | 'Sine';
  gpOperations: GPOperation[];
  
  // DE Specific
  F: number;

  // Real-valued Optimization (DE, PSO, ES)
  problemType: 'Sphere' | 'Ackley';
}

export const DEFAULT_CONFIG: EAConfig = {
  populationSize: 10,
  genesCount: 2,
  maxGenerations: 10,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  w: 0.7,
  c1: 1.4,
  c2: 1.4,
  sigma: 1.0,
  F: 0.5,
  knapsackItems: DEFAULT_KNAPSACK_ITEMS,
  knapsackCapacity: DEFAULT_CAPACITY,
  tournamentSize: 3,
  gpProblem: 'Linear',
  gpOperations: DEFAULT_GP_LINEAR_OPS,
  problemType: 'Sphere'
};


