# PowerShell script to update all localhost:3000 URLs to use environment variable

# Get all JSX files in src directory
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.jsx" | ForEach-Object { $_.FullName }

foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw
    $hasLocalhost = $content -match "http://localhost:3000"
    
    if ($hasLocalhost) {
        Write-Host "Updating $file"
        
        # Check if API_BASE_URL import already exists
        $hasImport = $content -match "import.*API_BASE_URL.*from.*utils/api"
        
        if (-not $hasImport) {
            # Add import statement after existing imports
            $content = $content -replace "(import.*from.*;)\n", "`$1`nimport { API_BASE_URL } from '../utils/api';"
        }
        
        # Replace all localhost:3000 URLs with API_BASE_URL
        $content = $content -replace "http://localhost:3000", "`${API_BASE_URL}"
        
        # Write back to file
        Set-Content -Path $file -Value $content
    }
}

Write-Host "All files updated successfully!"
Write-Host "Don't forget to add .env to your .gitignore file!"
