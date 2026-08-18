# Alinart — catálogo de produtos

Catálogo estático da Alinart com filtros, busca, carregamento progressivo, carrinho persistente e preparação de pedido para WhatsApp/JSON.

## Como abrir

Abra `index.html` diretamente no navegador ou use a extensão **Live Server** no VS Code.

## Personalização rápida

- Produtos, preços e categorias: edite `data/products.json` e replique a alteração em `data/products.js`, ou atualize o CSV da raiz e execute `gerar-base.ps1`.
- Cores e estilo: edite as variáveis no início de `styles.css`.
- WhatsApp: os pedidos são direcionados para `+55 79 98150-0406`; o número fica configurado em `app.js`.
- Capas locais: `assets/catalogo` contém uma imagem representativa de cada publicação.

## Base de produtos

- `data/products.json`: base portátil para integrações futuras.
- `data/products.js`: mesma base pronta para funcionar ao abrir o HTML sem servidor.
- `data/product-names.json`: nomes descritivos revisados para cada item.
- Cada publicação é um produto e o campo `images` preserva todas as fotos do respectivo carrossel.
- Os nomes são provisórios e os preços estão como `null`/“Sob consulta”, pois essas informações não existem no arquivo original.

O JSON gerado contém cliente, observações, itens, quantidades, subtotais, total, moeda e data de criação.
