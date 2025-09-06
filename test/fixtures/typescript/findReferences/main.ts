// Main file with function and variable definitions
// Test target: calculateSum function defined at line 4, column 17
// Expected references: line 4 (declaration), line 10 (usage), utils.ts line 5, consumer.ts line 6

export function calculateSum(a: number, b: number): number {
  return a + b;
}

function example() {
  const result = calculateSum(10, 20); // Reference to calculateSum
  console.log(result);
}

// Test target: UserData interface defined at line 15, column 17
// Expected references: line 15 (declaration), line 19 (usage), utils.ts line 9, consumer.ts line 10

export interface UserData {
  id: number;
  name: string;
}

const userData: UserData = {
  // Reference to UserData
  id: 1,
  name: 'Test User',
};

// Test target: API_ENDPOINT constant defined at line 26, column 13
// Expected references: line 26 (declaration), line 30 (usage), utils.ts line 13

export const API_ENDPOINT = 'https://api.example.com';

function makeRequest() {
  fetch(API_ENDPOINT); // Reference to API_ENDPOINT
}
