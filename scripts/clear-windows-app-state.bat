@echo off
echo Clearing Miden Wallet app state...

if exist "%LOCALAPPDATA%\com.miden.wallet" (
    rmdir /s /q "%LOCALAPPDATA%\com.miden.wallet"
    echo Cleared: %LOCALAPPDATA%\com.miden.wallet
) else (
    echo Not found: %LOCALAPPDATA%\com.miden.wallet
)

if exist "%APPDATA%\com.miden.wallet" (
    rmdir /s /q "%APPDATA%\com.miden.wallet"
    echo Cleared: %APPDATA%\com.miden.wallet
) else (
    echo Not found: %APPDATA%\com.miden.wallet
)

echo.
echo Done! You can now launch Miden Wallet with fresh state.
pause
