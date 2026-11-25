@echo off
rem Copies the ML files from the unzipped package into your repo. Run it from inside the repo folder.
rem Usage:  install-ml-files.bat "C:\path\to\unzipped\smart-notifications-mlops"
rem The package folder is the one that contains the folders server, ml and .github.
rem It copies only the files this change needs. It never touches package.json, package-lock.json, README.md, client, ci.yml or dependabot.yml.
setlocal
set "PKG=%~1"
if "%PKG%"=="" (
    echo Usage: install-ml-files.bat "C:\path\to\unzipped\smart-notifications-mlops"
    exit /b 1
)
if not exist "%PKG%\server\src\services\smart-notifications\model-scorer.js" (
    echo Could not find the package files in "%PKG%".
    echo Point it at the folder that contains server, ml and .github.
    exit /b 1
)
if not exist ".git" (
    echo Run this from the root of your repo, the folder that contains .git
    exit /b 1
)

set "SN=server\src\services\smart-notifications"

robocopy "%PKG%\server\src\services" "server\src\services" smart-notification-service.js /NJH /NJS /NP /NDL
if errorlevel 8 goto failed
robocopy "%PKG%\%SN%" "%SN%" engine.js history-repository.js notification-hub.js model-monitoring.js model-scorer.js model-source.js /NJH /NJS /NP /NDL
if errorlevel 8 goto failed
robocopy "%PKG%\%SN%\rules" "%SN%\rules" cutoff-risk.js weekday-pattern.js late-risk.js /NJH /NJS /NP /NDL
if errorlevel 8 goto failed
robocopy "%PKG%\server\tests\unit\smart-notifications" "server\tests\unit\smart-notifications" units.test.js model.test.js model-fixtures.js mlops.test.js /NJH /NJS /NP /NDL
if errorlevel 8 goto failed
robocopy "%PKG%\ml" "ml" /E /XD __pycache__ .pytest_cache /NJH /NJS /NP /NDL
if errorlevel 8 goto failed
robocopy "%PKG%\.github\workflows" ".github\workflows" retrain-smart-notification-models.yml monitor-smart-notification-models.yml /NJH /NJS /NP /NDL
if errorlevel 8 goto failed
robocopy "%PKG%\server" "server" schema.mlops.additions.prisma /NJH /NJS /NP /NDL
if errorlevel 8 goto failed

if not exist "%SN%\model" mkdir "%SN%\model"
if not exist "%SN%\model\.gitkeep" type nul > "%SN%\model\.gitkeep"

echo.
echo Done. Not copied on purpose, do these by hand: .github\workflows\ci.yml and .github\dependabot.yml.
echo Next: run "git status --short" and "git diff" to review what changed, then "cd server" and "npm test".
exit /b 0

:failed
echo.
echo A copy step failed. Nothing else was copied after the failure. Send me the messages above.
exit /b 1
