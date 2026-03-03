[xml]$xml = Get-Content 'C:\Users\Victor Almeida\alisson\tmp_extract\document.xml' -Encoding utf8
$ns = @{w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

$paragraphs = $xml.SelectNodes('//w:p', ([System.Xml.XmlNamespaceManager]([System.Xml.XmlDocument]::new()).NameTable))
$nm = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$nm.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paras = $xml.SelectNodes('//w:p', $nm)
$output = @()
foreach ($p in $paras) {
    $texts = $p.SelectNodes('.//w:t', $nm)
    $line = ($texts | ForEach-Object { $_.InnerText }) -join ''
    $output += $line
}
$output | Out-File -FilePath 'C:\Users\Victor Almeida\alisson\tmp_extract\text_output.txt' -Encoding utf8
Write-Host "Done - $($output.Count) paragraphs"
