@echo off
echo Result API Verifiering
echo =====================
echo.

:: Försök köra Jest-testet direkt, då det inte kräver ts-node
echo Kör verifiering via Jest...
npx jest src/test-utils/verification/__tests__/resultApiConsistency.test.ts --no-cache

:: Kontrollera exit-koden
if %ERRORLEVEL% EQU 0 (
  echo.
  echo Verifiering slutförd utan problem!
  echo API-migreringen är komplett.
  exit /b 0
) else (
  echo.
  echo Verifiering misslyckades. Vissa filer använder fortfarande det gamla API:et.
  echo Se konsolloggen ovan för detaljer.
  exit /b 1
) 