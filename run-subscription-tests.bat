@echo off
echo Kör subscription hook-tester med JSDOM-miljö

REM Sätt testmiljövariabel
set TEST_ENV=jsdom

REM Kör alla subscription-tester med JSDOM-miljö och konfiguration
node --no-warnings node_modules/jest/bin/jest.js src/application/subscription/hooks/__tests__ --testTimeout=10000 --testEnvironment=jsdom --config=jest.config.jsdom.js

echo Testresultat:
echo Avslutningskod: %errorlevel%

if %errorlevel% NEQ 0 (
  echo Testningen misslyckades!
) else (
  echo Alla tester passerade.
)

pause 