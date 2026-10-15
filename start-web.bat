@echo off
rem ============================================================
rem  Vastuchitra - start the PC helper, then open the launcher
rem  AND the Admin Panel as normal, resizable browser windows.
rem
rem  Use THIS for setup, testing, and everyday editing - it opens
rem  in your regular browser with the address bar, tabs, etc, and
rem  none of the kiosk restrictions apply (Customize/Reset/Admin
rem  are visible immediately, no need to hold the logo).
rem
rem  Use start-kiosk.bat for the actual touch-screen display.
rem ============================================================
cd /d "%~dp0"

rem 1) the helper (serves both pages and starts/stops programs)
start "Vastuchitra helper" /min node server.js
timeout /t 2 /nobreak >nul

rem 2) the launcher, as a normal window (no ?kiosk, so nothing is hidden)
start "" "http://localhost:4000/"
timeout /t 1 /nobreak >nul

rem 3) the Admin Panel, in its own window/tab right alongside it
start "" "http://localhost:4000/admin.html"
