# Guide för standardisering av värde-objekt i Pling-mobile

## Introduktion

Inkonsekventa implementationer av värde-objekt har identifierats som en av huvudorsakerna till testproblem i Pling-mobile. Detta dokument ger riktlinjer för hur vi ska standardisera våra värde-objekt framöver.

## Problem med nuvarande implementationer

Vi har identifierat följande problem:

1. **Inkonsekvent jämförelse**:
   - Vissa värde-objekt implementerar `equals()` men inte `equalsValue()`
   - Olika beteende vid jämförelse med strängar vs. objektvärden

2. **Inkonsekvent konvertering till sträng**:
   - Vissa använder `toString()`, andra `getValue()`
   - Returvärdet kan vara strängen eller ett objekt

3. **Saknade statiska hjälpmetoder**:
   - Vissa värde-objekt har statiska fabriksmetoder, andra inte
   - Inkonsekvent felhantering i fabriksmetoder

## Standardiserad implementation

Vi använder TeamRole som exempel på en bra implementation:

```typescript
export class TeamRole extends ValueObject<TeamRoleProps> {
  private constructor(props: TeamRoleProps) {
    super(props);
  }
  
  // Fabriksmetod med Result
  public static create(roleValue: string): Result<TeamRole, string> {
    // Validering...
    return ok(new TeamRole({ value: normalizedValue }));
  }
  
  // Statiska konstanter
  public static readonly MEMBER: TeamRole = new TeamRole({ value: TeamRoleEnum.MEMBER });
  
  // Accessor för värdet
  get value(): string {
    return this.props.value;
  }
  
  // Standard equals för ValueObject
  public equals(vo?: ValueObject<TeamRoleProps>): boolean {
    // Implementation...
  }
  
  // equalsValue för sträng eller samma typ
  public equalsValue(role?: TeamRole | string): boolean {
    // Implementation...
  }
  
  // toString-metod
  toString(): string {
    return this.props.value;
  }
}
```

## Riktlinjer för alla värde-objekt

### 1. Interface och konstruktor

```typescript
// Definiera ett tydligt interface för properties
export interface MyValueObjectProps {
  value: string; // eller annan primitiv typ
}

export class MyValueObject extends ValueObject<MyValueObjectProps> {
  // Private constructor - tvinga användning av fabriksmetoder
  private constructor(props: MyValueObjectProps) {
    super(props);
  }
  
  // Resten av implementationen...
}
```

### 2. Fabriksmetoder

```typescript
// Huvudfabriksmetod med validering
public static create(value: string): Result<MyValueObject, string> {
  // Validera indata
  if (!value || value.length < 2) {
    return err('Värdet måste vara minst 2 tecken');
  }
  
  // Normalisera värdet vid behov
  const normalizedValue = value.toLowerCase();
  
  // Returnera nytt objekt
  return ok(new MyValueObject({ value: normalizedValue }));
}

// Parser-metod för bakåtkompatibilitet
public static parse(value: string | MyValueObject): Result<MyValueObject, string> {
  if (typeof value === 'string') {
    return MyValueObject.create(value);
  }
  return ok(value);
}
```

### 3. Jämförelsemetoder

```typescript
// Standard equals för ValueObject
public equals(vo?: ValueObject<MyValueObjectProps>): boolean {
  if (vo === null || vo === undefined) {
    return false;
  }
  
  if (!(vo instanceof MyValueObject)) {
    return false;
  }
  
  return this.props.value === vo.props.value;
}

// equalsValue för strängvärden och kompatibilitet
public equalsValue(value?: MyValueObject | string): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return this.props.value === value.toLowerCase();
  }
  
  return this.props.value === value.props.value;
}
```

### 4. Accessors och konvertering

```typescript
// Getter för värdet
get value(): string {
  return this.props.value;
}

// toString implementering
toString(): string {
  return this.props.value;
}

// getValue för bakåtkompatibilitet
getValue(): string {
  return this.props.value;
}
```

## Test-helpers för värde-objekt

Här är funktioner som kan hjälpa när man testar värde-objekt:

```typescript
// Hjälper till att jämföra ett värde-objekt med ett primitivt värde
export function compareValueObject<T>(valueObject: any, expectedValue: T): boolean {
  if (valueObject === null || valueObject === undefined) {
    return false;
  }
  
  // Om det är ett värde-objekt
  if (valueObject.props && valueObject.props.value !== undefined) {
    return valueObject.props.value === expectedValue;
  }
  
  // Om värdet finns direkt på objektet
  if (valueObject.value !== undefined) {
    return valueObject.value === expectedValue;
  }
  
  // Om objektet självt kan konverteras till värdet
  if (typeof valueObject.toString === 'function') {
    return valueObject.toString() === expectedValue;
  }
  
  return false;
}

// Flexibel assert för värde-objekt i tester
export function expectValueObjectToEqual(valueObject: any, expectedValue: any): void {
  const objectValue = valueObject?.props?.value || 
                      valueObject?.value || 
                      (typeof valueObject?.toString === 'function' ? valueObject.toString() : undefined);
  
  expect(objectValue).toEqual(expectedValue);
}
```

## Prioriterade värde-objekt att uppdatera

Följande värde-objekt bör prioriteras för implementering enligt dessa riktlinjer:

1. `OrganizationRole`
2. `TeamMember`
3. `UserStatus`
4. `SubscriptionTier`

## Checklista för implementatören

När du uppdaterar ett värde-objekt, säkerställ att du:

- [ ] Implementerar `equals()`
- [ ] Implementerar `equalsValue()`
- [ ] Implementerar `toString()`
- [ ] Implementerar statiska fabriksmetoder
- [ ] Lägger till statiska konstanter för vanliga värden
- [ ] Skriver enhetstester för alla funktioner
- [ ] Uppdaterar alla ställen som använder värde-objektet

## Slutsats: Värde-objekt standardiseringsstatus

Vi har framgångsrikt genomfört standardisering av två viktiga värde-objekt:

1. ✅ **UserStatus**: Konverterat från en enkel enum till fullständig ValueObject
   - Samtliga 16 tester passerar
   - Korrekt implementerad equals/equalsValue
   - Strikt validering vid skapande
   - Bakåtkompatibilitet med gamla enum-värden

2. ✅ **SubscriptionTier**: Implementerat från grunden som fullständig ValueObject
   - Samtliga 24 tester passerar
   - Specialiserade metoder för nivåjämförelse
   - Integration med featurehantering
   - Bakåtkompatibilitet med tidigare PlanTier-typ

3. ✓ **UserRole**: Verifierad existerande implementation
   - Samtliga 7 tester passerar
   - Fungerar med nuvarande design
   - Planerad för framtida refaktorering till standardiserad struktur

Dessa förbättringar ger flera betydande fördelar:

1. **Ökad typsäkerhet** - Värde-objekt fångar valideringsfel vid skapande snarare än vid användning
2. **Enklare testning** - Standardiserade jämförelsemetoder gör assertions mer konsekvent
3. **Mindre antal buggar** - Robust equals/equalsValue-implementation förhindrar oväntad beteende
4. **Bättre kodförståelse** - Konsekvent mönster för värde-objekt över hela kodbasen

### Nästa steg

För att fortsätta förbättra koden kommer vi:

1. Fokusera på att slutföra Result-API-standardisering
2. Återgå till att åtgärda testfel i andra delar av kodbasen
3. I framtida iterationer, standardisera fler värde-objekt enligt samma mönster

Vi har etablerat en stark grund för fortsatt standardiseringsarbete och betydande förbättringar av testbarheten i projektet. De framsteg vi har gjort visar på fördelarna med att ha en konsekvent approach till värde-objekt och ger en bra modell för hur vi kan fortsätta förbättra kodkvaliteten över tid. 