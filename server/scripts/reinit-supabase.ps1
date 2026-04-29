param(
  [switch]$Reset
)

$ErrorActionPreference = "Stop"

function Get-EnvValue {
  param(
    [string]$Content,
    [string]$Key
  )

  $pattern = "(?m)^$Key\s*=\s*\"?([^\r\n\"]+)"
  $match = [regex]::Match($Content, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  return $null
}

function Test-SupabaseUrl {
  param(
    [string]$Value,
    [string]$Name
  )

  try {
    $uri = [System.Uri]$Value
  } catch {
    throw "$Name is not a valid connection URL"
  }

  if ($uri.Scheme -notin @("postgresql", "postgres")) {
    throw "$Name must start with postgresql://"
  }

  return $uri
}

function Invoke-Step {
  param(
    [string]$Name,
    [string]$Command
  )

  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan
  Write-Host "    $Command"

  Invoke-Expression $Command

  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Name"
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Split-Path -Parent $scriptDir
Set-Location $serverDir

Write-Host "Working directory: $serverDir" -ForegroundColor Yellow

$envFile = Join-Path $serverDir ".env"
if (-not (Test-Path $envFile)) {
  throw ".env file not found at $envFile"
}

$envContent = Get-Content $envFile -Raw
if ($envContent -notmatch "DATABASE_URL=") {
  throw "DATABASE_URL is missing in .env"
}

if ($envContent -notmatch "DIRECT_URL=") {
  throw "DIRECT_URL is missing in .env"
}

$databaseUrlValue = Get-EnvValue -Content $envContent -Key "DATABASE_URL"
$directUrlValue = Get-EnvValue -Content $envContent -Key "DIRECT_URL"

if (-not $databaseUrlValue) {
  throw "DATABASE_URL is empty in .env"
}

if (-not $directUrlValue) {
  throw "DIRECT_URL is empty in .env"
}

$databaseUri = Test-SupabaseUrl -Value $databaseUrlValue -Name "DATABASE_URL"
$directUri = Test-SupabaseUrl -Value $directUrlValue -Name "DIRECT_URL"

if ($databaseUri.Host -notlike "*.pooler.supabase.com") {
  Write-Warning "DATABASE_URL usually should point to Supabase pooler host (*.pooler.supabase.com)."
}

if ($databaseUri.Port -ne 6543) {
  Write-Warning "DATABASE_URL usually should use port 6543 for Supabase pooling."
}

if ($directUri.Host -like "*.pooler.supabase.com") {
  throw "DIRECT_URL cannot use the pooler host. Use direct host db.<project-ref>.supabase.co:5432 from Supabase > Connect > ORMs > Prisma."
}

if ($directUri.Port -ne 5432) {
  Write-Warning "DIRECT_URL usually should use port 5432 for direct connection."
}

Invoke-Step -Name "Install dependencies" -Command "npm install"

if ($Reset) {
  Invoke-Step -Name "Reset DB and reseed" -Command "npm run db:reset"
} else {
  Invoke-Step -Name "Generate Prisma client" -Command "npm run db:generate"
  Invoke-Step -Name "Run migrations" -Command "npm run db:deploy"
  Invoke-Step -Name "Seed database" -Command "npm run db:seed"
}

Write-Host ""
Write-Host "Supabase database setup completed successfully." -ForegroundColor Green