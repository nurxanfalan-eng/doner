/**
 * 618 Dönər – app.js
 * Pure vanilla JS, zero dependencies, optimized
 */

(function () {
  'use strict';

  /* =============================================
     CART STATE
  ============================================= */
  let cart = []; // [{id, name, price, qty}]

  /* =============================================
     UTILITY
  ============================================= */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function fmt(n) { return parseFloat(n).toFixed(2) + ' ₼'; }

  function showToast(msg, dur) {
    dur = dur || 2000;
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, dur);
  }

  /* =============================================
     NAVBAR
  ============================================= */
  var navbar = $('#navbar');
  var burgerBtn = $('#burgerBtn');
  var navLinks = $('#navLinks');

  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
    $('#scrollTop').classList.toggle('show', window.scrollY > 300);
  }, { passive: true });

  burgerBtn.addEventListener('click', function () {
    burgerBtn.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close nav on link click
  $$('.nav-item').forEach(function (link) {
    link.addEventListener('click', function () {
      burgerBtn.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Active nav highlight on scroll
  var sections = $$('section[id]');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        $$('.nav-item').forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(function (s) { observer.observe(s); });

  /* =============================================
     SCROLL TOP
  ============================================= */
  $('#scrollTop').addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* =============================================
     CATEGORY TABS
  ============================================= */
  $$('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.dataset.cat;
      $$('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      $$('.menu-grid').forEach(function (g) {
        g.classList.toggle('hidden', g.id !== 'cat-' + cat);
      });
    });
  });

  /* =============================================
     PRODUCT MODAL
  ============================================= */
  var productModal = $('#productModal');
  var modalClose = $('#modalClose');
  var modalImg = $('#modalImg');
  var modalName = $('#modalName');
  var modalDesc = $('#modalDesc');
  var modalPrice = $('#modalPrice');
  var modalAddBtn = $('#modalAddBtn');
  var currentCard = null;

  function openModal(card) {
    currentCard = card;
    var img = $('img', card);
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalName.textContent = card.dataset.name;
    modalDesc.textContent = $('p.menu-desc', card).textContent;
    modalPrice.textContent = fmt(card.dataset.price);
    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    productModal.classList.remove('open');
    document.body.style.overflow = '';
    currentCard = null;
  }

  // Open on card click (not on add button)
  $$('.menu-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.add-btn') || e.target.closest('.add-cart-btn')) return;
      openModal(card);
    });
  });

  modalClose.addEventListener('click', closeModal);
  productModal.addEventListener('click', function (e) {
    if (e.target === productModal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); closeLightbox(); }
  });

  modalAddBtn.addEventListener('click', function () {
    if (currentCard) addToCart(currentCard);
    closeModal();
  });

  /* =============================================
     CART
  ============================================= */
  function addToCart(card) {
    var id = card.dataset.id;
    var name = card.dataset.name;
    var price = parseFloat(card.dataset.price);
    var existing = cart.find(function (i) { return i.id === id; });
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: id, name: name, price: price, qty: 1 });
    }
    updateCartUI();
    showToast('✅ ' + name + ' əlavə edildi!');
  }

  function removeFromCart(id) {
    cart = cart.filter(function (i) { return i.id !== id; });
    updateCartUI();
  }

  function changeQty(id, delta) {
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else updateCartUI();
  }

  function cartTotal() {
    return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  }

  function renderCartItems(container) {
    if (!container) return;
    if (cart.length === 0) {
      container.innerHTML = '<div class="cart-empty"><i class="fas fa-basket-shopping"></i><p>Səbətiniz boşdur.<br/>Menyudan məhsul əlavə edin.</p></div>';
      return;
    }
    container.innerHTML = cart.map(function (item) {
      return '<div class="cart-item">' +
        '<div class="ci-name">' + item.name + '</div>' +
        '<div class="ci-controls">' +
          '<button onclick="window._cartDec(\'' + item.id + '\')"><i class="fas fa-minus"></i></button>' +
          '<span class="ci-qty">' + item.qty + '</span>' +
          '<button onclick="window._cartInc(\'' + item.id + '\')"><i class="fas fa-plus"></i></button>' +
        '</div>' +
        '<div class="ci-price">' + fmt(item.price * item.qty) + '</div>' +
        '<button class="ci-remove" onclick="window._cartDel(\'' + item.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div>';
    }).join('');
  }

  window._cartInc = function (id) { changeQty(id, 1); };
  window._cartDec = function (id) { changeQty(id, -1); };
  window._cartDel = function (id) { removeFromCart(id); };

  function updateCartUI() {
    var count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    var total = cartTotal();

    // Navbar count
    $('#cartCount').textContent = count;

    // Cart panel in order section
    renderCartItems($('#cartItems'));
    var cartSummary = $('#cartSummary');
    if (cartSummary) {
      cartSummary.style.display = cart.length ? '' : 'none';
      if ($('#cartTotal')) $('#cartTotal').textContent = fmt(total);
    }

    // Drawer
    renderCartItems($('#drawerItems'));
    var df = $('#drawerFooter');
    if (df) {
      df.style.display = cart.length ? '' : 'none';
      if ($('#drawerTotal')) $('#drawerTotal').textContent = fmt(total);
    }

    // Order preview in form
    var preview = $('#orderItemsPreview');
    var list = $('#orderItemsList');
    if (preview && list) {
      preview.style.display = cart.length ? '' : 'none';
      list.innerHTML = cart.map(function (i) {
        return '<div class="oi-row"><span>' + i.name + ' x' + i.qty + '</span><strong>' + fmt(i.price * i.qty) + '</strong></div>';
      }).join('') + '<div class="oi-row" style="border-top:1px dashed #ddd;margin-top:6px;padding-top:6px"><strong>Cəmi:</strong><strong style="color:var(--primary)">' + fmt(total) + '</strong></div>';
    }
  }

  // Add to cart buttons
  $$('.add-btn, .add-cart-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var card = btn.closest('.menu-card');
      if (card) addToCart(card);
    });
  });

  /* =============================================
     CART DRAWER
  ============================================= */
  var cartDrawer = $('#cartDrawer');
  var drawerOverlay = $('#drawerOverlay');
  var drawerClose = $('#drawerClose');

  function openDrawer() {
    cartDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    cartDrawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  $('#cartBtn').addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  $('#goOrderBtn').addEventListener('click', function () {
    closeDrawer();
  });

  /* =============================================
     GALLERY LIGHTBOX
  ============================================= */
  var lightbox = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbClose = $('#lbClose');
  var lbPrev = $('#lbPrev');
  var lbNext = $('#lbNext');
  var galleryImages = [];
  var lbIndex = 0;

  function buildGalleryIndex() {
    galleryImages = $$('.gallery-item img').map(function (img) {
      return { src: img.src, alt: img.alt };
    });
  }

  function openLightbox(idx) {
    buildGalleryIndex();
    lbIndex = idx;
    lbImg.src = galleryImages[lbIndex].src;
    lbImg.alt = galleryImages[lbIndex].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function lbGo(dir) {
    lbIndex = (lbIndex + dir + galleryImages.length) % galleryImages.length;
    lbImg.style.opacity = '0';
    setTimeout(function () {
      lbImg.src = galleryImages[lbIndex].src;
      lbImg.alt = galleryImages[lbIndex].alt;
      lbImg.style.opacity = '1';
    }, 140);
  }

  lbImg.style.transition = 'opacity .15s';

  $$('.gallery-item').forEach(function (item, idx) {
    item.addEventListener('click', function () { openLightbox(idx); });
  });

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lb-content')) closeLightbox();
  });
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbGo(-1); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbGo(1); });

  // Touch/swipe support
  var lbTouchX = null;
  lightbox.addEventListener('touchstart', function (e) { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (lbTouchX === null) return;
    var dx = e.changedTouches[0].clientX - lbTouchX;
    if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1);
    lbTouchX = null;
  }, { passive: true });

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowRight') lbGo(1);
    if (e.key === 'ArrowLeft') lbGo(-1);
  });

  /* =============================================
     GEOLOCATION
  ============================================= */
  var getLocBtn = $('#getLocBtn');
  var locStatus = $('#locStatus');
  var custAddress = $('#custAddress');
  var locationLink = $('#locationLink');

  getLocBtn.addEventListener('click', function () {
    if (!navigator.geolocation) {
      locStatus.className = 'loc-status err';
      locStatus.textContent = '⚠️ Cihazınız geolocation dəstəkləmir.';
      return;
    }
    getLocBtn.classList.add('loading');
    locStatus.className = 'loc-status';
    locStatus.textContent = '📍 Konum alınır...';

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        getLocBtn.classList.remove('loading');
        var lat = pos.coords.latitude.toFixed(6);
        var lng = pos.coords.longitude.toFixed(6);
        var link = 'https://maps.google.com/maps?q=' + lat + ',' + lng;
        locationLink.value = link;
        custAddress.value = 'Konum: ' + lat + ', ' + lng;
        locStatus.className = 'loc-status ok';
        locStatus.textContent = '✅ Konum uğurla alındı!';
      },
      function (err) {
        getLocBtn.classList.remove('loading');
        locStatus.className = 'loc-status err';
        var msgs = {
          1: '❌ Konum icazəsi rədd edildi.',
          2: '❌ Konum müəyyən edilə bilmədi.',
          3: '❌ Zaman aşımı oldu.'
        };
        locStatus.textContent = msgs[err.code] || '❌ Konum alınamadı.';
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  });

  /* =============================================
     ORDER FORM + WHATSAPP
  ============================================= */
  var orderForm = $('#orderForm');

  orderForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = $('#custName').value.trim();
    var phone = $('#custPhone').value.trim();
    var address = $('#custAddress').value.trim();
    var note = $('#custNote').value.trim();
    var locLink = locationLink.value.trim();

    // Validation
    var valid = true;
    [$('#custName'), $('#custPhone'), $('#custAddress')].forEach(function (el) {
      el.classList.remove('error');
    });

    if (!name) { $('#custName').classList.add('error'); valid = false; }
    if (!phone) { $('#custPhone').classList.add('error'); valid = false; }
    if (!address) { $('#custAddress').classList.add('error'); valid = false; }

    if (!valid) {
      showToast('⚠️ Zəhmət olmasa bütün məcburi sahələri doldurun!', 2500);
      return;
    }

    if (cart.length === 0) {
      showToast('🛒 Səbətiniz boşdur! Əvvəlcə məhsul əlavə edin.', 2500);
      return;
    }

    // Build WhatsApp message
    var total = cartTotal();
    var lines = ['🍖 *618 Dönər – Yeni Sifariş*', ''];
    lines.push('👤 *Ad:* ' + name);
    lines.push('📞 *Telefon:* ' + phone);
    lines.push('📍 *Ünvan:* ' + address);
    if (locLink) lines.push('🗺️ *Konum:* ' + locLink);
    lines.push('');
    lines.push('📋 *Sifarişlər:*');
    cart.forEach(function (item) {
      lines.push('  • ' + item.name + ' x' + item.qty + ' = ' + fmt(item.price * item.qty));
    });
    lines.push('');
    lines.push('💰 *Cəmi: ' + fmt(total) + '*');
    lines.push('🛵 *Çatdırılma: Pulsuz*');
    if (note) { lines.push(''); lines.push('📝 *Qeyd:* ' + note); }

    var msg = encodeURIComponent(lines.join('\n'));
    var waUrl = 'https://wa.me/994559406018?text=' + msg;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    showToast('✅ Sifarişiniz WhatsApp-a göndərildi!', 3000);
  });

  /* =============================================
     FAQ ACCORDION
  ============================================= */
  $$('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = btn.classList.contains('open');

      // Close all
      $$('.faq-q').forEach(function (b) {
        b.classList.remove('open');
        var a = b.nextElementSibling;
        if (a) a.classList.remove('open');
      });

      // Toggle clicked
      if (!isOpen) {
        btn.classList.add('open');
        var ans = btn.nextElementSibling;
        if (ans) ans.classList.add('open');
      }
    });
  });

  /* =============================================
     SMOOTH SCROLL
  ============================================= */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* =============================================
     INIT
  ============================================= */
  updateCartUI();

})();
