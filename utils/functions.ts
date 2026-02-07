import { KnapsackItem } from '../data/knapsack';
import { EAConfig } from './common';

export const calcSphereFitness = (genes: number[]): number => {
  return genes.reduce((acc, val) => acc + (val * val), 0);
};

export const calcKnapsackFitness = (genes: number[], items: KnapsackItem[], capacity: number): { fitness: number, weight: number, isValid: boolean } => {
  let totalValue = 0;
  let totalWeight = 0;
  
  genes.forEach((g, i) => {
    if (g === 1 && items[i]) {
      totalValue += items[i].value;
      totalWeight += items[i].weight;
    }
  });

  const isValid = totalWeight <= capacity;
  return { 
    fitness: isValid ? totalValue : 0, 
    weight: totalWeight, 
    isValid 
  };
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


// evals the GP tree for linear seq
export const evaluateGP = (genes: number[], x: number, config: EAConfig): number => {
    let val = config.gpProblem === 'Linear' ? 50 : x;
    const ops = config.gpOperations;
    if (ops.length === 0) return val;

    for (const g of genes) {
        // Gene is index into ops array. 
        // Modulo to be safe if ops changed size.
        const op = ops[g % ops.length]; 
        
        switch (op.type) {
            case 'ADD_1': val += 1; break;
            case 'SUB_1': val -= 1; break;
            case 'SUB_10': val -= 10; break;
            case 'DIV_2': val = Math.floor(val / 2); break;
            case 'MUL_2': val *= 2; break;
            case 'ADD_X': val += x; break;
            case 'SIN': val = Math.sin(val); break;
            case 'COS': val = Math.cos(val); break;
            case 'ADD_CONST': val += 5; break; // Example const
        }
    }
    return val;
};
