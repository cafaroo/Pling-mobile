@echo off
echo Rensar Jest-cache...
npx jest --clearCache
echo Tar bort node_modules...
rmdir /s /q node_modules
echo Installerar beroenden igen...
npm install --legacy-peer-deps
echo Klar! Testa med: npm run test:domain 