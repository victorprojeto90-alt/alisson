Add-Type -AssemblyName System.IO.Compression.FileSystem
$path = 'C:\Users\Victor Almeida\alisson\tmp_extract\login.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
$content = $reader.ReadToEnd()
$reader.Dispose()
$stream.Dispose()
$zip.Dispose()
$content | Out-File -FilePath 'C:\Users\Victor Almeida\alisson\tmp_extract\document.xml' -Encoding utf8
Write-Host "Done"
