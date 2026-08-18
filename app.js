const PRODUCTS = Array.isArray(window.ALINART_PRODUCTS) ? window.ALINART_PRODUCTS : [];
const PAGE_SIZE = 24;

const state = {
  category: "Todos",
  search: "",
  sort: "featured",
  visible: PAGE_SIZE,
  cart: readCart(),
};

const $ = (selector) => document.querySelector(selector);

function readCart() {
  try {
    return JSON.parse(localStorage.getItem("alinart-cart") || "{}");
  } catch {
    return {};
  }
}

function money(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function productPrice(product) {
  return Number.isFinite(product.price) ? money(product.price) : product.priceLabel || "Sob consulta";
}

function renderFilters() {
  const categories = ["Todos", ...new Set(PRODUCTS.map((product) => product.category))];
  $("#filters").innerHTML = categories
    .map((category) => `<button class="filter-button ${state.category === category ? "active" : ""}" type="button" data-category="${category}">${category}</button>`)
    .join("");
}

function filteredProducts() {
  const term = state.search.toLocaleLowerCase("pt-BR").trim();
  const list = PRODUCTS.filter((product) => {
    const matchesCategory = state.category === "Todos" || product.category === state.category;
    const searchable = `${product.name} ${product.category} ${product.id}`.toLocaleLowerCase("pt-BR");
    return matchesCategory && searchable.includes(term);
  });

  if (state.sort === "lowest") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (state.sort === "highest") list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (state.sort === "featured") list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder);

  return list;
}

function renderProducts() {
  const products = filteredProducts();
  const visibleProducts = products.slice(0, state.visible);
  const grid = $("#product-grid");
  grid.innerHTML = "";

  visibleProducts.forEach((product) => {
    const card = $("#product-template").content.cloneNode(true);
    const image = card.querySelector(".product-photo");

    image.src = product.cover;
    image.alt = product.name;
    image.addEventListener("error", () => {
      image.removeAttribute("src");
      image.alt = `Imagem indisponível — ${product.name}`;
    });

    card.querySelector(".product-badge").textContent = product.featured ? "Destaque" : "";
    card.querySelector(".product-category").textContent = product.category;
    card.querySelector(".product-name").textContent = product.name;
    card.querySelector(".product-price").textContent = productPrice(product);
    card.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => addToCart(product.id)));
    grid.append(card);
  });

  $("#result-count").textContent = `${products.length} ${products.length === 1 ? "peça" : "peças"}`;
  $("#empty-state").hidden = products.length > 0;
  $("#load-more").hidden = state.visible >= products.length;
}

function saveCart() {
  localStorage.setItem("alinart-cart", JSON.stringify(state.cart));
  renderCart();
}

function addToCart(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  openCart();
}

function updateQuantity(id, difference) {
  state.cart[id] = (state.cart[id] || 0) + difference;
  if (state.cart[id] <= 0) delete state.cart[id];
  saveCart();
}

function cartDetails() {
  return PRODUCTS.filter((product) => state.cart[product.id]).map((product) => ({
    ...product,
    quantity: state.cart[product.id],
    subtotal: Number.isFinite(product.price) ? product.price * state.cart[product.id] : null,
  }));
}

function renderCart() {
  const items = cartDetails();
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const pricedItems = items.filter((item) => Number.isFinite(item.subtotal));
  const allPriced = items.length > 0 && pricedItems.length === items.length;
  const total = pricedItems.reduce((sum, item) => sum + item.subtotal, 0);

  $("#cart-count").textContent = quantity;
  $("#cart-empty").hidden = items.length > 0;
  $("#cart-checkout").hidden = items.length === 0;
  $("#cart-total").textContent = allPriced ? money(total) : "A combinar";

  $("#cart-items").innerHTML = items.map((item) => `
    <article class="cart-item">
      <div class="cart-thumb"><img src="${item.cover}" alt="${item.name}" loading="lazy" /></div>
      <div>
        <h3>${item.name}</h3>
        <p>${productPrice(item)}</p>
        <div class="quantity">
          <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-action="remove" data-id="${item.id}" aria-label="Remover ${item.name}">×</button>
    </article>`).join("");
}

function buildOrder() {
  const items = cartDetails();
  const allPriced = items.length > 0 && items.every((item) => Number.isFinite(item.subtotal));

  return {
    source: "catalogo-alinart",
    createdAt: new Date().toISOString(),
    customer: {
      name: $("#customer-name").value.trim(),
      notes: $("#customer-notes").value.trim(),
    },
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unitPrice: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      sourcePost: item.sourcePost,
    })),
    total: allPriced ? Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)) : null,
    currency: "BRL",
    priceStatus: allPriced ? "calculated" : "contact_required",
  };
}

function whatsappMessage(order) {
  const lines = ["Olá! Gostaria de consultar estas peças da Alinart 💜", ""];
  if (order.customer.name) lines.push(`Nome: ${order.customer.name}`, "");
  lines.push("*Itens:*");

  order.items.forEach((item) => {
    const price = Number.isFinite(item.subtotal) ? ` — ${money(item.subtotal)}` : " — valor sob consulta";
    lines.push(`• ${item.quantity}x ${item.name} (${item.id})${price}`);
  });

  if (Number.isFinite(order.total)) lines.push("", `*Total estimado: ${money(order.total)}*`);
  if (order.customer.notes) lines.push("", `Observações: ${order.customer.notes}`);
  lines.push("", "Podemos confirmar disponibilidade, valores e entrega?");
  return lines.join("\n");
}

function feedback(message) {
  $("#feedback").textContent = message;
  window.setTimeout(() => { $("#feedback").textContent = ""; }, 2600);
}

function openCart() {
  $("#overlay").hidden = false;
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
  $("#overlay").hidden = true;
  document.body.style.overflow = "";
}

function resetCatalog() {
  state.visible = PAGE_SIZE;
  renderProducts();
}

$("#filters").addEventListener("click", (event) => {
  if (!event.target.matches("[data-category]")) return;
  state.category = event.target.dataset.category;
  renderFilters();
  resetCatalog();
});

$("#search").addEventListener("input", (event) => {
  state.search = event.target.value;
  resetCatalog();
});

$("#sort").addEventListener("change", (event) => {
  state.sort = event.target.value;
  resetCatalog();
});

$("#load-more").addEventListener("click", () => {
  state.visible += PAGE_SIZE;
  renderProducts();
});

$("#cart-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  if (button.dataset.action === "remove") {
    delete state.cart[button.dataset.id];
    saveCart();
  } else {
    updateQuantity(button.dataset.id, button.dataset.action === "increase" ? 1 : -1);
  }
});

$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#continue-shopping").addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCart(); });

$("#send-whatsapp").addEventListener("click", () => {
  window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage(buildOrder()))}`, "_blank", "noopener,noreferrer");
});

$("#copy-json").addEventListener("click", async () => {
  const json = JSON.stringify(buildOrder(), null, 2);
  try {
    await navigator.clipboard.writeText(json);
    feedback("JSON copiado para a área de transferência.");
  } catch {
    const field = document.createElement("textarea");
    field.value = json;
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
    feedback("JSON copiado para a área de transferência.");
  }
});

$("#download-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(buildOrder(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `pedido-alinart-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  feedback("Arquivo JSON gerado.");
});

$("#year").textContent = new Date().getFullYear();
renderFilters();
renderProducts();
renderCart();
