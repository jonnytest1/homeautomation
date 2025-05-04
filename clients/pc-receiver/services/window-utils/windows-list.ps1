[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
	
	[DllImport("user32.dll", SetLastError=true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int x, int y, int cx, int cy, uint uFlags);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
	
	[DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowPlacement(IntPtr hWnd, out WINDOWPLACEMENT lpwndpl);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
	
	[StructLayout(LayoutKind.Sequential)]
    public struct WINDOWPLACEMENT {
        public int length;
        public int flags;
        public int showCmd;  // 1 = SW_SHOWNORMAL, 3 = SW_MAXIMIZE, 2 = SW_MINIMIZE
        public RECT rcNormalPosition;
        public RECT rcMonitorPosition;
    }
	
	public static readonly IntPtr HWND_TOP = new IntPtr(0);
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOZORDER = 0x0004;
    public const uint SWP_SHOWWINDOW = 0x0040;
}
"@


$sb = New-Object System.Text.StringBuilder 1024
$windowlist = New-Object System.Collections.Generic.List[PSObject]


$callback = [Win32+EnumWindowsProc] {
  param($hWnd, $lParam)

  if ([Win32]::IsWindowVisible($hWnd)) {
    # Get the window title
    [Win32]::GetWindowText($hWnd, $sb, $sb.Capacity)
    $windowTitle = $sb.ToString()
		
    if ($windowTitle) {
      Write-Host "Window Title: $windowTitle"
      $prid = 0
      [Win32]::GetWindowThreadProcessId($hWnd, [ref]$prid)
      $process = Get-WmiObject -Class Win32_Process -Filter "ProcessId = $prid"
      $commandLine = $process.CommandLine
      Write-Host "Command Line: $commandLine"
			
      $rect = New-Object Win32+RECT
      if ([Win32]::GetWindowRect($hWnd, [ref]$rect)) {
        $left = $rect.Left
        $top = $rect.Top
        $right = $rect.Right
        $bottom = $rect.Bottom
        $width = $right - $left
        $height = $bottom - $top

        # Print the window title and position
        #if ($windowTitle) {
        Write-Host "Position: X=$left, Y=$top, Width=$width, Height=$height"
        #}
      }
      $placement = New-Object Win32+WINDOWPLACEMENT
      if ([Win32]::GetWindowPlacement($hWnd, [ref]$placement)) {
        $state = ""
        switch ($placement.showCmd) {
          1 { $state = "Normal" }
          2 { $state = "Minimized" }
          3 { $state = "Maximized" }
        }

        # Print the window title, position, size, and state
        #
        Write-Host "State: $state"
        #}
      }
		
			
      if ($windowTitle -like "*Notepad++*") {
				
        #$newX = 500
        #$newY = 500
				
				
        #[Win32]::SetWindowPos($hWnd, [Win32]::HWND_TOP, $newX, $newY, 0, 0, [Win32]::SWP_NOSIZE -bor [Win32]::SWP_SHOWWINDOW)
                
        #Write-Host "Window moved to new position: X=$newX, Y=$newY"
      }
			
      $windowInfo = New-Object PSObject -property @{
        windowRef = $hWnd
        title     = $windowTitle
        position  = $rect
        state     = $state
        process   = $process | ConvertTo-Json -Depth 1 | ConvertFrom-Json
      }
      #$windowInfo | ConvertTo-Json -Depth 3 | Write-Output
      # Add the window information object to the array
     
      $windowlist.Add($windowInfo)
      
      #Write-Host $windowlist | ConvertTo-Json | Write-Output
      Write-Host "-----"
    }
		
		
  }

  return $true
}

[Win32]::EnumWindows($callback, [IntPtr]::Zero)

$json = $windowlist | ConvertTo-Json 

Write-Host "----debug-finished----"

$json