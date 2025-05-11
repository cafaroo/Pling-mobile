@echo off
echo Kör domänexempeltest...
npx jest --config jest.domain.config.js src/domain/examples/TestDomainExample.test.ts --no-cache

if %errorlevel% neq 0 (
  echo Domäntesterna misslyckades!
  exit /b %errorlevel%
)

echo.
echo Kör UI-exempeltest...
npx jest --config jest.ui.config.js components/examples/TestExample.test.tsx --no-cache 2>&1

if %errorlevel% neq 0 (
  echo UI-testerna misslyckades!
  exit /b %errorlevel%
)

echo.
echo Alla tester har avslutats framgångsrikt! 