// Utils file that imports and uses symbols from main.ts
import { calculateSum, UserData, API_ENDPOINT } from './main';

export function processNumbers(x: number, y: number): number {
  return calculateSum(x * 2, y * 2); // Reference to calculateSum from main.ts
}

export function createUser(id: number, name: string): UserData {
  const user: UserData = {
    // Reference to UserData from main.ts
    id,
    name,
  };

  console.log(`Making request to ${API_ENDPOINT}`); // Reference to API_ENDPOINT from main.ts
  return user;
}

// Test target: LOCAL_CONSTANT defined at line 19, column 13
// Expected references: line 19 (declaration), line 23 (usage)

export const LOCAL_CONSTANT = 'local value';

export function useLocalConstant() {
  return LOCAL_CONSTANT.toUpperCase(); // Reference to LOCAL_CONSTANT
}
