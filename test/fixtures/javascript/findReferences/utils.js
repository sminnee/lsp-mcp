// Utils file that imports and uses symbols from main.js
const { calculateSum, createUser, API_ENDPOINT } = require('./main');

function processNumbers(x, y) {
  return calculateSum(x * 2, y * 2); // Reference to calculateSum from main.js
}

function processUser(id, name) {
  const user = createUser(id, name); // Reference to createUser from main.js
  console.log(`Making request to ${API_ENDPOINT}`); // Reference to API_ENDPOINT from main.js
  return user;
}

// Test target: LOCAL_CONSTANT defined at line 15, column 6
// Expected references: line 15 (declaration), line 19 (usage)

const LOCAL_CONSTANT = 'local value';

function useLocalConstant() {
  return LOCAL_CONSTANT.toUpperCase(); // Reference to LOCAL_CONSTANT
}

module.exports = { processNumbers, processUser, LOCAL_CONSTANT, useLocalConstant };