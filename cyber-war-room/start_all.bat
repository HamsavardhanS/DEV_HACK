@echo off
title Cyber War Room - Launcher
echo ============================================
echo   Cyber War Room - Starting All Services
echo ============================================
echo.

:: Load GROQ_API_KEY from .env file
if exist "%~dp0.env" (
    echo [*] Loading environment variables from .env...
    for /f "delims=" %%L in (%~dp0.env) do set "%%L"
) else (
    echo [!] No .env file found. Create one with GROQ_API_KEY=your-key
)

:: Verify key is loaded
if defined GROQ_API_KEY (
    echo [*] GROQ_API_KEY loaded successfully.
) else (
    echo [!] WARNING: GROQ_API_KEY is not set. LLM agent will use fallback mode.
)

:: Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo [*] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo [!] No venv found. Using system Python.
)

:: Install dependencies
echo [*] Installing Python dependencies...
pip install -r requirements.txt >nul 2>&1

echo.
echo [1/9] Starting Monitoring Agent...
start "Monitoring Agent" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python agents/monitoring.py"

echo [2/9] Starting Threat Intel Agent...
start "Threat Intel Agent" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python agents/threat_intel.py"

echo [3/9] Starting Risk Assessment Agent...
start "Risk Assessment Agent" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python agents/risk_assessment.py"

echo [4/9] Starting Response Agent...
start "Response Agent" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python agents/response.py"

echo [5/9] Starting Forensic Logging Agent...
start "Forensic Agent" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python agents/forensic.py"

echo [6/9] Starting Learning Agent...
start "Learning Agent" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python agents/learning.py"

echo [7/9] Starting LLM SOC Analyst Agent...
start "LLM SOC Analyst" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python agents/llm_soc_analyst.py"

echo [8/9] Starting Flask API Server...
start "Flask API" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat 2>nul && python api.py"

echo [9/9] Starting React Frontend...
start "Frontend Dev Server" cmd /k "cd /d %~dp0\frontend && pnpm dev"

echo.
echo ============================================
echo   All services launched in separate windows!
echo ============================================
echo.
echo   Agents:    6 core + 1 LLM SOC Analyst
echo   API:       http://localhost:5000
echo   Frontend:  http://localhost:3000
echo.
echo   To simulate attacks, run in a new terminal:
echo     python simulate_attack.py
echo.
echo   Press any key to STOP all services...
echo.
pause >nul

echo.
echo [*] Shutting down all services...

:: Kill each spawned window by its title
taskkill /FI "WINDOWTITLE eq Monitoring Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Threat Intel Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Risk Assessment Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Response Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Forensic Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Learning Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq LLM SOC Analyst*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Flask API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Dev Server*" /F >nul 2>&1

echo.
echo ============================================
echo   All services stopped. Goodbye!
echo ============================================
