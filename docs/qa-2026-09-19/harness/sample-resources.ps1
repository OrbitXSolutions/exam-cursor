param([int]$DurationSeconds = 900, [int]$IntervalSeconds = 5, [string]$RunName = 'phase11-load')
$qaOutput = Join-Path $PSScriptRoot ($RunName + '-resources.jsonl')
$qaStarted = [DateTime]::UtcNow
$qaCpuCount = [Environment]::ProcessorCount
$qaMemory = Get-CimInstance Win32_OperatingSystem
@{kind='host';utc=$qaStarted.ToString('o');logicalProcessors=$qaCpuCount;totalMemoryMb=[Math]::Round($qaMemory.TotalVisibleMemorySize/1024,2);freeMemoryMb=[Math]::Round($qaMemory.FreePhysicalMemory/1024,2);classification='ACTUAL HOST PROCESS MEASUREMENT; workload phase is established separately from its execution manifest'} | ConvertTo-Json -Compress | Set-Content -LiteralPath $qaOutput
$qaPrevious = @{}
while (([DateTime]::UtcNow - $qaStarted).TotalSeconds -lt $DurationSeconds) {
  foreach ($qaTarget in @(@{name='api';port=5221},@{name='next';port=3000})) {
    $qaNow = [DateTime]::UtcNow
    try {
      $qaListener = Get-NetTCPConnection -LocalPort $qaTarget.port -State Listen -ErrorAction Stop | Select-Object -First 1 -ExpandProperty OwningProcess
      $qaProcess = Get-Process -Id $qaListener -ErrorAction Stop
      $qaPreviousSample = $qaPrevious[$qaTarget.name]
      $qaCpuPercent = $null
      if ($qaPreviousSample -and $qaPreviousSample.pid -eq $qaListener) {
        $qaElapsed = ($qaNow - $qaPreviousSample.utc).TotalSeconds
        $qaCpuPercent = [Math]::Round(100 * ($qaProcess.CPU - $qaPreviousSample.cpu) / $qaElapsed / $qaCpuCount,3)
      }
      $qaRow = @{kind='process';utc=$qaNow.ToString('o');name=$qaTarget.name;pid=$qaListener;cpuTotalSeconds=$qaProcess.CPU;hostCpuPercent=$qaCpuPercent;workingSetMb=[Math]::Round($qaProcess.WorkingSet64/1MB,2);privateMemoryMb=[Math]::Round($qaProcess.PrivateMemorySize64/1MB,2);threadCount=$qaProcess.Threads.Count;handleCount=$qaProcess.HandleCount}
      $qaRow | ConvertTo-Json -Compress | Add-Content -LiteralPath $qaOutput
      $qaPrevious[$qaTarget.name] = @{pid=$qaListener;utc=$qaNow;cpu=$qaProcess.CPU}
    } catch {
      @{kind='measurement-error';utc=$qaNow.ToString('o');name=$qaTarget.name;message=$_.Exception.Message} | ConvertTo-Json -Compress | Add-Content -LiteralPath $qaOutput
    }
  }
  if (Test-Path -LiteralPath (Join-Path $PSScriptRoot ($RunName + '.stop'))) { break }
  Start-Sleep -Seconds $IntervalSeconds
}
@{kind='end';utc=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json -Compress | Add-Content -LiteralPath $qaOutput
Write-Output $qaOutput
