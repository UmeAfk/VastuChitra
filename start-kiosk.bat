@echo off
rem ============================================================
rem  Vastuchitra — start the PC helper, then open the launcher
rem  TRUE full-screen kiosk on the touch display.
rem  (For normal browser access - e.g. to reach the Admin Panel
rem  without the kiosk restrictions - use start-web.bat instead.)
rem ============================================================
cd /d "%~dp0"

rem 1) the helper (serves the page and starts programs)
start "Vastuchitra helper" /min node server.js
timeout /t 2 /nobreak >nul

rem 2) find a real browser executable. Relying on "chrome" being on PATH
rem    fails silently on most Windows installs (Chrome isn't added to
rem    PATH by default) - that's the usual reason kiosk mode doesn't
rem    actually go full screen. Check the real install locations instead.
set "BROWSER="
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do (
  if not defined BROWSER if exist %%~P set "BROWSER=%%~P"
)

if not defined BROWSER (
  echo Couldn't find Chrome or Edge in their usual install folders.
  echo Opening in your default browser instead - it won't be full-screen kiosk mode.
  start "" "http://localhost:4000/?kiosk"
  goto :eof
)

rem 3) the launcher, TRUE full-screen kiosk - no browser chrome at all.
rem    --kiosk and --start-fullscreen together so it goes full screen even
rem    on setups where one of the two flags alone gets ignored.
rem    - its own profile folder, so an already-open browser window doesn't
rem      just hand off the URL and ignore these flags
rem    - to put it on the SECOND monitor, change --window-position=0,0
rem      to that monitor's left edge, e.g. --window-position=1920,0
start "" "%BROWSER%" --kiosk --start-fullscreen "http://localhost:4000/?kiosk" ^
  --user-data-dir="%TEMP%\vastuchitra-ui" ^
  --window-position=0,0 ^
  --overscroll-history-navigation=0 ^
  --disable-pinch ^
  --noerrdialogs --disable-infobars --no-first-run ^
  --autoplay-policy=no-user-gesture-required
