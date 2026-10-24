(function() {
  'use strict';
  const isConfigPlaceholder = !window.SUPABASE_URL || window.SUPABASE_URL.includes('your-project') ||
    !window.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY.includes('your-anon-key');
  const sb = (!isConfigPlaceholder && window.supabase)
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

  let lang = 'ar', failedTries = 0, lockUntil = 0, activityTimer = null;
  const T = {
    ar: { title: "تسجيل الدخول", sub: "لوحة تحكم إدارة المتجر", email: "البريد الإلكتروني", pass: "كلمة المرور", submit: "دخول", orders: "الطلبات", creators: "المؤثرون", products: "المنتجات", unban: "فك الحظر", logout: "خروج", ordersTitle: "سجل الطلبات", creatorsTitle: "إدارة المؤثرين", productsTitle: "إدارة المنتجات", unbanTitle: "حسابات تم فك حظرها", errAuth: "البيانات المدخلة غير صحيحة", errLock: "محاولات كثيرة. يرجى الانتظار دقيقة", noticeConfig: "لم يتم ضبط Supabase بعد. املأ ملف config.js.", showPass: "عرض كلمة المرور", hidePass: "إخفاء كلمة المرور", addCreator: "+ إضافة مؤثر", importBtn: "استيراد من influencers.js", editCreator: "تعديل مؤثر", addProduct: "+ إضافة منتج", editProduct: "تعديل منتج", addUnban: "+ إضافة صورة إثبات", editUnban: "تعديل صورة الإثبات", importUnbanBtn: "استيراد من المعرض الحالي", save: "حفظ", cancel: "إلغاء", emptyCreators: "لا يوجد مؤثرون حالياً. يمكنك إضافة مؤثر أو الاستيراد.", emptyProducts: "لا توجد منتجات حالياً. يمكنك إضافة منتج جديد.", emptyUnban: "لا توجد صور إثبات حالياً. يمكنك إضافة صورة جديدة أو الاستيراد من المعرض.", confirmDel: "هل أنت متأكد من حذف هذا المؤثر نهائياً؟", confirmDelProduct: "هل أنت متأكد من حذف هذا المنتج نهائياً؟", confirmDelUnban: "هل أنت متأكد من حذف هذه الصورة نهائياً؟", errName: "الاسم مطلوب", errNameAr: "الاسم بالعربية مطلوب", errNameEn: "الاسم بالإنجليزية مطلوب", errUrl: "يجب أن يبدأ الرابط بـ https://", errPhotoSize: "حجم الصورة يجب أن لا يتجاوز 5MB", errPhotoRequired: "يرجى اختيار صورة", emptyOrders: "لا توجد طلبات حالياً.", exportBtn: "تصدير CSV", searchPlaceholder: "بحث بالاسم أو رقم الهاتف...", searchProductPlaceholder: "بحث بالاسم...", searchUnbanPlaceholder: "بحث بالوصف...", inStock: "متوفر", outOfStock: "نفدت الكمية", visible: "ظاهر", hidden: "مخفي", confirmDelOrder: "هل أنت متأكد من حذف هذا الطلب نهائياً؟" },
    en: { title: "Sign In", sub: "Store Management Dashboard", email: "Email", pass: "Password", submit: "Sign In", orders: "Orders", creators: "Creators", products: "Products", unban: "Unban Proofs", logout: "Logout", ordersTitle: "Orders Log", creatorsTitle: "Creators Management", productsTitle: "Products Management", unbanTitle: "Recovered Accounts Proofs", errAuth: "Invalid login credentials", errLock: "Too many attempts. Wait 60s", noticeConfig: "Supabase is not configured yet. Fill in config.js.", showPass: "Show password", hidePass: "Hide password", addCreator: "+ Add Creator", importBtn: "Import from influencers.js", editCreator: "Edit Creator", addProduct: "+ Add Product", editProduct: "Edit Product", addUnban: "+ Add Proof Photo", editUnban: "Edit Proof Photo", importUnbanBtn: "Import from Current Gallery", save: "Save", cancel: "Cancel", emptyCreators: "No creators yet. Add a creator or import from influencers.js.", emptyProducts: "No products found. You can add a new product.", emptyUnban: "No proof photos yet. You can add a new photo or import from gallery.", confirmDel: "Are you sure you want to permanently delete this creator?", confirmDelProduct: "Are you sure you want to permanently delete this product?", confirmDelUnban: "Are you sure you want to permanently delete this photo?", errName: "Name is required", errNameAr: "Arabic name is required", errNameEn: "English name is required", errUrl: "URL must start with https://", errPhotoSize: "Image must be 5MB or less", errPhotoRequired: "Please select an image file", emptyOrders: "No orders found.", exportBtn: "Export CSV", searchPlaceholder: "Search name or phone...", searchProductPlaceholder: "Search by name...", searchUnbanPlaceholder: "Search by caption...", inStock: "In Stock", outOfStock: "Sold Out", visible: "Visible", hidden: "Hidden", confirmDelOrder: "Are you sure you want to delete this order?" }
  };

  const el = id => document.getElementById(id);
  function setLang(l) {
    lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    el('btn-lang').textContent = l === 'ar' ? 'EN' : 'عربي';
    const t = T[l]; el('login-title').textContent = t.title; el('login-sub').textContent = t.sub;
    el('lbl-email').textContent = t.email; el('lbl-password').textContent = t.pass;
    const btnText = el('btn-login-submit').querySelector('.btn-text');
    if (btnText) btnText.textContent = t.submit;
    el('tab-orders-label').textContent = t.orders; el('tab-creators-label').textContent = t.creators;
    if (el('tab-products-label')) el('tab-products-label').textContent = t.products;
    if (el('tab-unban-label')) el('tab-unban-label').textContent = t.unban;
    el('btn-logout').textContent = t.logout;
    if (el('orders-title')) el('orders-title').textContent = t.ordersTitle;
    if (el('creators-title')) el('creators-title').textContent = t.creatorsTitle;
    if (el('products-title')) el('products-title').textContent = t.productsTitle;
    if (el('unban-title')) el('unban-title').textContent = t.unbanTitle;
    if (el('btn-add-creator')) el('btn-add-creator').textContent = t.addCreator;
    if (el('btn-add-product')) el('btn-add-product').textContent = t.addProduct;
    if (el('btn-add-unban')) el('btn-add-unban').textContent = t.addUnban;
    if (el('btn-import-creators')) el('btn-import-creators').textContent = t.importBtn;
    if (el('btn-import-unban')) el('btn-import-unban').textContent = t.importUnbanBtn;
    if (el('btn-export-orders')) el('btn-export-orders').textContent = t.exportBtn;
    if (el('search-orders')) el('search-orders').placeholder = t.searchPlaceholder;
    if (el('search-products')) el('search-products').placeholder = t.searchProductPlaceholder;
    if (el('search-unban')) el('search-unban').placeholder = t.searchUnbanPlaceholder;
    const noticeEl = el('config-notice');
    if (isConfigPlaceholder) { noticeEl.textContent = t.noticeConfig; noticeEl.classList.remove('hidden'); }
    else { noticeEl.classList.add('hidden'); }
    const isPass = el('admin-password').type === 'password';
    el('btn-toggle-pwd').setAttribute('aria-label', isPass ? t.showPass : t.hidePass);
    if (typeof renderAdminCreators === 'function') renderAdminCreators();
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
    if (typeof renderAdminProducts === 'function') renderAdminProducts();
    if (typeof renderAdminUnban === 'function') renderAdminUnban();
  }

  let ordersRefreshTimer = null;
  function startOrdersRefresh() {
    stopOrdersRefresh();
    ordersRefreshTimer = setInterval(() => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.matches('#search-orders, .note-input') || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (!document.hidden && !el('view-dashboard').classList.contains('hidden') && !isTyping) {
        loadOrders();
      }
    }, 30000);
  }
  function stopOrdersRefresh() {
    if (ordersRefreshTimer) { clearInterval(ordersRefreshTimer); ordersRefreshTimer = null; }
  }

  function showDashboard(session) {
    el('view-login').classList.add('hidden');
    el('view-dashboard').classList.remove('hidden');
    el('btn-logout').classList.remove('hidden');
    switchTab('orders');
    startOrdersRefresh();
    resetInactivityTimer();
  }

  function showLogin() {
    stopOrdersRefresh();
    document.title = 'DLA7A Admin';
    el('view-login').classList.remove('hidden');
    el('view-dashboard').classList.add('hidden');
    el('btn-logout').classList.add('hidden');
    el('orders-list').innerHTML = '';
    el('admin-creators-list').innerHTML = '';
    if (el('admin-products-list')) el('admin-products-list').innerHTML = '';
    if (el('admin-unban-list')) el('admin-unban-list').innerHTML = '';
  }

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      const active = b.dataset.tab === name;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    el('tab-orders').classList.toggle('hidden', name !== 'orders');
    el('tab-creators').classList.toggle('hidden', name !== 'creators');
    if (el('tab-products')) el('tab-products').classList.toggle('hidden', name !== 'products');
    if (el('tab-unban')) el('tab-unban').classList.toggle('hidden', name !== 'unban');
    if (name === 'orders') loadOrders();
    if (name === 'creators') loadCreators();
    if (name === 'products') loadProducts();
    if (name === 'unban') loadUnbanPhotos();
  }

  function resetInactivityTimer() {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(async () => {
      try { if (sb) await sb.auth.signOut(); } catch (e) {}
      showLogin();
    }, 30 * 60 * 1000);
  }
  ['mousemove', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));

  function setLoading(isLoading) {
    const btn = el('btn-login-submit');
    btn.disabled = isLoading;
    btn.querySelector('.btn-text').classList.toggle('hidden', isLoading);
    btn.querySelector('.btn-spinner').classList.toggle('hidden', !isLoading);
  }

  el('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const errBox = el('login-error'); errBox.classList.add('hidden');
    if (Date.now() < lockUntil) { errBox.textContent = T[lang].errLock; errBox.classList.remove('hidden'); return; }
    if (!sb) { errBox.textContent = T[lang].noticeConfig; errBox.classList.remove('hidden'); return; }

    const email = el('admin-email').value.trim(), password = el('admin-password').value;
    setLoading(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        failedTries++;
        if (failedTries >= 5) { lockUntil = Date.now() + 60000; failedTries = 0; errBox.textContent = T[lang].errLock; }
        else { errBox.textContent = T[lang].errAuth; }
        errBox.classList.remove('hidden');
      } else {
        failedTries = 0; showDashboard(data.session);
      }
    } finally {
      setLoading(false);
    }
  });

  el('btn-toggle-pwd').addEventListener('click', () => {
    const pwd = el('admin-password');
    const isPass = pwd.type === 'password';
    pwd.type = isPass ? 'text' : 'password';
    el('eye-show').classList.toggle('hidden', isPass);
    el('eye-hide').classList.toggle('hidden', !isPass);
    el('btn-toggle-pwd').setAttribute('aria-label', isPass ? T[lang].hidePass : T[lang].showPass);
  });

  let orders = [], orderStatusFilter = 'all', orderSearchQuery = '';

  async function loadOrders() {
    if (!sb) { renderAdminOrders(); return; }
    try {
      const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) orders = data;
    } catch (e) { console.error(e); }
    const newCount = orders.filter(o => o.status === 'new').length;
    const badge = el('orders-badge');
    if (badge) badge.textContent = newCount;
    document.title = newCount > 0 ? `(${newCount}) DLA7A Admin` : 'DLA7A Admin';
    renderAdminOrders();
  }

  function renderAdminOrders() {
    const container = el('orders-list');
    if (!container) return;
    const q = orderSearchQuery.toLowerCase().trim();
    const filtered = orders.filter(o => {
      const matchStatus = orderStatusFilter === 'all' || (o.status || 'new') === orderStatusFilter;
      const matchSearch = !q || (o.name || '').toLowerCase().includes(q) || (o.phone || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state">${T[lang].emptyOrders}</div>`;
      return;
    }
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const statuses = ['new', 'contacted', 'done', 'cancelled'];
    const statusLabels = {
      ar: { new: 'جديد', contacted: 'تم التواصل', done: 'مكتمل', cancelled: 'ملغي' },
      en: { new: 'New', contacted: 'Contacted', done: 'Done', cancelled: 'Cancelled' }
    };

    const rows = filtered.map(o => {
      const d = o.created_at ? new Date(o.created_at).toLocaleString(lang === 'ar' ? 'ar-MA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      let cleanPhone = (o.phone || '').replace(/\D/g, '');
      if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.slice(1);
      const waMsg = o.lang === 'en'
        ? `Hello ${o.name} 👋 Regarding your order (${o.service || 'DLA7A SERVICE'}), we are contacting you to follow up.`
        : `مرحباً ${o.name} 👋 بخصوص طلبك (${o.service || 'خدمة DLA7A'})، نتواصل معك للمتابعة.`;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
      const selectOpts = statuses.map(s => `<option value="${s}" ${(o.status || 'new') === s ? 'selected' : ''}>${statusLabels[lang][s]}</option>`).join('');

      return `<tr>
        <td class="order-date">${esc(d)}</td>
        <td><strong>${esc(o.name)}</strong></td>
        <td dir="ltr"><a href="${waUrl}" target="_blank" rel="noopener" class="btn-wa"><span>💬</span><span dir="ltr">${esc(o.phone)}</span></a></td>
        <td>${esc(o.service || '-')}</td>
        <td style="max-width:200px;">${esc(o.notes || '-')}</td>
        <td><select class="status-select status-${esc(o.status || 'new')}" onchange="window._admin.updateOrderStatus('${o.id}', this.value)">${selectOpts}</select></td>
        <td><input type="text" class="note-input" value="${esc(o.admin_note || '')}" placeholder="${lang === 'ar' ? 'ملاحظة...' : 'Note...'}" onchange="window._admin.updateOrderNote('${o.id}', this.value)"></td>
        <td><button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteOrder('${o.id}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button></td>
      </tr>`;
    }).join('');

    const cards = filtered.map(o => {
      const d = o.created_at ? new Date(o.created_at).toLocaleString(lang === 'ar' ? 'ar-MA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      let cleanPhone = (o.phone || '').replace(/\D/g, '');
      if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.slice(1);
      const waMsg = o.lang === 'en'
        ? `Hello ${o.name} 👋 Regarding your order (${o.service || 'DLA7A SERVICE'}), we are contacting you to follow up.`
        : `مرحباً ${o.name} 👋 بخصوص طلبك (${o.service || 'خدمة DLA7A'})، نتواصل معك للمتابعة.`;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
      const selectOpts = statuses.map(s => `<option value="${s}" ${(o.status || 'new') === s ? 'selected' : ''}>${statusLabels[lang][s]}</option>`).join('');

      return `<div class="order-card">
        <div class="order-row"><strong>${esc(o.name)}</strong><span class="order-date">${esc(d)}</span></div>
        <div class="order-row"><a href="${waUrl}" target="_blank" rel="noopener" class="btn-wa"><span>💬</span><span dir="ltr">${esc(o.phone)}</span></a><span class="status-badge status-${esc(o.status || 'new')}">${statusLabels[lang][o.status || 'new']}</span></div>
        <div><strong>${lang === 'ar' ? 'الخدمة:' : 'Service:'}</strong> ${esc(o.service || '-')}</div>
        ${o.notes ? `<div><strong>${lang === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong> ${esc(o.notes)}</div>` : ''}
        <div class="order-row" style="margin-top:4px;"><select class="status-select" style="flex:1;" onchange="window._admin.updateOrderStatus('${o.id}', this.value)">${selectOpts}</select><button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteOrder('${o.id}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button></div>
        <input type="text" class="note-input" value="${esc(o.admin_note || '')}" placeholder="${lang === 'ar' ? 'ملاحظة داخلية...' : 'Internal note...'}" onchange="window._admin.updateOrderNote('${o.id}', this.value)">
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="orders-table-wrap"><table class="orders-table">
        <thead><tr><th>${lang === 'ar' ? 'التاريخ' : 'Date'}</th><th>${lang === 'ar' ? 'الاسم' : 'Name'}</th><th>${lang === 'ar' ? 'الهاتف' : 'Phone'}</th><th>${lang === 'ar' ? 'الخدمة' : 'Service'}</th><th>${lang === 'ar' ? 'ملاحظات' : 'Notes'}</th><th>${lang === 'ar' ? 'الحالة' : 'Status'}</th><th>${lang === 'ar' ? 'ملاحظة الإدارة' : 'Admin Note'}</th><th>${lang === 'ar' ? 'إجراءات' : 'Actions'}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="orders-mobile-cards">${cards}</div>
    `;
  }

  let creators = [];

  function resizeImageToWebP(blobOrFile, maxWidth = 800) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blobOrFile);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (w / h >= 1.3) maxWidth = 1000;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Export failed')), 'image/webp', 0.85);
      };
      img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  function getPhotoUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (sb) {
      const { data } = sb.storage.from('creators').getPublicUrl(path);
      return data ? data.publicUrl : path;
    }
    return path;
  }

  async function loadCreators() {
    if (!sb) { renderAdminCreators(); return; }
    try {
      const { data, error } = await sb.from('creators').select('*').order('sort_order', { ascending: true });
      if (!error && Array.isArray(data)) creators = data;
    } catch (e) { console.error(e); }
    renderAdminCreators();
  }

  function renderAdminCreators() {
    const container = el('admin-creators-list');
    if (!container) return;
    if (!creators.length) {
      container.innerHTML = `<div class="empty-state">${T[lang].emptyCreators}</div>`;
      return;
    }
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const rows = creators.map((c, i) => {
      const pUrl = getPhotoUrl(c.photo_path);
      const thumb = pUrl ? `<img src="${encodeURI(pUrl)}" class="c-thumb" alt="${esc(c.name)}">` : '<div class="c-thumb"></div>';
      return `<tr>
        <td><div class="action-cell">
          <button type="button" class="btn-reorder" onclick="window._admin.moveCreator(${i}, -1)" ${i === 0 ? 'disabled' : ''} aria-label="Up">▲</button>
          <button type="button" class="btn-reorder" onclick="window._admin.moveCreator(${i}, 1)" ${i === creators.length - 1 ? 'disabled' : ''} aria-label="Down">▼</button>
        </div></td>
        <td>${thumb}</td>
        <td><strong>${esc(c.name)}</strong></td>
        <td dir="ltr">${esc(c.handle || '-')}</td>
        <td>${esc(c.platform || 'instagram')}</td>
        <td dir="ltr">${esc(c.followers || '-')}</td>
        <td><button type="button" class="toggle-btn ${c.visible ? 'is-visible' : ''}" onclick="window._admin.toggleVisibility('${c.id}', ${c.visible})">${c.visible ? (lang === 'ar' ? 'ظاهر' : 'Visible') : (lang === 'ar' ? 'مخفي' : 'Hidden')}</button></td>
        <td><div class="action-cell">
          <button type="button" class="ctrl-btn" onclick="window._admin.openCreatorModal('${c.id}')">${lang === 'ar' ? 'تعديل' : 'Edit'}</button>
          <button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteCreator('${c.id}', '${esc(c.photo_path || '')}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button>
        </div></td>
      </tr>`;
    }).join('');

    const cards = creators.map((c, i) => {
      const pUrl = getPhotoUrl(c.photo_path);
      const thumb = pUrl ? `<img src="${encodeURI(pUrl)}" class="c-thumb" alt="${esc(c.name)}">` : '<div class="c-thumb"></div>';
      return `<div class="creator-admin-card">
        <div class="card-top">${thumb}<div class="card-info">
          <strong>${esc(c.name)}</strong>
          <span dir="ltr" class="muted">${esc(c.handle || '')} • ${esc(c.platform || '')}</span>
          <span dir="ltr">${esc(c.followers || '')}</span>
        </div></div>
        <div class="card-actions">
          <button type="button" class="btn-reorder" onclick="window._admin.moveCreator(${i}, -1)" ${i === 0 ? 'disabled' : ''} aria-label="Up">▲</button>
          <button type="button" class="btn-reorder" onclick="window._admin.moveCreator(${i}, 1)" ${i === creators.length - 1 ? 'disabled' : ''} aria-label="Down">▼</button>
          <button type="button" class="toggle-btn ${c.visible ? 'is-visible' : ''}" onclick="window._admin.toggleVisibility('${c.id}', ${c.visible})">${c.visible ? (lang === 'ar' ? 'ظاهر' : 'Visible') : (lang === 'ar' ? 'مخفي' : 'Hidden')}</button>
          <button type="button" class="ctrl-btn" onclick="window._admin.openCreatorModal('${c.id}')">${lang === 'ar' ? 'تعديل' : 'Edit'}</button>
          <button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteCreator('${c.id}', '${esc(c.photo_path || '')}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="creators-table-wrap"><table class="creators-table">
        <thead><tr><th>${lang === 'ar' ? 'ترتيب' : 'Order'}</th><th>${lang === 'ar' ? 'صورة' : 'Photo'}</th><th>${lang === 'ar' ? 'الاسم' : 'Name'}</th><th>${lang === 'ar' ? 'المعرف' : 'Handle'}</th><th>${lang === 'ar' ? 'المنصة' : 'Platform'}</th><th>${lang === 'ar' ? 'المتابعون' : 'Followers'}</th><th>${lang === 'ar' ? 'الحالة' : 'Status'}</th><th>${lang === 'ar' ? 'إجراءات' : 'Actions'}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="creators-mobile-cards">${cards}</div>
    `;
  }

  function openCreatorModal(id = null) {
    el('creator-form').reset();
    el('creator-id').value = '';
    el('creator-photo-path').value = '';
    el('err-c-name').classList.add('hidden');
    el('err-c-url').classList.add('hidden');
    el('err-c-photo').classList.add('hidden');
    el('c-photo-preview').classList.add('hidden');
    el('c-preview-img').src = '';
    if (id) {
      const c = creators.find(item => String(item.id) === String(id));
      if (c) {
        el('creator-form-title').textContent = T[lang].editCreator;
        el('creator-id').value = c.id;
        el('creator-photo-path').value = c.photo_path || '';
        el('c-name').value = c.name || '';
        el('c-handle').value = c.handle || '';
        el('c-platform').value = c.platform || 'instagram';
        el('c-followers').value = c.followers || '';
        el('c-url').value = c.url || '';
        el('c-role-ar').value = c.role_ar || '';
        el('c-role-en').value = c.role_en || '';
        const pUrl = getPhotoUrl(c.photo_path);
        if (pUrl) {
          el('c-preview-img').src = pUrl;
          el('c-photo-preview').classList.remove('hidden');
        }
      }
    } else {
      el('creator-form-title').textContent = T[lang].addCreator;
    }
    el('creator-modal').classList.remove('hidden');
  }

  function closeCreatorModal() {
    el('creator-modal').classList.add('hidden');
  }

  async function toggleVisibility(id, cur) {
    if (!sb) return;
    try {
      await sb.from('creators').update({ visible: !cur }).eq('id', id);
      await loadCreators();
    } catch (e) { console.error(e); }
  }

  async function deleteCreator(id, photoPath) {
    if (!confirm(T[lang].confirmDel)) return;
    if (!sb) return;
    try {
      if (photoPath && !photoPath.startsWith('http')) {
        await sb.storage.from('creators').remove([photoPath]);
      }
      await sb.from('creators').delete().eq('id', id);
      await loadCreators();
    } catch (e) { console.error(e); }
  }

  async function moveCreator(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= creators.length || !sb) return;
    const c1 = creators[idx], c2 = creators[targetIdx];
    const s1 = c1.sort_order ?? idx, s2 = c2.sort_order ?? targetIdx;
    const newS1 = s2 === s1 ? (dir > 0 ? s1 + 1 : s1 - 1) : s2;
    const newS2 = s1;
    try {
      await Promise.all([
        sb.from('creators').update({ sort_order: newS1 }).eq('id', c1.id),
        sb.from('creators').update({ sort_order: newS2 }).eq('id', c2.id)
      ]);
      await loadCreators();
    } catch (e) { console.error(e); }
  }

  el('c-photo-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    el('err-c-photo').classList.add('hidden');
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      el('err-c-photo').textContent = T[lang].errPhotoSize;
      el('err-c-photo').classList.remove('hidden');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      el('c-preview-img').src = ev.target.result;
      el('c-photo-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
  el('c-preview-img')?.addEventListener('load', e => {
    const img = e.currentTarget;
    img.parentElement.classList.toggle('is-wide', img.naturalWidth / img.naturalHeight >= 1.3);
  });

  el('creator-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = el('c-name').value.trim();
    const url = el('c-url').value.trim();
    const file = el('c-photo-file').files[0];
    let valid = true;

    el('err-c-name').classList.add('hidden');
    el('err-c-url').classList.add('hidden');
    el('err-c-photo').classList.add('hidden');

    if (!name) {
      el('err-c-name').textContent = T[lang].errName;
      el('err-c-name').classList.remove('hidden');
      valid = false;
    }
    if (url && !/^https?:\/\//i.test(url)) {
      el('err-c-url').textContent = T[lang].errUrl;
      el('err-c-url').classList.remove('hidden');
      valid = false;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      el('err-c-photo').textContent = T[lang].errPhotoSize;
      el('err-c-photo').classList.remove('hidden');
      valid = false;
    }
    if (!valid || !sb) return;

    const saveBtn = el('btn-save-creator');
    saveBtn.disabled = true;
    saveBtn.querySelector('.btn-text').classList.add('hidden');
    saveBtn.querySelector('.btn-spinner').classList.remove('hidden');

    try {
      let photoPath = el('creator-photo-path').value;
      if (file) {
        const webpBlob = await resizeImageToWebP(file, 800);
        const fileName = `creator_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`;
        const { error: upErr } = await sb.storage.from('creators').upload(fileName, webpBlob, { contentType: 'image/webp' });
        if (upErr) throw upErr;
        if (photoPath && !photoPath.startsWith('http')) {
          await sb.storage.from('creators').remove([photoPath]);
        }
        photoPath = fileName;
      }

      const id = el('creator-id').value;
      const payload = {
        name,
        handle: el('c-handle').value.trim(),
        platform: el('c-platform').value,
        followers: el('c-followers').value.trim(),
        url: url || null,
        role_ar: el('c-role-ar').value.trim() || null,
        role_en: el('c-role-en').value.trim() || null,
        photo_path: photoPath || null
      };

      if (id) {
        await sb.from('creators').update(payload).eq('id', id);
      } else {
        const maxSort = creators.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
        payload.sort_order = maxSort + 1;
        payload.visible = true;
        await sb.from('creators').insert([payload]);
      }
      closeCreatorModal();
      await loadCreators();
    } catch (err) {
      console.error(err);
      alert('Error saving creator: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.querySelector('.btn-text').classList.remove('hidden');
      saveBtn.querySelector('.btn-spinner').classList.add('hidden');
    }
  });

  async function importFromInfluencers() {
    if (!sb || !window.INFLUENCERS) return;
    const statusBox = el('creators-import-status');
    statusBox.classList.remove('hidden');
    const existingHandles = new Set(creators.map(c => (c.handle || '').toLowerCase().trim()));
    const toImport = window.INFLUENCERS.filter(item => !existingHandles.has((item.handle || '').toLowerCase().trim()));

    if (!toImport.length) {
      statusBox.textContent = lang === 'ar' ? 'جميع المؤثرين مستوردون بالفعل.' : 'All creators are already imported.';
      return;
    }

    let maxSort = creators.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
    for (let i = 0; i < toImport.length; i++) {
      const item = toImport[i];
      statusBox.textContent = (lang === 'ar' ? 'استيراد ' : 'Importing ') + (i + 1) + ' / ' + toImport.length + ': ' + item.name;
      try {
        let photoPath = null;
        if (item.photo) {
          try {
            const resp = await fetch(item.photo);
            if (resp.ok) {
              const rawBlob = await resp.blob();
              const webpBlob = await resizeImageToWebP(rawBlob, 800);
              const fileName = `imported_${Date.now()}_${i}.webp`;
              const { error: upErr } = await sb.storage.from('creators').upload(fileName, webpBlob, { contentType: 'image/webp' });
              if (!upErr) photoPath = fileName;
            }
          } catch (pe) { console.warn('Photo import fail:', pe); }
        }
        maxSort++;
        await sb.from('creators').insert([{
          name: item.name,
          handle: item.handle,
          platform: item.platform || 'instagram',
          followers: item.followers,
          url: item.url || null,
          role_ar: item.role_ar || null,
          role_en: item.role_en || null,
          photo_path: photoPath,
          visible: !item.hidden,
          sort_order: maxSort
        }]);
      } catch (err) {
        console.warn('Import failed for ' + item.name, err);
      }
    }
    statusBox.textContent = lang === 'ar' ? 'اكتمل الاستيراد بنجاح!' : 'Import completed!';
    await loadCreators();
  }

  el('btn-add-creator')?.addEventListener('click', () => openCreatorModal());
  el('btn-import-creators')?.addEventListener('click', importFromInfluencers);
  el('btn-close-creator-modal')?.addEventListener('click', closeCreatorModal);
  el('btn-cancel-creator')?.addEventListener('click', closeCreatorModal);

  async function updateOrderStatus(id, newStatus) {
    const item = orders.find(o => String(o.id) === String(id));
    if (item) item.status = newStatus;
    const newCount = orders.filter(o => o.status === 'new').length;
    if (el('orders-badge')) el('orders-badge').textContent = newCount;
    document.title = newCount > 0 ? `(${newCount}) DLA7A Admin` : 'DLA7A Admin';
    renderAdminOrders();
    if (sb) {
      try {
        await sb.from('orders').update({ status: newStatus }).eq('id', id);
      } catch (e) { console.error(e); }
    }
  }

  async function updateOrderNote(id, note) {
    const item = orders.find(o => String(o.id) === String(id));
    if (item) item.admin_note = note;
    if (sb) {
      try {
        await sb.from('orders').update({ admin_note: note }).eq('id', id);
      } catch (e) { console.error(e); }
    }
  }

  async function deleteOrder(id) {
    if (!confirm(T[lang].confirmDelOrder)) return;
    orders = orders.filter(o => String(o.id) !== String(id));
    const newCount = orders.filter(o => o.status === 'new').length;
    if (el('orders-badge')) el('orders-badge').textContent = newCount;
    document.title = newCount > 0 ? `(${newCount}) DLA7A Admin` : 'DLA7A Admin';
    renderAdminOrders();
    if (sb) {
      try {
        await sb.from('orders').delete().eq('id', id);
      } catch (e) { console.error(e); }
    }
  }

  function exportOrdersCsv() {
    const q = orderSearchQuery.toLowerCase().trim();
    const filtered = orders.filter(o => {
      const matchStatus = orderStatusFilter === 'all' || (o.status || 'new') === orderStatusFilter;
      const matchSearch = !q || (o.name || '').toLowerCase().includes(q) || (o.phone || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });

    const headers = ['Date', 'Name', 'Phone', 'Service', 'Notes', 'Status', 'Admin Note', 'Language'];
    const csvRows = [headers.join(',')];
    const escCsv = val => `"${String(val || '').replace(/"/g, '""')}"`;

    filtered.forEach(o => {
      const d = o.created_at ? new Date(o.created_at).toISOString() : '';
      csvRows.push([
        escCsv(d), escCsv(o.name), escCsv(o.phone), escCsv(o.service),
        escCsv(o.notes), escCsv(o.status || 'new'), escCsv(o.admin_note), escCsv(o.lang)
      ].join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dla7a_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  el('filter-order-status')?.addEventListener('change', e => {
    orderStatusFilter = e.target.value;
    renderAdminOrders();
  });

  el('search-orders')?.addEventListener('input', e => {
    orderSearchQuery = e.target.value;
    renderAdminOrders();
  });

  el('btn-export-orders')?.addEventListener('click', exportOrdersCsv);

  // -------------------------------------------------------------
  // PRODUCTS MANAGEMENT
  // -------------------------------------------------------------
  let products = [], productCategoryFilter = 'all', productSearchQuery = '';
  const productCatLabels = {
    ar: { accounts: 'حسابات', social: 'سوشيال ميديا', whatsapp: 'واتساب', gaming: 'ألعاب', other: 'أخرى' },
    en: { accounts: 'Accounts', social: 'Social', whatsapp: 'WhatsApp', gaming: 'Gaming', other: 'Other' }
  };

  function getProductPhotoUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (sb) {
      const { data } = sb.storage.from('products').getPublicUrl(path);
      return data ? data.publicUrl : path;
    }
    return path;
  }

  async function loadProducts() {
    if (!sb) { renderAdminProducts(); return; }
    try {
      const { data, error } = await sb.from('products').select('*').order('sort_order', { ascending: true });
      if (!error && Array.isArray(data)) products = data;
    } catch (e) { console.error('Error loading products:', e); }
    renderAdminProducts();
  }

  function renderAdminProducts() {
    const container = el('admin-products-list');
    if (!container) return;
    const q = productSearchQuery.toLowerCase().trim();
    const filtered = products.filter(p => {
      const matchCat = productCategoryFilter === 'all' || (p.category || 'other') === productCategoryFilter;
      const nameAr = (p.name_ar || '').toLowerCase();
      const nameEn = (p.name_en || '').toLowerCase();
      const badge = (p.badge || '').toLowerCase();
      const matchSearch = !q || nameAr.includes(q) || nameEn.includes(q) || badge.includes(q);
      return matchCat && matchSearch;
    });

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state">${T[lang].emptyProducts}</div>`;
      return;
    }

    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const cats = productCatLabels[lang] || productCatLabels.en;

    const rows = filtered.map((p, i) => {
      const pUrl = getProductPhotoUrl(p.photo_path);
      const thumb = pUrl ? `<img src="${encodeURI(pUrl)}" class="p-thumb" alt="${esc(p.name_en || p.name_ar)}">` : '<div class="p-thumb"></div>';
      const displayName = lang === 'ar' ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar);
      const catLabel = cats[p.category] || p.category || 'Other';
      const priceStr = (p.price != null && p.price !== '') ? `<span dir="ltr">${p.price} MAD</span>` : '-';
      const priceNote = lang === 'ar' ? (p.price_note_ar || '') : (p.price_note_en || '');
      const badgeHtml = p.badge ? `<span class="badge-pill">${esc(p.badge)}</span>` : '';

      return `<tr>
        <td><div class="action-cell">
          <button type="button" class="btn-reorder" onclick="window._admin.moveProduct(${i}, -1)" ${i === 0 ? 'disabled' : ''} aria-label="Up">▲</button>
          <button type="button" class="btn-reorder" onclick="window._admin.moveProduct(${i}, 1)" ${i === filtered.length - 1 ? 'disabled' : ''} aria-label="Down">▼</button>
        </div></td>
        <td>${thumb}</td>
        <td><strong>${esc(displayName)}</strong>${badgeHtml}</td>
        <td><span class="category-badge">${esc(catLabel)}</span></td>
        <td>${priceStr} ${priceNote ? `<small class="muted">(${esc(priceNote)})</small>` : ''}</td>
        <td><button type="button" class="toggle-btn ${p.in_stock ? 'is-stock' : 'is-out'}" onclick="window._admin.toggleProductStock('${p.id}', ${p.in_stock})">${p.in_stock ? T[lang].inStock : T[lang].outOfStock}</button></td>
        <td><button type="button" class="toggle-btn ${p.visible ? 'is-visible' : ''}" onclick="window._admin.toggleProductVisibility('${p.id}', ${p.visible})">${p.visible ? T[lang].visible : T[lang].hidden}</button></td>
        <td><div class="action-cell">
          <button type="button" class="ctrl-btn" onclick="window._admin.openProductModal('${p.id}')">${lang === 'ar' ? 'تعديل' : 'Edit'}</button>
          <button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteProduct('${p.id}', '${esc(p.photo_path || '')}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button>
        </div></td>
      </tr>`;
    }).join('');

    const cards = filtered.map((p, i) => {
      const pUrl = getProductPhotoUrl(p.photo_path);
      const thumb = pUrl ? `<img src="${encodeURI(pUrl)}" class="p-thumb" alt="${esc(p.name_en || p.name_ar)}">` : '<div class="p-thumb"></div>';
      const displayName = lang === 'ar' ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar);
      const catLabel = cats[p.category] || p.category || 'Other';
      const priceStr = (p.price != null && p.price !== '') ? `<span dir="ltr">${p.price} MAD</span>` : '-';
      const priceNote = lang === 'ar' ? (p.price_note_ar || '') : (p.price_note_en || '');
      const badgeHtml = p.badge ? `<span class="badge-pill">${esc(p.badge)}</span>` : '';

      return `<div class="product-admin-card">
        <div class="card-top">${thumb}<div class="card-info">
          <div><strong>${esc(displayName)}</strong>${badgeHtml}</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px;">
            <span class="category-badge">${esc(catLabel)}</span>
            <span>${priceStr} ${priceNote ? `<small class="muted">(${esc(priceNote)})</small>` : ''}</span>
            <span class="stock-badge ${p.in_stock ? 'stock-in' : 'stock-out'}">${p.in_stock ? T[lang].inStock : T[lang].outOfStock}</span>
          </div>
        </div></div>
        <div class="card-actions">
          <button type="button" class="btn-reorder" onclick="window._admin.moveProduct(${i}, -1)" ${i === 0 ? 'disabled' : ''} aria-label="Up">▲</button>
          <button type="button" class="btn-reorder" onclick="window._admin.moveProduct(${i}, 1)" ${i === filtered.length - 1 ? 'disabled' : ''} aria-label="Down">▼</button>
          <button type="button" class="toggle-btn ${p.in_stock ? 'is-stock' : 'is-out'}" onclick="window._admin.toggleProductStock('${p.id}', ${p.in_stock})">${p.in_stock ? T[lang].inStock : T[lang].outOfStock}</button>
          <button type="button" class="toggle-btn ${p.visible ? 'is-visible' : ''}" onclick="window._admin.toggleProductVisibility('${p.id}', ${p.visible})">${p.visible ? T[lang].visible : T[lang].hidden}</button>
          <button type="button" class="ctrl-btn" onclick="window._admin.openProductModal('${p.id}')">${lang === 'ar' ? 'تعديل' : 'Edit'}</button>
          <button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteProduct('${p.id}', '${esc(p.photo_path || '')}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="products-table-wrap"><table class="products-table">
        <thead><tr><th>${lang === 'ar' ? 'ترتيب' : 'Order'}</th><th>${lang === 'ar' ? 'صورة' : 'Photo'}</th><th>${lang === 'ar' ? 'الاسم' : 'Name'}</th><th>${lang === 'ar' ? 'الفئة' : 'Category'}</th><th>${lang === 'ar' ? 'السعر' : 'Price'}</th><th>${lang === 'ar' ? 'المخزون' : 'Stock'}</th><th>${lang === 'ar' ? 'الحالة' : 'Status'}</th><th>${lang === 'ar' ? 'إجراءات' : 'Actions'}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="products-mobile-cards">${cards}</div>
    `;
  }

  async function moveProduct(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= products.length || !sb) return;
    const p1 = products[idx], p2 = products[targetIdx];
    const s1 = p1.sort_order ?? idx, s2 = p2.sort_order ?? targetIdx;
    const newS1 = s2 === s1 ? (dir > 0 ? s1 + 1 : s1 - 1) : s2;
    const newS2 = s1;
    try {
      await Promise.all([
        sb.from('products').update({ sort_order: newS1 }).eq('id', p1.id),
        sb.from('products').update({ sort_order: newS2 }).eq('id', p2.id)
      ]);
      await loadProducts();
    } catch (e) { console.error('Error reordering products:', e); }
  }

  async function toggleProductVisibility(id, cur) {
    if (!sb) return;
    try {
      await sb.from('products').update({ visible: !cur }).eq('id', id);
      await loadProducts();
    } catch (e) { console.error('Error toggling product visibility:', e); }
  }

  async function toggleProductStock(id, cur) {
    if (!sb) return;
    try {
      await sb.from('products').update({ in_stock: !cur }).eq('id', id);
      await loadProducts();
    } catch (e) { console.error('Error toggling product stock:', e); }
  }

  async function deleteProduct(id, photoPath) {
    if (!confirm(T[lang].confirmDelProduct)) return;
    if (!sb) return;
    try {
      if (photoPath && !photoPath.startsWith('http')) {
        await sb.storage.from('products').remove([photoPath]);
      }
      await sb.from('products').delete().eq('id', id);
      await loadProducts();
    } catch (e) { console.error('Error deleting product:', e); }
  }

  function openProductModal(id = null) {
    el('product-form').reset();
    el('product-id').value = '';
    el('product-photo-path').value = '';
    el('err-p-name-ar').classList.add('hidden');
    el('err-p-name-en').classList.add('hidden');
    el('err-p-photo').classList.add('hidden');
    el('p-photo-preview').classList.add('hidden');
    el('p-preview-img').src = '';
    el('p-in-stock').checked = true;
    el('p-visible').checked = true;

    if (id) {
      const p = products.find(item => String(item.id) === String(id));
      if (p) {
        el('product-form-title').textContent = T[lang].editProduct;
        el('product-id').value = p.id;
        el('product-photo-path').value = p.photo_path || '';
        el('p-category').value = p.category || 'accounts';
        el('p-name-ar').value = p.name_ar || '';
        el('p-name-en').value = p.name_en || '';
        el('p-desc-ar').value = p.desc_ar || '';
        el('p-desc-en').value = p.desc_en || '';
        el('p-price').value = p.price != null ? p.price : '';
        el('p-price-note-ar').value = p.price_note_ar || '';
        el('p-price-note-en').value = p.price_note_en || '';
        el('p-badge').value = p.badge || '';
        el('p-in-stock').checked = p.in_stock !== false;
        el('p-visible').checked = p.visible !== false;

        const pUrl = getProductPhotoUrl(p.photo_path);
        if (pUrl) {
          el('p-preview-img').src = pUrl;
          el('p-photo-preview').classList.remove('hidden');
        }
      }
    } else {
      el('product-form-title').textContent = T[lang].addProduct;
    }
    el('product-modal').classList.remove('hidden');
  }

  function closeProductModal() {
    el('product-modal').classList.add('hidden');
  }

  el('p-photo-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    el('err-p-photo').classList.add('hidden');
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      el('err-p-photo').textContent = T[lang].errPhotoSize;
      el('err-p-photo').classList.remove('hidden');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      el('p-preview-img').src = ev.target.result;
      el('p-photo-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  el('product-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const nameAr = el('p-name-ar').value.trim();
    const nameEn = el('p-name-en').value.trim();
    const file = el('p-photo-file').files[0];
    let valid = true;

    el('err-p-name-ar').classList.add('hidden');
    el('err-p-name-en').classList.add('hidden');
    el('err-p-photo').classList.add('hidden');

    if (!nameAr) {
      el('err-p-name-ar').textContent = T[lang].errNameAr;
      el('err-p-name-ar').classList.remove('hidden');
      valid = false;
    }
    if (!nameEn) {
      el('err-p-name-en').textContent = T[lang].errNameEn;
      el('err-p-name-en').classList.remove('hidden');
      valid = false;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      el('err-p-photo').textContent = T[lang].errPhotoSize;
      el('err-p-photo').classList.remove('hidden');
      valid = false;
    }
    if (!valid || !sb) return;

    const saveBtn = el('btn-save-product');
    saveBtn.disabled = true;
    saveBtn.querySelector('.btn-text').classList.add('hidden');
    saveBtn.querySelector('.btn-spinner').classList.remove('hidden');

    try {
      let photoPath = el('product-photo-path').value;
      if (file) {
        const webpBlob = await resizeImageToWebP(file, 800);
        const fileName = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`;
        const { error: upErr } = await sb.storage.from('products').upload(fileName, webpBlob, { contentType: 'image/webp' });
        if (upErr) throw upErr;
        if (photoPath && !photoPath.startsWith('http')) {
          await sb.storage.from('products').remove([photoPath]);
        }
        photoPath = fileName;
      }

      const id = el('product-id').value;
      const rawPrice = el('p-price').value.trim();
      const payload = {
        category: el('p-category').value || 'accounts',
        name_ar: nameAr,
        name_en: nameEn,
        desc_ar: el('p-desc-ar').value.trim() || null,
        desc_en: el('p-desc-en').value.trim() || null,
        price: rawPrice !== '' ? parseFloat(rawPrice) : null,
        price_note_ar: el('p-price-note-ar').value.trim() || null,
        price_note_en: el('p-price-note-en').value.trim() || null,
        badge: el('p-badge').value.trim() || null,
        in_stock: el('p-in-stock').checked,
        visible: el('p-visible').checked,
        photo_path: photoPath || null
      };

      if (id) {
        const { error } = await sb.from('products').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const maxSort = products.reduce((m, p) => Math.max(m, p.sort_order || 0), 0);
        payload.sort_order = maxSort + 1;
        const { error } = await sb.from('products').insert([payload]);
        if (error) throw error;
      }
      closeProductModal();
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert('Error saving product: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.querySelector('.btn-text').classList.remove('hidden');
      saveBtn.querySelector('.btn-spinner').classList.add('hidden');
    }
  });

  el('filter-product-category')?.addEventListener('change', e => {
    productCategoryFilter = e.target.value;
    renderAdminProducts();
  });

  el('search-products')?.addEventListener('input', e => {
    productSearchQuery = e.target.value;
    renderAdminProducts();
  });

  el('btn-add-product')?.addEventListener('click', () => openProductModal());
  el('btn-close-product-modal')?.addEventListener('click', closeProductModal);
  el('btn-cancel-product')?.addEventListener('click', closeProductModal);

  // ===================== UNBAN PROOFS LOGIC =====================
  let unbanPhotos = [];
  let unbanSearchQuery = '';

  function getUnbanPhotoUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/') || path.startsWith('anas/')) return path;
    if (!sb) return path;
    const { data } = sb.storage.from('unban').getPublicUrl(path);
    return data?.publicUrl || path;
  }

  async function loadUnbanPhotos() {
    if (!sb) { renderAdminUnban(); return; }
    try {
      const { data, error } = await sb
        .from('recovered_accounts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) unbanPhotos = data;
    } catch (e) {
      console.error('Error loading unban photos:', e);
    }
    renderAdminUnban();
  }

  function renderAdminUnban() {
    const container = el('admin-unban-list');
    if (!container) return;
    const q = unbanSearchQuery.toLowerCase().trim();
    const filtered = unbanPhotos.filter(u => {
      const capAr = (u.caption_ar || '').toLowerCase();
      const capEn = (u.caption_en || '').toLowerCase();
      return !q || capAr.includes(q) || capEn.includes(q);
    });

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state">${T[lang].emptyUnban}</div>`;
      return;
    }

    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const rows = filtered.map((u, i) => {
      const uUrl = getUnbanPhotoUrl(u.photo_path);
      const thumb = uUrl ? `<img src="${encodeURI(uUrl)}" class="unban-thumb" alt="${esc(u.caption_en || u.caption_ar || 'proof')}">` : '<div class="unban-thumb"></div>';
      const cap = lang === 'ar' ? (u.caption_ar || u.caption_en || '-') : (u.caption_en || u.caption_ar || '-');

      return `<tr>
        <td><div class="action-cell">
          <button type="button" class="btn-reorder" onclick="window._admin.moveUnbanPhoto(${i}, -1)" ${i === 0 ? 'disabled' : ''} aria-label="Up">▲</button>
          <button type="button" class="btn-reorder" onclick="window._admin.moveUnbanPhoto(${i}, 1)" ${i === filtered.length - 1 ? 'disabled' : ''} aria-label="Down">▼</button>
        </div></td>
        <td>${thumb}</td>
        <td><strong>${esc(cap)}</strong></td>
        <td><button type="button" class="toggle-btn ${u.visible ? 'is-visible' : ''}" onclick="window._admin.toggleUnbanVisibility('${u.id}', ${u.visible})">${u.visible ? T[lang].visible : T[lang].hidden}</button></td>
        <td><div class="action-cell">
          <button type="button" class="ctrl-btn" onclick="window._admin.openUnbanModal('${u.id}')">${lang === 'ar' ? 'تعديل' : 'Edit'}</button>
          <button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteUnbanPhoto('${u.id}', '${esc(u.photo_path || '')}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button>
        </div></td>
      </tr>`;
    }).join('');

    const cards = filtered.map((u, i) => {
      const uUrl = getUnbanPhotoUrl(u.photo_path);
      const thumb = uUrl ? `<img src="${encodeURI(uUrl)}" class="unban-thumb" alt="${esc(u.caption_en || u.caption_ar || 'proof')}">` : '<div class="unban-thumb"></div>';
      const cap = lang === 'ar' ? (u.caption_ar || u.caption_en || '-') : (u.caption_en || u.caption_ar || '-');

      return `<div class="unban-admin-card">
        <div class="card-top">${thumb}<div class="card-info">
          <div><strong>${esc(cap)}</strong></div>
          <div style="margin-top:4px;">
            <button type="button" class="toggle-btn ${u.visible ? 'is-visible' : ''}" onclick="window._admin.toggleUnbanVisibility('${u.id}', ${u.visible})">${u.visible ? T[lang].visible : T[lang].hidden}</button>
          </div>
        </div></div>
        <div class="card-actions">
          <button type="button" class="btn-reorder" onclick="window._admin.moveUnbanPhoto(${i}, -1)" ${i === 0 ? 'disabled' : ''} aria-label="Up">▲</button>
          <button type="button" class="btn-reorder" onclick="window._admin.moveUnbanPhoto(${i}, 1)" ${i === filtered.length - 1 ? 'disabled' : ''} aria-label="Down">▼</button>
          <button type="button" class="ctrl-btn" onclick="window._admin.openUnbanModal('${u.id}')">${lang === 'ar' ? 'تعديل' : 'Edit'}</button>
          <button type="button" class="ctrl-btn btn-danger" onclick="window._admin.deleteUnbanPhoto('${u.id}', '${esc(u.photo_path || '')}')">${lang === 'ar' ? 'حذف' : 'Delete'}</button>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="unban-table-wrap"><table class="unban-table">
        <thead><tr><th>${lang === 'ar' ? 'ترتيب' : 'Order'}</th><th>${lang === 'ar' ? 'صورة' : 'Photo'}</th><th>${lang === 'ar' ? 'الوصف' : 'Caption'}</th><th>${lang === 'ar' ? 'الحالة' : 'Status'}</th><th>${lang === 'ar' ? 'إجراءات' : 'Actions'}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="unban-mobile-cards">${cards}</div>
    `;
  }

  async function moveUnbanPhoto(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= unbanPhotos.length || !sb) return;
    const u1 = unbanPhotos[idx], u2 = unbanPhotos[targetIdx];
    const s1 = u1.sort_order ?? idx, s2 = u2.sort_order ?? targetIdx;
    const newS1 = s2 === s1 ? (dir > 0 ? s1 + 1 : s1 - 1) : s2;
    const newS2 = s1;
    try {
      await Promise.all([
        sb.from('recovered_accounts').update({ sort_order: newS1 }).eq('id', u1.id),
        sb.from('recovered_accounts').update({ sort_order: newS2 }).eq('id', u2.id)
      ]);
      await loadUnbanPhotos();
    } catch (e) { console.error('Error reordering unban photos:', e); }
  }

  async function toggleUnbanVisibility(id, cur) {
    if (!sb) return;
    try {
      await sb.from('recovered_accounts').update({ visible: !cur }).eq('id', id);
      await loadUnbanPhotos();
    } catch (e) { console.error('Error toggling unban visibility:', e); }
  }

  async function deleteUnbanPhoto(id, photoPath) {
    if (!confirm(T[lang].confirmDelUnban)) return;
    if (!sb) return;
    try {
      if (photoPath && !photoPath.startsWith('http') && !photoPath.startsWith('anas/')) {
        await sb.storage.from('unban').remove([photoPath]);
      }
      await sb.from('recovered_accounts').delete().eq('id', id);
      await loadUnbanPhotos();
    } catch (e) { console.error('Error deleting unban photo:', e); }
  }

  function openUnbanModal(id = null) {
    el('unban-form').reset();
    el('u-id').value = '';
    el('u-photo-path').value = '';
    el('err-u-photo').classList.add('hidden');
    el('u-photo-preview').classList.add('hidden');
    el('u-preview-img').src = '';
    el('u-visible').checked = true;

    if (id) {
      const u = unbanPhotos.find(item => String(item.id) === String(id));
      if (u) {
        el('unban-form-title').textContent = T[lang].editUnban;
        el('u-id').value = u.id;
        el('u-photo-path').value = u.photo_path || '';
        el('u-caption-ar').value = u.caption_ar || '';
        el('u-caption-en').value = u.caption_en || '';
        el('u-visible').checked = u.visible !== false;

        const uUrl = getUnbanPhotoUrl(u.photo_path);
        if (uUrl) {
          el('u-preview-img').src = uUrl;
          el('u-photo-preview').classList.remove('hidden');
        }
      }
    } else {
      el('unban-form-title').textContent = T[lang].addUnban;
    }
    el('unban-modal').classList.remove('hidden');
  }

  function closeUnbanModal() {
    el('unban-modal').classList.add('hidden');
  }

  async function importFromUnbanGallery() {
    const statusEl = el('unban-import-status');
    const sourceGallery = (typeof UNBAN_GALLERY !== 'undefined' && Array.isArray(UNBAN_GALLERY))
      ? UNBAN_GALLERY : (window.UNBAN_GALLERY || []);
    if (!sourceGallery.length) {
      statusEl.textContent = lang === 'ar' ? 'لا توجد صور في ملف unban-gallery.js' : 'No photos found in unban-gallery.js';
      statusEl.classList.remove('hidden');
      return;
    }
    if (!sb) {
      statusEl.textContent = T[lang].noticeConfig;
      statusEl.classList.remove('hidden');
      return;
    }
    statusEl.textContent = lang === 'ar' ? 'جارٍ الاستيراد...' : 'Importing...';
    statusEl.classList.remove('hidden');
    try {
      const { data: existing } = await sb.from('recovered_accounts').select('photo_path');
      const existingPaths = new Set((existing || []).map(r => r.photo_path));
      let importedCount = 0;
      for (let i = 0; i < sourceGallery.length; i++) {
        const item = sourceGallery[i];
        if (item.photo && !existingPaths.has(item.photo)) {
          const { error } = await sb.from('recovered_accounts').insert([{
            caption_ar: item.caption_ar || null,
            caption_en: item.caption_en || null,
            photo_path: item.photo,
            visible: true,
            sort_order: i + 1
          }]);
          if (!error) importedCount++;
        }
      }
      statusEl.textContent = lang === 'ar'
        ? `تم استيراد ${importedCount} صورة بنجاح.`
        : `Successfully imported ${importedCount} photos.`;
      await loadUnbanPhotos();
    } catch (e) {
      console.error(e);
      statusEl.textContent = 'Error: ' + e.message;
    }
  }

  el('u-photo-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    el('err-u-photo').classList.add('hidden');
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      el('err-u-photo').textContent = T[lang].errPhotoSize;
      el('err-u-photo').classList.remove('hidden');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      el('u-preview-img').src = ev.target.result;
      el('u-photo-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  el('unban-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    el('err-u-photo').classList.add('hidden');

    const file = el('u-photo-file').files[0];
    const existingPhoto = el('u-photo-path').value;
    let valid = true;

    if (!file && !existingPhoto) {
      el('err-u-photo').textContent = T[lang].errPhotoRequired;
      el('err-u-photo').classList.remove('hidden');
      valid = false;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      el('err-u-photo').textContent = T[lang].errPhotoSize;
      el('err-u-photo').classList.remove('hidden');
      valid = false;
    }
    if (!valid || !sb) return;

    const saveBtn = el('btn-save-unban');
    saveBtn.disabled = true;
    saveBtn.querySelector('.btn-text').classList.add('hidden');
    saveBtn.querySelector('.btn-spinner').classList.remove('hidden');

    try {
      let photoPath = existingPhoto;
      if (file) {
        const webpBlob = await resizeImageToWebP(file, 1000);
        const fileName = `unban_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`;
        const { error: upErr } = await sb.storage.from('unban').upload(fileName, webpBlob, { contentType: 'image/webp' });
        if (upErr) throw upErr;
        if (photoPath && !photoPath.startsWith('http') && !photoPath.startsWith('anas/')) {
          await sb.storage.from('unban').remove([photoPath]);
        }
        photoPath = fileName;
      }

      const id = el('u-id').value;
      const payload = {
        caption_ar: el('u-caption-ar').value.trim() || null,
        caption_en: el('u-caption-en').value.trim() || null,
        visible: el('u-visible').checked,
        photo_path: photoPath
      };

      if (id) {
        const { error } = await sb.from('recovered_accounts').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const maxSort = unbanPhotos.reduce((m, u) => Math.max(m, u.sort_order || 0), 0);
        payload.sort_order = maxSort + 1;
        const { error } = await sb.from('recovered_accounts').insert([payload]);
        if (error) throw error;
      }
      closeUnbanModal();
      await loadUnbanPhotos();
    } catch (err) {
      console.error(err);
      alert('Error saving unban photo: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.querySelector('.btn-text').classList.remove('hidden');
      saveBtn.querySelector('.btn-spinner').classList.add('hidden');
    }
  });

  el('search-unban')?.addEventListener('input', e => {
    unbanSearchQuery = e.target.value;
    renderAdminUnban();
  });

  el('btn-add-unban')?.addEventListener('click', () => openUnbanModal());
  el('btn-close-unban-modal')?.addEventListener('click', closeUnbanModal);
  el('btn-cancel-unban')?.addEventListener('click', closeUnbanModal);
  el('btn-import-unban')?.addEventListener('click', importFromUnbanGallery);

  el('btn-logout').addEventListener('click', async () => {
    try { if (sb) await sb.auth.signOut(); } catch (e) {}
    showLogin();
  });
  el('btn-lang').addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
  el('btn-theme').addEventListener('click', () => document.body.classList.toggle('theme-light'));
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  if (sb) {
    sb.auth.getSession().then(({ data }) => { if (data && data.session) showDashboard(data.session); else showLogin(); });
    sb.auth.onAuthStateChange((_, session) => { if (session) showDashboard(session); else showLogin(); });
  } else { showLogin(); }
  setLang('ar');
  window._admin = {
    showDashboard, showLogin, switchTab, loadCreators, renderAdminCreators,
    openCreatorModal, closeCreatorModal, toggleVisibility, deleteCreator, moveCreator,
    importFromInfluencers, resizeImageToWebP,
    loadOrders, renderAdminOrders, updateOrderStatus, updateOrderNote, deleteOrder, exportOrdersCsv,
    loadProducts, renderAdminProducts, openProductModal, closeProductModal,
    toggleProductVisibility, toggleProductStock, deleteProduct, moveProduct,
    loadUnbanPhotos, renderAdminUnban, openUnbanModal, closeUnbanModal,
    toggleUnbanVisibility, deleteUnbanPhoto, moveUnbanPhoto, importFromUnbanGallery,
    get creators() { return creators; },
    set creators(val) { creators = val; },
    get orders() { return orders; },
    set orders(val) { orders = val; },
    get products() { return products; },
    set products(val) { products = val; },
    get unbanPhotos() { return unbanPhotos; },
    set unbanPhotos(val) { unbanPhotos = val; }
  };
})();
