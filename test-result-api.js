// Test-fil för Result-API användning
const { ok, err } = require('./src/shared/core/Result');

// Funktion som använder gamla API:et (bör flaggas av ESLint)
function oldApiUsage() {
  const okResult = ok('success');
  const errResult = err('error');
  
  // Gamla API-metoder som bör flaggas
  const value = okResult.getValue(); // Bör flaggas: Använd .value istället
  const error = errResult.getError(); // Bör flaggas: Använd .error istället
  
  // Unwrap-metoder som bör flaggas
  try {
    const unwrappedValue = okResult.unwrap(); // Bör flaggas: Kontrollera .isOk() först
    console.log(unwrappedValue);
  } catch (e) {
    console.error(e);
  }
  
  // UnwrapOr som bör flaggas
  const defaultValue = errResult.unwrapOr('default'); // Bör flaggas: Använd result.isOk() ? result.value : defaultValue
  console.log(defaultValue);
  
  return { value, error };
}

// Funktion som använder nya API:et (bör inte flaggas av ESLint)
function newApiUsage() {
  const okResult = ok('success');
  const errResult = err('error');
  
  // Kontrollera status först, sedan använd direkta egenskaper
  if (okResult.isOk()) {
    const value = okResult.value; // Korrekt användning
    console.log(value);
  }
  
  if (errResult.isErr()) {
    const error = errResult.error; // Korrekt användning
    console.error(error);
  }
  
  // Explicit felhantering istället för unwrapOr
  const valueOrDefault = okResult.isOk() ? okResult.value : 'default'; // Korrekt användning
  console.log(valueOrDefault);
  
  // Kedjeoperationer
  const mappedResult = okResult
    .map(value => value.toUpperCase())
    .andThen(value => ok(`Transformed: ${value}`));
  
  if (mappedResult.isOk()) {
    console.log(mappedResult.value);
  }
  
  return { okResult, errResult };
}

// Exportera för att testa med ESLint
module.exports = {
  oldApiUsage,
  newApiUsage
}; 