$content = Get-Content -Raw -Encoding UTF8 admin.html

# Remove the admin-brand block (logo + name)
$content = $content -replace '(?s)    <div class="admin-brand">.*?</div>\r?\n\r?\n    <!-- Tab navigation -->', '    <!-- Tab navigation -->'

# Remove the Save Changes button
$content = $content -replace '(?s)      <button type="button" class="btn primary" id="btnSaveAll">.*?</button>\r?\n    </div>', '    </div>'

Set-Content -Encoding UTF8 admin.html $content
Write-Host "Done patching admin.html"
