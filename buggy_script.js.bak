function addNumbers(a, b) {
  return a + b;
}

function multiplyNumbers(a, b) {
  return a * b;
}

function divideNumbers(a, b) {
  return a / b;
}

function calculate(operation, num1, num2) {
  let result;

  switch (operation) {
    case 'add':
      result = addNumbers(num1, num2);
      break;
    case 'subtract':
      result = subtractNumbers(num1, num2);
      break;
    case 'multiply':
      result = multiplyNumbers(num1, num2);
      break;
    case 'divide':
      result = divideNumbers(num1, num2);
      break;
    default:
      console.log('Invalid operation');
      return;
  }

  return result;
}

const result = calculate('subtract', 20, 3);
console.log(result);
