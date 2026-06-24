# One-time fix on server when git pull is not available.
# Run from: E:\ERP\Frontend-Next3\erp

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# 1) classbon icons shim
$libDir = Join-Path $root "lib"
New-Item -ItemType Directory -Path $libDir -Force | Out-Null
@'
export {
  Clock,
  MessageCircle as Message,
  Phone,
  Eye,
  User,
  Check,
  X,
} from "lucide-react";
'@ | Set-Content -Path (Join-Path $libDir "classbon-icons.tsx") -Encoding UTF8

# 2) verification-form — use ERP sign-in (no legacy imports)
$authComponents = Join-Path $root "app\(auth)\_components"
@'
'use client';

export { SignInForm as VerificationForm } from './sign-in-form';
'@ | Set-Content -Path (Join-Path $authComponents "verification-form.tsx") -Encoding UTF8

Write-Host "Patched lib/classbon-icons.tsx and app/(auth)/_components/verification-form.tsx" -ForegroundColor Green
Write-Host "Ensure tsconfig.json and next.config.ts are updated, then rebuild:" -ForegroundColor Cyan
Write-Host "  cd E:\ERP\Backend2"
Write-Host "  docker compose build frontend --no-cache"
