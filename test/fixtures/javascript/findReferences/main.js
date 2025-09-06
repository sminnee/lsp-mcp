// Main file with function and variable definitions
// Test target: calculateSum function defined at line 4, column 16
// Expected references: line 4 (declaration), line 10 (usage), utils.js line 5, consumer.js line 6

function calculateSum(a, b) {
  return a + b;
}

function example() {
  const result = calculateSum(10, 20); // Reference to calculateSum
  console.log(result);
}

// Test target: createUser function defined at line 16, column 16
// Expected references: line 16 (declaration), line 22 (usage), utils.js line 9, consumer.js line 10

function createUser(id, name) {
  return {
    id: id,
    name: name
  };
}

const user = createUser(1, 'Test User'); // Reference to createUser

// Test target: API_ENDPOINT constant defined at line 27, column 6
// Expected references: line 27 (declaration), line 31 (usage), utils.js line 13

const API_ENDPOINT = 'https://api.example.com';

function makeRequest() {
  fetch(API_ENDPOINT); // Reference to API_ENDPOINT
}

module.exports = { calculateSum, createUser, API_ENDPOINT };