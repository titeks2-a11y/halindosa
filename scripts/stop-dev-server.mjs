import { spawnSync } from "node:child_process";

if (process.platform !== "win32") {
  process.exit(0);
}

const script = `
$connections = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
foreach ($connection in $connections) {
  $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
  if ($process -and ($process.ProcessName -like '*node*')) {
    Stop-Process -Id $process.Id -Force
  }
}
`;

spawnSync("powershell.exe", ["-NoProfile", "-Command", script], {
  stdio: "inherit"
});
