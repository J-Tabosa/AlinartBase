$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceDir = Split-Path -Parent $projectDir
$csvPath = Join-Path $workspaceDir 'alinart_aju_imagens.csv'
$dataDir = Join-Path $projectDir 'data'
$catalogDir = Join-Path $projectDir 'assets\catalogo'

if (-not (Test-Path -LiteralPath $csvPath)) {
    throw "Arquivo não encontrado: $csvPath"
}

New-Item -ItemType Directory -Path $dataDir -Force | Out-Null

$rows = Import-Csv -LiteralPath $csvPath
$groups = $rows | Group-Object publicacao
$categories = @{}

for ($index = 1; $index -le $groups.Count; $index++) {
    $categories[$index] = 'Casa & decoração'
}

function Set-Category([string]$category, [int[]]$indices) {
    foreach ($index in $indices) {
        $categories[$index] = $category
    }
}

Set-Category 'Bolsas' @(
    (1..8) + (10..15) + (19..21) + @(29, 34, 38, 39, 43, 44) +
    (59..61) + (64..66) + @(68, 69) + (71..79) + (85..89) + (91..97) +
    (99..103) + (105..111) + (113..115) + @(119, 120, 123) + (125..128) +
    @(133, 134, 138, 139) + (142..146) + @(149, 150, 153, 155, 158, 159, 161)
)

Set-Category 'Amigurumis' @(
    (16..18) + (22..24) + (26..28) + (30..33) + @(36, 37) + (40..42) +
    (45..50) + @(52) + (54..56) + @(81, 83, 130, 136, 137)
)

Set-Category 'Acessórios' @(
    53, 62, 67, 70, 90, 129, 148, 156, 164, 175, 188, 193
)

Set-Category 'Organizadores' @(
    @(9, 25, 58, 63, 80, 84, 98, 104, 112) + (116..118) +
    @(131, 132, 140, 141, 157, 162)
)

Set-Category 'Moda bebê' @(51, 152, 154, 170, 173)
Set-Category 'Pet' @(147)
Set-Category 'Institucional' @(196)

$namePrefixes = @{
    'Bolsas' = 'Bolsa artesanal'
    'Amigurumis' = 'Amigurumi'
    'Acessórios' = 'Acessório artesanal'
    'Organizadores' = 'Organizador em crochê'
    'Moda bebê' = 'Peça para bebê'
    'Casa & decoração' = 'Peça de decoração'
    'Pet' = 'Acessório pet'
    'Institucional' = 'Alinart Artes & Cia'
}

$categoryCounters = @{}
$products = @()

for ($position = 0; $position -lt $groups.Count; $position++) {
    $number = $position + 1
    $group = $groups[$position]
    $shortcode = ($group.Name.TrimEnd('/') -split '/')[-1]
    $category = $categories[$number]

    if (-not $categoryCounters.ContainsKey($category)) {
        $categoryCounters[$category] = 0
    }
    $categoryCounters[$category]++

    $coverFile = Get-ChildItem -LiteralPath $catalogDir -Filter ("{0:D3}-*.webp" -f $number) | Select-Object -First 1
    if (-not $coverFile) {
        throw "Capa local não encontrada para o item $number"
    }

    $displayNumber = $categoryCounters[$category].ToString('D3')
    $name = if ($category -eq 'Institucional') {
        $namePrefixes[$category]
    } else {
        "$($namePrefixes[$category]) $displayNumber"
    }

    $products += [ordered]@{
        id = "ALI-{0:D3}" -f $number
        name = $name
        category = $category
        description = 'Peça artesanal publicada pela Alinart. Nome, disponibilidade e valor devem ser confirmados no atendimento.'
        price = $null
        priceLabel = 'Sob consulta'
        available = $true
        featured = ($number -le 12)
        cover = "assets/catalogo/$($coverFile.Name)"
        images = @($group.Group | ForEach-Object { $_.imagem })
        imageCount = $group.Count
        sourcePost = $group.Name
        sortOrder = $number
    }
}

$json = $products | ConvertTo-Json -Depth 6
$jsonPath = Join-Path $dataDir 'products.json'
$jsPath = Join-Path $dataDir 'products.js'

[System.IO.File]::WriteAllText($jsonPath, $json, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText($jsPath, "window.ALINART_PRODUCTS = $json;", [System.Text.UTF8Encoding]::new($false))

Write-Output "Produtos: $($products.Count)"
Write-Output "Fotos referenciadas: $($rows.Count)"
Write-Output "JSON: $jsonPath"
Write-Output "JavaScript: $jsPath"
