@echo off
set /p MYSQL_PASS="Enter your MySQL root password: "

echo.
echo Creating database 'polymarket_db'...
mysql -u root -p%MYSQL_PASS% -e "CREATE DATABASE IF NOT EXISTS polymarket_db;"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to create database. Please check your password.
    pause
    exit /b %errorlevel%
)

echo.
echo Importing schema tables...
mysql -u root -p%MYSQL_PASS% polymarket_db < database\schema.sql

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to import schema.
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Database 'polymarket_db' and tables created successfully!
pause
