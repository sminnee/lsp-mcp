// Consumer file that uses symbols from main.ts and utils.ts
import { calculateSum, UserData } from './main';
import { processNumbers, LOCAL_CONSTANT } from './utils';

export class DataProcessor {
  calculate(): number {
    return calculateSum(5, 15); // Reference to calculateSum from main.ts
  }

  processUser(): UserData {
    // Reference to UserData from main.ts
    const result = processNumbers(3, 4);
    return {
      id: result,
      name: `User ${LOCAL_CONSTANT}`, // Reference to LOCAL_CONSTANT from utils.ts
    };
  }
}

// Test case for no references found
export function unusedFunction() {
  return 'This function should have no references';
}
