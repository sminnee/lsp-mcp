// Consumer file that uses symbols from main.js and utils.js
const { calculateSum, createUser } = require('./main');
const { processNumbers, LOCAL_CONSTANT } = require('./utils');

class DataProcessor {
  calculate() {
    return calculateSum(5, 15); // Reference to calculateSum from main.js
  }
  
  processUser() {
    const user = createUser(42, 'Consumer User'); // Reference to createUser from main.js
    const result = processNumbers(3, 4);
    return {
      ...user,
      name: `User ${LOCAL_CONSTANT}` // Reference to LOCAL_CONSTANT from utils.js
    };
  }
}

// Test case for no references found
function unusedFunction() {
  return 'This function should have no references';
}

module.exports = { DataProcessor, unusedFunction };