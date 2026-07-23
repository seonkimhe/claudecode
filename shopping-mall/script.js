const PRODUCTS = [
  { id: 1, name: '기본 반팔 티셔츠', category: '의류', price: 15000, emoji: '👕', description: '편안한 착용감의 데일리 반팔 티셔츠', stock: 20 },
  { id: 2, name: '슬림핏 청바지', category: '의류', price: 39000, emoji: '👖', description: '어디에나 어울리는 슬림핏 데님', stock: 12 },
  { id: 3, name: '경량 패딩 자켓', category: '의류', price: 89000, emoji: '🧥', description: '가볍고 따뜻한 겨울 필수템', stock: 8 },
  { id: 4, name: '무선 이어폰', category: '전자기기', price: 59000, emoji: '🎧', description: '노이즈 캔슬링 기능 탑재', stock: 15 },
  { id: 5, name: '스마트워치', category: '전자기기', price: 129000, emoji: '⌚', description: '건강 관리와 알림을 한번에', stock: 10 },
  { id: 6, name: '보조배터리', category: '전자기기', price: 25000, emoji: '🔋', description: '20000mAh 대용량 고속충전', stock: 30 },
  { id: 7, name: '유기농 사과 세트', category: '식품', price: 18000, emoji: '🍎', description: '아삭하고 달콤한 제철 사과 5kg', stock: 25 },
  { id: 8, name: '수제 초콜릿 박스', category: '식품', price: 22000, emoji: '🍫', description: '선물하기 좋은 프리미엄 초콜릿', stock: 18 },
  { id: 9, name: '드립 커피 원두', category: '식품', price: 16000, emoji: '☕', description: '고소한 향의 스페셜티 원두 1kg', stock: 22 },
  { id: 10, name: '수분 진정 크림', category: '뷰티', price: 32000, emoji: '🧴', description: '민감성 피부를 위한 저자극 크림', stock: 14 },
  { id: 11, name: '립밤 세트', category: '뷰티', price: 12000, emoji: '💄', description: '촉촉한 발색의 립밤 3종 세트', stock: 20 },
  { id: 12, name: '헤어 에센스', category: '뷰티', price: 21000, emoji: '💇', description: '손상 모발 케어 에센스', stock: 16 },
];

const CATEGORIES = ['전체', '의류', '전자기기', '식품', '뷰티'];
const CART_KEY = 'shopping-cart';

const searchInput = document.getElementById('search-input');
const categoryTabsEl = document.getElementById('category-tabs');
const sortSelect = document.getElementById('sort-select');
const productGridEl = document.getElementById('product-grid');

const detailModal = document.getElementById('detail-modal');
const detailClose = document.getElementById('detail-close');
const detailIcon = document.getElementById('detail-icon');
const detailName = document.getElementById('detail-name');
const detailDescription = document.getElementById('detail-description');
const detailStock = document.getElementById('detail-stock');
const detailPrice = document.getElementById('detail-price');
const detailQtyMinus = document.getElementById('detail-qty-minus');
const detailQtyEl = document.getElementById('detail-qty');
const detailQtyPlus = document.getElementById('detail-qty-plus');
const detailAddBtn = document.getElementById('detail-add-btn');

const cartBtn = document.getElementById('cart-btn');
const cartCountEl = document.getElementById('cart-count');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalQtyEl = document.getElementById('cart-total-qty');
const cartTotalPriceEl = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');

const checkoutModal = document.getElementById('checkout-modal');
const checkoutClose = document.getElementById('checkout-close');
const checkoutForm = document.getElementById('checkout-form');

const completeModal = document.getElementById('complete-modal');
const orderIdEl = document.getElementById('order-id');
const completeClose = document.getElementById('complete-close');

let currentCategory = '전체';
let cart = loadCart();
let detailProduct = null;
let detailQty = 1;

function formatPrice(n) {
  return `${n.toLocaleString('ko-KR')}원`;
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function getFilteredProducts() {
  const term = searchInput.value.trim().toLowerCase();
  let list = PRODUCTS.filter((p) => {
    const matchesCategory = currentCategory === '전체' || p.category === currentCategory;
    const matchesSearch = !term || p.name.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  if (sortSelect.value === 'price-asc') {
    list = [...list].sort((a, b) => a.price - b.price);
  } else if (sortSelect.value === 'price-desc') {
    list = [...list].sort((a, b) => b.price - a.price);
  }

  return list;
}

function renderCategoryTabs() {
  categoryTabsEl.innerHTML = '';
  CATEGORIES.forEach((category) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-tab' + (category === currentCategory ? ' active' : '');
    btn.textContent = category;
    btn.addEventListener('click', () => {
      currentCategory = category;
      renderCategoryTabs();
      renderProducts();
    });
    categoryTabsEl.appendChild(btn);
  });
}

function renderProducts() {
  const products = getFilteredProducts();
  productGridEl.innerHTML = '';

  if (products.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'empty-message';
    emptyEl.textContent = '조건에 맞는 상품이 없습니다.';
    productGridEl.appendChild(emptyEl);
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="card-icon">${product.emoji}</div>
      <div class="card-name">${product.name}</div>
      <div class="card-category">${product.category}</div>
      <div class="card-price">${formatPrice(product.price)}</div>
      <button type="button" class="add-btn">담기</button>
    `;
    card.addEventListener('click', () => openDetail(product));
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product.id, 1);
    });
    productGridEl.appendChild(card);
  });
}

function openDetail(product) {
  detailProduct = product;
  detailQty = 1;
  detailIcon.textContent = product.emoji;
  detailName.textContent = product.name;
  detailDescription.textContent = product.description;
  detailStock.textContent = `재고 ${product.stock}개`;
  detailPrice.textContent = formatPrice(product.price);
  detailQtyEl.textContent = detailQty;
  detailModal.classList.remove('hidden');
}

function closeDetail() {
  detailModal.classList.add('hidden');
  detailProduct = null;
}

function addToCart(id, qty) {
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveCart();
  renderCartBadge();
  renderCartPanel();
}

function renderCartBadge() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEl.textContent = totalQty;
}

function renderCartPanel() {
  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'cart-empty';
    emptyEl.textContent = '장바구니가 비어있습니다.';
    cartItemsEl.appendChild(emptyEl);
  } else {
    cart.forEach((item) => {
      const product = findProduct(item.id);
      if (!product) return;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="item-icon">${product.emoji}</div>
        <div class="item-info">
          <div class="item-name">${product.name}</div>
          <div class="item-price">${formatPrice(product.price)}</div>
        </div>
        <div class="item-qty">
          <button type="button" class="qty-minus">-</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-plus">+</button>
        </div>
        <button type="button" class="item-remove">삭제</button>
      `;
      row.querySelector('.qty-minus').addEventListener('click', () => changeCartQty(item.id, -1));
      row.querySelector('.qty-plus').addEventListener('click', () => changeCartQty(item.id, 1));
      row.querySelector('.item-remove').addEventListener('click', () => removeFromCart(item.id));
      cartItemsEl.appendChild(row);
    });
  }

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const product = findProduct(item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
  cartTotalQtyEl.textContent = totalQty;
  cartTotalPriceEl.textContent = formatPrice(totalPrice);
}

function changeCartQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  const product = findProduct(id);
  item.qty = Math.max(1, Math.min(product.stock, item.qty + delta));
  saveCart();
  renderCartBadge();
  renderCartPanel();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  saveCart();
  renderCartBadge();
  renderCartPanel();
}

function openCart() {
  cartPanel.classList.remove('hidden');
  cartOverlay.classList.remove('hidden');
}

function closeCart() {
  cartPanel.classList.add('hidden');
  cartOverlay.classList.add('hidden');
}

function openCheckout() {
  if (cart.length === 0) return;
  checkoutModal.classList.remove('hidden');
}

function closeCheckout() {
  checkoutModal.classList.add('hidden');
}

function generateOrderId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${Date.now().toString().slice(-6)}-${random}`;
}

function completeOrder() {
  const orderId = generateOrderId();
  cart = [];
  saveCart();
  renderCartBadge();
  renderCartPanel();
  closeCheckout();
  closeCart();
  checkoutForm.reset();
  orderIdEl.textContent = orderId;
  completeModal.classList.remove('hidden');
}

searchInput.addEventListener('input', renderProducts);
sortSelect.addEventListener('change', renderProducts);

detailClose.addEventListener('click', closeDetail);
detailQtyMinus.addEventListener('click', () => {
  detailQty = Math.max(1, detailQty - 1);
  detailQtyEl.textContent = detailQty;
});
detailQtyPlus.addEventListener('click', () => {
  detailQty = Math.min(detailProduct.stock, detailQty + 1);
  detailQtyEl.textContent = detailQty;
});
detailAddBtn.addEventListener('click', () => {
  addToCart(detailProduct.id, detailQty);
  closeDetail();
});

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
checkoutBtn.addEventListener('click', openCheckout);

checkoutClose.addEventListener('click', closeCheckout);
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  completeOrder();
});

completeClose.addEventListener('click', () => {
  completeModal.classList.add('hidden');
});

renderCategoryTabs();
renderProducts();
renderCartBadge();
renderCartPanel();
