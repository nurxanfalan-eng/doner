/* ===================================================
   618 Dönər – app.js
   Pure vanilla JS, no dependencies, no server needed
   =================================================== */

'use strict';

// ────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────
let cart = [];
let galleryImages = [];
let lightboxIndex = 0;

// ────────────────────────────────────────────────
// DOM REFS
// ────────────────────────────────────────────────
const $  = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

// ────────────────────────────────────────────────
// NAVBAR
// ────────────────────────────────────────────────
(function initNavbar() {
  const navbar   = $('#navbar');
  const burger   = $('#burgerBtn');
  const navLinks = $('#navLinks');

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    $('#scrollTop').classList.toggle('visible', window.scrollY > 300);
    updateActiveNav();
  }, { passive: true });

  // Burger menu
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close nav on link click
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Active nav on scroll
  function updateActiveNav() {
    const sections = $$('section[id]');
    const scrollY  = window.scrollY + 80;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const h   = sec.offsetHeight;
      const id  = sec.getAttribute('id');
      const link = $(`.nav-item[href="#${id}"]`);
      if (link) link.classList.toggle('active', scrollY >= top && scrollY < top + h);
    });
  }

  // Scroll top
  $('#scrollTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ────────────────────────────────────────────────
// MENU TABS
// ────────────────────────────────────────────────
(function initTabs() {
  const tabBtns = $$('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      $$('.menu-grid').forEach(grid => grid.classList.add('hidden'));
      $(`#cat-${cat}`).classList.remove('hidden');
    });
  });
})();

// ────────────────────────────────────────────────
// PRODUCT MODAL
// ────────────────────────────────────────────────
(function initProductModal() {
  const modal    = $('#productModal');
  const closeBtn = $('#modalClose');
  const addBtn   = $('#modalAddBtn');

  let currentItem = null;

  function openModal(card) {
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    const img   = card.querySelector('.menu-img-wrap img');
    const desc  = card.querySelector('.menu-desc');

    currentItem = { id: card.dataset.id, name, price };

    $('#modalImg').src     = img ? img.src : '';
    $('#modalImg').alt     = name;
    $('#modalName').textContent = name;
    $('#modalDesc').textContent = desc ? desc.textContent : '';
    $('#modalPrice').textContent = price.toFixed(2) + ' ₼';

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    currentItem = null;
  }

  // Card image click → modal
  $$('.menu-card').forEach(card => {
    card.querySelector('.menu-img-wrap').addEventListener('click', (e) => {
      if (e.target.closest('.add-btn')) return;
      openModal(card);
    });
  });

  // Close modal
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Add from modal
  addBtn.addEventListener('click', () => {
    if (currentItem) {
      addToCart(currentItem.id, currentItem.name, currentItem.price);
      closeModal();
    }
  });
})();

// ────────────────────────────────────────────────
// CART
// ────────────────────────────────────────────────
function addToCart(id, name, price) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  updateCartUI();
  showToast(`✅ ${name} səbətə əlavə edildi!`, 'success');
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else updateCartUI();
}

function getTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = getTotal();

  // Badge
  $('#cartCount').textContent = count;

  // Drawer
  renderDrawer();

  // Order section cart panel
  renderOrderCart();

  // Order items preview in form
  renderOrderItemsPreview();
}

function renderCartItems(container) {
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-basket-shopping"></i>
        <p>Səbətiniz boşdur</p>
      </div>`;
    return;
  }
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="ci-name">${escHtml(item.name)}</div>
      <div class="ci-controls">
        <button class="ci-btn minus" data-action="dec" data-id="${item.id}" aria-label="Azalt">−</button>
        <span class="ci-qty">${item.qty}</span>
        <button class="ci-btn plus" data-action="inc" data-id="${item.id}" aria-label="Artır">+</button>
        <button class="ci-btn del" data-action="del" data-id="${item.id}" aria-label="Sil"><i class="fas fa-trash-alt"></i></button>
      </div>
      <div class="ci-price">${(item.price * item.qty).toFixed(2)} ₼</div>
    `;
    container.appendChild(div);
  });
  // Attach controls
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (btn.dataset.action === 'inc') changeQty(id, 1);
      if (btn.dataset.action === 'dec') changeQty(id, -1);
      if (btn.dataset.action === 'del') removeFromCart(id);
    });
  });
}

function renderDrawer() {
  const container = $('#drawerItems');
  const footer    = $('#drawerFooter');
  renderCartItems(container);
  const total = getTotal();
  footer.style.display = cart.length ? 'block' : 'none';
  $('#drawerTotal').textContent = total.toFixed(2) + ' ₼';
}

function renderOrderCart() {
  const container  = $('#cartItems');
  const summary    = $('#cartSummary');
  renderCartItems(container);
  summary.style.display = cart.length ? 'block' : 'none';
  $('#cartTotal').textContent = getTotal().toFixed(2) + ' ₼';
}

function renderOrderItemsPreview() {
  const preview = $('#orderItemsPreview');
  const list    = $('#orderItemsList');
  if (cart.length === 0) {
    preview.style.display = 'none';
    return;
  }
  preview.style.display = 'block';
  list.innerHTML = cart.map(i =>
    `<div class="order-item-line">
      <span>${escHtml(i.name)} × ${i.qty}</span>
      <strong>${(i.price * i.qty).toFixed(2)} ₼</strong>
    </div>`
  ).join('') +
  `<div class="order-item-line" style="font-weight:800;border-top:2px solid #e5e7eb;padding-top:0.5rem;margin-top:0.25rem;">
    <span>Cəmi</span>
    <strong style="color:var(--primary)">${getTotal().toFixed(2)} ₼</strong>
  </div>`;
}

// Cart button → drawer
$('#cartBtn').addEventListener('click', () => {
  $('#cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderDrawer();
});
$('#drawerClose').addEventListener('click', closeDrawer);
$('#drawerOverlay').addEventListener('click', closeDrawer);
function closeDrawer() {
  $('#cartDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

// Go to order from drawer
$('#goOrderBtn').addEventListener('click', () => {
  closeDrawer();
});

// Add to cart from menu cards
$$('.add-btn, .add-cart-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card  = btn.closest('.menu-card');
    const id    = card.dataset.id;
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    addToCart(id, name, price);
  });
});

// ────────────────────────────────────────────────
// GALLERY & LIGHTBOX
// ────────────────────────────────────────────────
(function initGallery() {
  const galleryGrid = $('#galleryGrid');
  const lightbox    = $('#lightbox');
  const lbImg       = $('#lbImg');
  const lbClose     = $('#lbClose');
  const lbPrev      = $('#lbPrev');
  const lbNext      = $('#lbNext');

  // Collect gallery images
  galleryImages = $$('.gallery-item img').map(img => ({ src: img.src, alt: img.alt }));

  function openLightbox(idx) {
    lightboxIndex = idx;
    updateLightboxImg();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightboxImg() {
    const item  = galleryImages[lightboxIndex];
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbImg.style.opacity = '1';
    }, 150);
    lbImg.style.transition = 'opacity 0.2s';
  }

  // Click gallery items
  $$('.gallery-item').forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(idx));
  });

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === $('#lightbox > .lb-content')) closeLightbox();
  });

  lbPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightboxImg();
  });

  lbNext.addEventListener('click', (e) => {
    e.stopPropagation();
    lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
    updateLightboxImg();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')       closeLightbox();
    if (e.key === 'ArrowLeft')    { lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length; updateLightboxImg(); }
    if (e.key === 'ArrowRight')   { lightboxIndex = (lightboxIndex + 1) % galleryImages.length; updateLightboxImg(); }
  });

  // Touch swipe for lightbox
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
      else          lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
      updateLightboxImg();
    }
  }, { passive: true });
})();

// ────────────────────────────────────────────────
// ORDER FORM + GEOLOCATION
// ────────────────────────────────────────────────
(function initOrderForm() {
  const form      = $('#orderForm');
  const getLocBtn = $('#getLocBtn');
  const locStatus = $('#locStatus');
  const locInput  = $('#locationLink');
  const addrInput = $('#custAddress');
  const sendBtn   = $('#sendOrderBtn');

  // Geolocation
  getLocBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showLocStatus('error', '⚠️ Brauzerin konum xidmətini dəstəkləmir.');
      return;
    }
    getLocBtn.classList.add('loading');
    showLocStatus('', '📡 Konum alınır...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        getLocBtn.classList.remove('loading');
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const link = `https://www.google.com/maps?q=${lat},${lng}`;
        locInput.value  = link;
        addrInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        showLocStatus('success', '✅ Konum uğurla alındı!');
      },
      (err) => {
        getLocBtn.classList.remove('loading');
        let msg = '⚠️ Konum alına bilmədi. Əl ilə daxil edin.';
        if (err.code === 1) msg = '🔒 Konum icazəsi rədd edildi. Əl ilə daxil edin.';
        showLocStatus('error', msg);
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  });

  function showLocStatus(type, msg) {
    locStatus.textContent    = msg;
    locStatus.className      = 'loc-status ' + type;
  }

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const name    = $('#custName').value.trim();
    const phone   = $('#custPhone').value.trim();
    const address = addrInput.value.trim();
    const locLink = locInput.value.trim();
    const note    = $('#custNote').value.trim();

    // Build WhatsApp message
    let msg = `🍖 *YENİ SİFARİŞ – 618 Dönər*\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *Ad:* ${name}\n`;
    msg += `📞 *Telefon:* ${phone}\n`;
    msg += `📍 *Ünvan:* ${address}\n`;
    if (locLink) msg += `🗺️ *Konum:* ${locLink}\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `🛒 *Sifarişlər:*\n`;

    if (cart.length > 0) {
      cart.forEach(item => {
        msg += `• ${item.name} × ${item.qty} = ${(item.price * item.qty).toFixed(2)} ₼\n`;
      });
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 *Cəmi: ${getTotal().toFixed(2)} ₼*\n`;
      msg += `🛵 *Çatdırılma: Pulsuzdur!*\n`;
    } else {
      msg += `• (Seçilmiş məhsul yoxdur)\n`;
    }

    if (note) msg += `━━━━━━━━━━━━━━━━━━\n📝 *Qeyd:* ${note}\n`;

    const encoded = encodeURIComponent(msg);
    const waURL   = `https://wa.me/994559406018?text=${encoded}`;
    window.open(waURL, '_blank', 'noopener,noreferrer');

    showToast('✅ Sifariş WhatsApp-a göndərildi!', 'success');
  });

  function validateForm() {
    let valid = true;
    const name  = $('#custName');
    const phone = $('#custPhone');
    const addr  = addrInput;

    [name, phone, addr].forEach(f => {
      f.classList.remove('invalid');
      if (!f.value.trim()) { f.classList.add('invalid'); valid = false; }
    });

    if (!valid) {
      showToast('⚠️ Zəhmət olmasa bütün məcburi sahələri doldurun!', 'error');
    }
    return valid;
  }
})();

// ────────────────────────────────────────────────
// FAQ ACCORDION
// ────────────────────────────────────────────────
(function initFAQ() {
  $$('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      $$('.faq-item').forEach(i => i.classList.remove('open'));
      // Toggle current
      if (!isOpen) item.classList.add('open');
    });
  });
})();

// ────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────
let toastTimeout;
function showToast(msg, type) {
  const toast = $('#toast');
  clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.className   = `toast ${type || ''}`;
  // Force reflow
  void toast.offsetHeight;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ────────────────────────────────────────────────
// UTILITY
// ────────────────────────────────────────────────
function escHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

// ────────────────────────────────────────────────
// INTERSECTION OBSERVER — animate on scroll
// ────────────────────────────────────────────────
(function initAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  $$('.menu-card, .gallery-item, .contact-card, .hours-card, .faq-item').forEach(el => {
    observer.observe(el);
  });
})();

// ────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────
updateCartUI();
