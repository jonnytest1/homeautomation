param (
  [Parameter(Mandatory = $true)]
  [IntPtr]$windowId, # The handle of the window (HWND)

  [Parameter(Mandatory = $true)]
  [int]$X, # X position

  [Parameter(Mandatory = $true)]
  [int]$Y, # Y position

  [Parameter(Mandatory = $true)]
  [int]$Width, # Width of the window

  [Parameter(Mandatory = $true)]
  [int]$Height, # Height of the window

  [Parameter(Mandatory = $true)]
  [ValidateSet("maximize", "minimize", "normal")]
  [string]$windowState  # Window state (maximize, minimize, or normal)
)



Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WindowManipulation {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern IntPtr GetConsoleWindow();

    [DllImport("user32.dll", SetLastError=true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int x, int y, int cx, int cy, uint uFlags);


    public static readonly IntPtr HWND_TOP = IntPtr.Zero;
    public const uint SWP_NOZORDER = 0x0004;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_SHOWWINDOW = 0x0040;

    
    public const int SW_MAXIMIZE = 3;
    public const int SW_MINIMIZE = 6; 
    public const int SW_RESTORE = 9;
}
"@

switch ($windowState) {
  "maximize" {
    # Maximize the window
    [WindowManipulation]::ShowWindow($windowId, [WindowManipulation]::SW_MAXIMIZE)
  }
  "minimize" {
    # Minimize the window
    [WindowManipulation]::ShowWindow($windowId, [WindowManipulation]::SW_MINIMIZE)
  }
  "normal" {
    # Set the window's position and size normally
    [WindowManipulation]::SetWindowPos($windowId, [WindowManipulation]::HWND_TOP, $X, $Y, $Width, $Height, [WindowManipulation]::SWP_NOZORDER -bor [WindowManipulation]::SWP_SHOWWINDOW)
  }
  default {
    Write-Host "Invalid window state. Please specify 'maximize', 'minimize', or 'normal'."
  }
}

#[WindowManipulation]::SetWindowPos($hWnd, [WindowManipulation]::HWND_TOP, $newX, $newY, 0, 0, [WindowManipulation]::SWP_NOSIZE -bor [WindowManipulation]::SWP_SHOWWINDOW)


