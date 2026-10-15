param(
  [Parameter(Mandatory = $true)]
  [int] $ProcessId,
  [ValidateSet('maximized', 'normal', 'minimized')]
  [string] $WindowMode = 'maximized',
  [string] $Resolution = 'native',
  [int] $ResolutionWidth = 1920,
  [int] $ResolutionHeight = 1080,
  [ValidateSet('primary', 'secondary')]
  [string] $DisplayTarget = 'primary'
)

# Wait for the launched GUI (or a child it started) to create a window, then
# maximize and activate it. This runs detached from the HTTP request so app
# startup time does not delay the launcher response.
$signature = @'
using System;
using System.Runtime.InteropServices;
public static class LauncherWindow {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr SetActiveWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool attach);
  public static IntPtr[] FindWindows(int[] processIds) {
    var found = new System.Collections.Generic.List<IntPtr>();
    EnumWindows((hWnd, lParam) => {
      uint owner = 0;
      GetWindowThreadProcessId(hWnd, out owner);
      if (!IsWindowVisible(hWnd) || GetWindow(hWnd, 4) != IntPtr.Zero) return true;
      for (int i = 0; i < processIds.Length; i++) {
        if (owner == (uint)processIds[i]) { found.Add(hWnd); break; }
      }
      return true;
    }, IntPtr.Zero);
    return found.ToArray();
  }
}
'@
Add-Type -TypeDefinition $signature -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue

$knownIds = [System.Collections.Generic.HashSet[int]]::new()
[void] $knownIds.Add($ProcessId)
$lastTreeScan = [datetime]::MinValue
$deadline = [datetime]::UtcNow.AddSeconds(90)

while ([datetime]::UtcNow -lt $deadline) {
  if (([datetime]::UtcNow - $lastTreeScan).TotalMilliseconds -ge 900) {
    $lastTreeScan = [datetime]::UtcNow
    foreach ($parentId in @($knownIds)) {
      try {
        Get-CimInstance Win32_Process -Filter "ParentProcessId = $parentId" -ErrorAction Stop |
          ForEach-Object { [void] $knownIds.Add([int] $_.ProcessId) }
      } catch { }
    }
  }

  foreach ($handle in [LauncherWindow]::FindWindows([int[]] @($knownIds))) {
    try {
      $screens = [System.Windows.Forms.Screen]::AllScreens
      $screen = $screens | Where-Object { $_.Primary } | Select-Object -First 1
      if ($DisplayTarget -eq 'secondary' -and $screens.Count -gt 1) {
        $screen = $screens | Where-Object { -not $_.Primary } | Select-Object -First 1
      }
      $bounds = $screen.Bounds
      $size = $null
      if ($Resolution -eq 'custom') { $size = @($ResolutionWidth, $ResolutionHeight) }
      elseif ($Resolution -match '^(\d{3,4})x(\d{3,4})$') { $size = @([int] $Matches[1], [int] $Matches[2]) }
      if ($WindowMode -ne 'maximized' -and $size) {
        $width = [Math]::Min($bounds.Width, [Math]::Max(640, $size[0]))
        $height = [Math]::Min($bounds.Height, [Math]::Max(480, $size[1]))
        $x = $bounds.Left + [Math]::Max(0, [int](($bounds.Width - $width) / 2))
        $y = $bounds.Top + [Math]::Max(0, [int](($bounds.Height - $height) / 2))
        [void] [LauncherWindow]::SetWindowPos($handle, [IntPtr]::Zero, $x, $y, $width, $height, 0x40)
      } elseif ($WindowMode -eq 'maximized') {
        # Place the window on the chosen monitor before Windows computes its
        # maximized work area.
        [void] [LauncherWindow]::SetWindowPos($handle, [IntPtr]::Zero, $bounds.Left, $bounds.Top, 0, 0, 0x15)
      } elseif ($WindowMode -eq 'normal') {
        # Keep the app's own size when no explicit window size is selected, but
        # move it onto the requested monitor instead of leaving it off-screen.
        [void] [LauncherWindow]::SetWindowPos($handle, [IntPtr]::Zero, ($bounds.Left + 80), ($bounds.Top + 80), 0, 0, 0x15)
      }

      if ($WindowMode -eq 'minimized') {
        [void] [LauncherWindow]::ShowWindowAsync($handle, 6)
        exit 0
      }

      # Restore first so normal/maximized startup works even for minimized apps.
      [void] [LauncherWindow]::ShowWindowAsync($handle, 9)
      if ($WindowMode -eq 'maximized') { [void] [LauncherWindow]::ShowWindowAsync($handle, 3) }

      # Attach input queues briefly to improve activation when the local helper
      # is not itself the foreground process.
      $foreground = [LauncherWindow]::GetForegroundWindow()
      [uint32] $foregroundPid = 0
      $foregroundThread = if ($foreground -ne [IntPtr]::Zero) {
        [LauncherWindow]::GetWindowThreadProcessId($foreground, [ref] $foregroundPid)
      } else { 0 }
      [uint32] $targetWindowPid = 0
      $targetThread = [LauncherWindow]::GetWindowThreadProcessId($handle, [ref] $targetWindowPid)
      $currentThread = [LauncherWindow]::GetCurrentThreadId()
      $attachedTarget = $false
      $attachedForeground = $false
      try {
        if ($targetThread -and $targetThread -ne $currentThread) {
          $attachedTarget = [LauncherWindow]::AttachThreadInput($currentThread, $targetThread, $true)
        }
        if ($foregroundThread -and $foregroundThread -ne $currentThread -and $foregroundThread -ne $targetThread) {
          $attachedForeground = [LauncherWindow]::AttachThreadInput($currentThread, $foregroundThread, $true)
        }
        # A temporary topmost raise also covers the launcher if Windows refuses
        # foreground activation because the helper was started in the background.
        [void] [LauncherWindow]::SetWindowPos($handle, [IntPtr](-1), 0, 0, 0, 0, 0x53)
        [void] [LauncherWindow]::BringWindowToTop($handle)
        [void] [LauncherWindow]::SetForegroundWindow($handle)
        [void] [LauncherWindow]::SetActiveWindow($handle)
        [void] [LauncherWindow]::SetWindowPos($handle, [IntPtr](-2), 0, 0, 0, 0, 0x53)
      } finally {
        if ($attachedForeground) { [void] [LauncherWindow]::AttachThreadInput($currentThread, $foregroundThread, $false) }
        if ($attachedTarget) { [void] [LauncherWindow]::AttachThreadInput($currentThread, $targetThread, $false) }
      }
      exit 0
    } catch { }
  }
  Start-Sleep -Milliseconds 300
}

exit 0
