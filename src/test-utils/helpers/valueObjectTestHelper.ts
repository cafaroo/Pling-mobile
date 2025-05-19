/**
 * ValueObjectTestHelper
 * 
 * Hjälper till att testa värde-objekt på ett konsekvent och flexibelt sätt,
 * oavsett deras underliggande implementation.
 */

/**
 * Jämför ett värde-objekt med ett förväntat primitivt värde
 * 
 * @param valueObject Värde-objektet att jämföra
 * @param expectedValue Det förväntade primitiva värdet
 * @returns Sant om värdena matchar, annars falskt
 */
export function compareValueObject<T>(valueObject: any, expectedValue: T): boolean {
  if (valueObject === null || valueObject === undefined) {
    return false;
  }
  
  // Om det är ett värde-objekt med props.value
  if (valueObject.props && valueObject.props.value !== undefined) {
    return valueObject.props.value === expectedValue;
  }
  
  // Om värdet finns direkt på objektet som property
  if (valueObject.value !== undefined) {
    return valueObject.value === expectedValue;
  }
  
  // Om värdet är tillgängligt genom getValue()
  if (typeof valueObject.getValue === 'function') {
    return valueObject.value === expectedValue;
  }
  
  // Om objektet självt kan konverteras till värdet via toString
  if (typeof valueObject.toString === 'function' && valueObject.toString !== Object.prototype.toString) {
    return valueObject.toString() === String(expectedValue);
  }
  
  return false;
}

/**
 * Flexibel assert för värde-objekt i tester
 * 
 * @param valueObject Värde-objektet att testa
 * @param expectedValue Det förväntade värdet (primitiv eller värde-objekt)
 */
export function expectValueObjectToEqual(valueObject: any, expectedValue: any): void {
  // Försök extrahera värdet från värde-objektet
  const objectValue = valueObject?.props?.value || 
                     valueObject?.value || 
                     (typeof valueObject?.getValue === 'function' ? valueObject.value : undefined) ||
                     (typeof valueObject?.toString === 'function' && valueObject.toString !== Object.prototype.toString ? 
                       valueObject.toString() : undefined);
  
  // Försök extrahera värdet från det förväntade värdet om det också är ett objekt
  const expectedObjectValue = typeof expectedValue === 'object' && expectedValue !== null ?
                             expectedValue?.props?.value || 
                             expectedValue?.value || 
                             (typeof expectedValue?.getValue === 'function' ? expectedValue.value : undefined) ||
                             (typeof expectedValue?.toString === 'function' && expectedValue.toString !== Object.prototype.toString ? 
                               expectedValue.toString() : undefined) :
                             expectedValue;
  
  expect(objectValue).toEqual(expectedObjectValue);
}

/**
 * Hjälper till att kontrollera om två värde-objekt är likvärdiga
 */
export function areEquivalentValueObjects(valueObject1: any, valueObject2: any): boolean {
  if (valueObject1 === null || valueObject1 === undefined || valueObject2 === null || valueObject2 === undefined) {
    return false;
  }
  
  // Försök använda objektets egen equals/equalsValue-metod om den finns
  if (typeof valueObject1.equals === 'function') {
    return valueObject1.equals(valueObject2);
  }
  
  if (typeof valueObject1.equalsValue === 'function') {
    return valueObject1.equalsValue(valueObject2);
  }
  
  // Annars jämför värdena direkt
  const value1 = valueObject1?.props?.value || 
                valueObject1?.value || 
                (typeof valueObject1?.getValue === 'function' ? valueObject1.value : undefined) ||
                (typeof valueObject1?.toString === 'function' ? valueObject1.toString() : undefined);
  
  const value2 = valueObject2?.props?.value || 
                valueObject2?.value || 
                (typeof valueObject2?.getValue === 'function' ? valueObject2.value : undefined) ||
                (typeof valueObject2?.toString === 'function' ? valueObject2.toString() : undefined);
  
  return value1 === value2;
}

/**
 * Skapar en typvakt (type guard) för ett specifikt värde-objekt
 * Hjälper till att verifiera att ett värde verkligen är ett värde-objekt av förväntat typ
 * 
 * @param value Värdet att kontrollera
 * @param expectedType Förväntad värde-objekt-klass
 * @returns Sant om värdet är av förväntad typ, annars falskt
 */
export function isValueObjectOfType(value: any, expectedType: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  // Kontrollera om värdet är en instans av förväntad klass
  if (!(value instanceof expectedType)) {
    return false;
  }
  
  // Kontrollera om värdet har de grundläggande egenskaper vi förväntar av ett värde-objekt
  return (
    typeof value === 'object' &&
    value.props !== undefined &&
    typeof value.equals === 'function'
  );
}

/**
 * Skapar en typvakt som genererar ett specifikt felmeddelande om värdet inte är av förväntad typ
 * Användbart i tester för att ge tydliga felmeddelanden
 * 
 * @param value Värdet att kontrollera
 * @param expectedType Förväntad värde-objekt-klass
 * @param errorPrefix Prefix för felmeddelandet
 * @returns Sant om värdet är av förväntad typ, kastar fel annars
 */
export function assertValueObjectType(value: any, expectedType: any, errorPrefix: string = 'Värde'): boolean {
  if (!isValueObjectOfType(value, expectedType)) {
    throw new Error(`${errorPrefix} är inte ett giltigt ${expectedType.name} värde-objekt`);
  }
  return true;
}

/**
 * Samlar alla test-hjälpare för värde-objekt
 */
export const ValueObjectTestHelper = {
  compareValueObject,
  expectValueObjectToEqual,
  areEquivalentValueObjects,
  isValueObjectOfType,
  assertValueObjectType
};

export default ValueObjectTestHelper; 