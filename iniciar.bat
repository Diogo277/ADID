@echo off
REM Script para iniciar o projeto facilmente no Windows

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║  🎨 Acessibilidade para Deuteranopia com ML           ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado! Instale Python 3.7+
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

REM Menu de opções
echo Escolha uma opção:
echo.
echo 1) Treinar o modelo ML
echo 2) Iniciar servidor Flask
echo 3) Treinar e iniciar servidor
echo.

set /p opcao="Digite a opção (1-3): "

if "%opcao%"=="1" (
    echo.
    echo 🤖 Treinando modelo ML...
    python server\treinar_modelo.py
    pause
) else if "%opcao%"=="2" (
    echo.
    echo 🚀 Iniciando servidor Flask em http://127.0.0.1:5000 ...
    python server\app.py
) else if "%opcao%"=="3" (
    echo.
    echo 🤖 Treinando modelo...
    python server\treinar_modelo.py
    echo.
    echo 🚀 Iniciando servidor...
    python server\app.py
) else (
    echo.
    echo ❌ Opção inválida!
    pause
)
