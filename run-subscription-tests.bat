@echo off
echo Kör subscription-tester...
yarn jest --selectProjects=subscription --testPathPattern=src/application/subscription
echo Test completed! 