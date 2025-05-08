# Autentiseringsflöde i Pling

## Översikt

Detta dokument beskriver hur autentisering (inloggning, registrering, etc.) hanteras i Pling-applikationen. Kärnan i systemet är `AuthContext` som tillhandahåller global state och funktioner relaterade till användarens autentiseringsstatus.

## Huvudkomponenter

1.  **`context/AuthContext.tsx`:**
    *   Definierar `AuthContext` och `AuthProvider`.
    *   Håller reda på den inloggade användarens data (`user: User | null`) och laddningsstatus (`isLoading: boolean`).
    *   Använder `useEffect` för att lyssna på autentiseringsändringar från Supabase via `supabase.auth.onAuthStateChange`.
    *   Hanterar automatisk navigering via `expo-router` (`router.replace`) baserat på om en användare är inloggad (`/(tabs)`) eller inte (`/(auth)`).
    *   Innehåller logik (`handleAuthChange`) för att hämta eller skapa en användarprofil i `profiles`-tabellen när en användare loggar in eller registreras via Supabase Auth.

2.  **`useAuth()` Hook:**
    *   Exporteras från `AuthContext.tsx`.
    *   Används i UI-komponenter för att få tillgång till autentiseringsstatus och funktioner.
    *   Exponerar följande:
        *   `user: User | null`: Information om den inloggade användaren.
        *   `isLoading: boolean`: Indikerar om autentiseringsstatus håller på att kontrolleras/ändras.
        *   `signInWithEmail(email, password)`: Asynkron funktion för att logga in med e-post/lösenord via `supabase.auth.signInWithPassword`. Kastar Error vid misslyckande.
        *   `signUp(email, password)`: Asynkron funktion för att registrera ett nytt konto via `supabase.auth.signUp`. Knyter inte direkt användarnamn till kontot i detta steg (det hanteras via profilen i `handleAuthChange`). Kastar Error vid misslyckande.
        *   `sendPasswordResetEmail(email)`: Asynkron funktion för att begära lösenordsåterställning via `supabase.auth.resetPasswordForEmail`. Kastar Error vid misslyckande.
        *   `signOut()`: Asynkron funktion för att logga ut via `supabase.auth.signOut`.
        *   `signInWithMagicLink(email)`: Funktion för magic link (inte fullt ut integrerad i UI än).

3.  **UI-Skärmar (`src/app/(auth)/`)**
    *   **`login.tsx`:**
        *   Visar inloggningsformulär (e-post, lösenord).
        *   Använder `useAuth` för att hämta `signInWithEmail` och `isLoading`.
        *   Anropar `signInWithEmail` vid knapptryck.
        *   Visar felmeddelanden och hanterar laddningsstatus.
        *   Länkar till `/register` och `/forgot-password`.
    *   **`register.tsx`:**
        *   Visar registreringsformulär (namn, e-post, lösenord, bekräfta lösenord, godkänn villkor).
        *   Använder `useAuth` för att hämta `signUp` och `isLoading`.
        *   Anropar `signUp` vid knapptryck (skickar endast e-post/lösenord).
        *   Visar felmeddelanden och hanterar laddningsstatus.
        *   Länkar till `/login`.
    *   **`forgot-password.tsx`:**
        *   Visar formulär för att ange e-post.
        *   Använder `useAuth` för att hämta `sendPasswordResetEmail` och `isLoading`.
        *   Anropar `sendPasswordResetEmail` vid knapptryck.
        *   Visar felmeddelanden, framgångsmeddelande och hanterar laddningsstatus.
        *   Länkar till `/login`.

## Beroenden

*   **Supabase:** Används som backend för autentisering och databas (`supabaseClient` i `@/services/supabaseClient`).
*   **Expo Router:** Används för navigation mellan skärmar.
*   **React Native Paper:** Används för UI-komponenter.

## Viktiga Flöden

1.  **Appstart:** `AuthProvider` kontrollerar session och `onAuthStateChange`.
2.  **Inloggning:** `login.tsx` -> `useAuth().signInWithEmail` -> Supabase -> `onAuthStateChange` -> `handleAuthChange` (hämtar/skapar profil) -> Sätter `user`-state -> `AuthProvider` navigerar till `/(tabs)`.
3.  **Registrering:** `register.tsx` -> `useAuth().signUp` -> Supabase (skapar auth user) -> `onAuthStateChange` -> `handleAuthChange` (skapar profil) -> Sätter `user`-state -> `AuthProvider` navigerar till `/(tabs)` (eller visar meddelande om e-postverifiering).
4.  **Utloggning:** Anrop till `useAuth().signOut` -> Supabase -> `onAuthStateChange` -> Sätter `user`-state till `null` -> `AuthProvider` navigerar till `/(auth)`.
5.  **Lösenordsåterställning (Begäran):** `forgot-password.tsx` -> `useAuth().sendPasswordResetEmail` -> Supabase (skickar mejl).

## Viktiga uppdateringar

### Separation mellan auth.users och profiles

Vi har implementerat en förbättrad separation mellan autentiseringsdata (från `auth.users`) och profildata (från `profiles`-tabellen):

1. **Eliminerad redundans:**
   - Email lagras nu endast i `auth.users`-tabellen
   - Eliminerar behovet att synkronisera email mellan tabeller

2. **Förbättrad robusthet:**
   - AuthContext har nu förbättrad felhantering för saknade kolumner
   - Profilskapandet har fallback-logik för databasschemaändringar

3. **Optimerad användarupplevelse:**
   - Navigationskomponenter har uppdaterats för att använda `router.push` istället för nästlade Link-komponenter
   - Eliminerat "React.Children.only" fel som kunde uppstå i UI

### Användarprofil

Användarobjektet kombinerar nu data från både auth.users och profiles:

```typescript
{
  id: profileData.id,        // Från profiles
  email: email,              // Från auth.users
  name: profileData.display_name || 
        (profileData.first_name && profileData.last_name 
          ? `${profileData.first_name} ${profileData.last_name}` 
          : profileData.first_name || null),
  // Andra profilattribut från profiles-tabellen
}
```

Detta ger en ren separation mellan autentisering och användardata samtidigt som det erbjuder ett enhetligt användargränssnitt för övriga delar av applikationen.

## Senaste förbättringar

### Förhindrat MultipleGoTrueClient-problem

Vi har konsoliderat alla Supabase-klientskapande till en enda plats för att undvika dublettinstanser av `GoTrueClient`:

1. **En enda källa för supabase-klienten:**
   - All kod använder nu supabase-instansen från `@/lib/supabase.ts`
   - Sekundära klienter (t.ex. i `src/infrastructure/supabase/index.ts`) har ersatts med re-export av huvudinstansen

2. **Förbättrad felhantering vid autentisering:**
   - Användarvänliga felmeddelanden vid misslyckad inloggning/registrering
   - Förbättrad hantering av oväntade tillstånd

### Förbättrade Row Level Security-policyer (RLS)

Vi har åtgärdat RLS-policyer för `profiles`-tabellen för att förbättra säkerhet och funktionalitet:

1. **Tillåt användarprofilskapande:**
   - Nya INSERT-policyer för att låta användare skapa sin egen profil
   - Administratörsrättigheter för service_role
   - Utvidgade behörigheter för att hantera användarprofiler

2. **Ökat skydd mot obehörig åtkomst:**
   - Förbättrad säkerhet genom tydligt definierade RLS-policyer
   - Varje användare kan endast manipulera sin egen profildata

## Fortsatt Arbete

*   Implementera UI och logik för skärmen där användaren anger nytt lösenord efter att ha klickat på återställningslänken.
*   Verifiera och korrigera navigeringssökvägar (`Link href="..."`).
*   Finjustera styling enligt designguide.
*   Implementera länk till användarvillkor.
*   Förbättra felhantering och användarfeedback. 