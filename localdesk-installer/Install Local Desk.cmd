@echo off
setlocal
cd /d "%~dp0"
title Install Local Desk
echo Local Desk - Windows 11 starter setup
echo.
echo This sets up Python and Microsoft Foundry Local when needed,
echo installs Local Desk for your Windows account, and downloads starter models.
echo Image/video runtimes and cloud provider accounts are separate.
echo Review the included source and README before proceeding.
echo.
choice /C YN /M "Continue with setup"
if errorlevel 2 exit /b 0
set "DESK_PY="
for %%P in ("%LOCALAPPDATA%\Programs\Python\Python313-arm64\python.exe" "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" "%ProgramFiles%\Python313\python.exe") do if exist "%%~P" set "DESK_PY=%%~P"
if defined DESK_PY goto run_setup
where winget.exe >nul 2>nul
if errorlevel 1 (
  echo Install Windows App Installer from Microsoft Store, then run this setup again.
  pause
  exit /b 1
)
echo Installing Python 3.13 for the current user. Review any package agreement or Windows prompt.
winget install --id Python.Python.3.13 --exact --scope user --source winget
if errorlevel 1 (
  echo Python setup failed or was cancelled. Resolve the message above, then rerun setup.
  pause
  exit /b 1
)
for %%P in ("%LOCALAPPDATA%\Programs\Python\Python313-arm64\python.exe" "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" "%ProgramFiles%\Python313\python.exe") do if exist "%%~P" set "DESK_PY=%%~P"
if not defined DESK_PY (
  echo Python was not found in its standard installation folders.
  echo Run install.py manually with Python 3.10 or newer, or rerun after restarting Windows.
  pause
  exit /b 1
)
:run_setup
"%DESK_PY%" "%~dp0install.py"
if errorlevel 1 (
  echo.
  echo Setup did not complete. Review the message above. Rerun this file to resume.
  pause
  exit /b 1
)
echo.
pause
