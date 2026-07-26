# PowerShell Deployment Script for Windows
$ErrorActionPreference = "Stop"

Write-Host "Building project..."
python hash.py

Write-Host "Creating temporary commit..."
git add -f build
git commit -m "temp build commit"

Write-Host "Pushing to gh-pages..."
$BUILD_COMMIT = (git subtree split --prefix build HEAD).Trim()
git push origin "${BUILD_COMMIT}:gh-pages" --force

Write-Host "Cleaning up temporary commit..."
git reset --hard HEAD~

Write-Host "Removing untracked files..."
git clean -fd

if (Test-Path build) {
    Remove-Item -Recurse -Force build
}

Write-Host "Deployment complete!"
