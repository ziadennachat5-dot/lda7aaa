(function() {
  'use strict';
  const isConfigPlaceholder = !window.SUPABASE_URL || window.SUPABASE_URL.includes('your-project') ||
    !window.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY.includes('your-anon-key');
  const sb = (!isConfigPlaceholder && window.supabase)
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

  let lang = 'ar', failedTries = 0, lockUntil = 0, activityTimer = null;
  const T = {
    ar: { title: "تسجيل الدخول", sub: "لوحة تحكم إدارة المتجر", email: "البريد الإلكتروني", pass: "كلمة المرور", submit: "دخول", orders: "الطلبات", creators: "المؤثرون", logout: "خروج", ordersTitle: "سجل الطلبات", creatorsTitle: "إدارة المؤثرين", errAuth: "البيانات المدخلة غير صحيحة", errLock: "محاولات كثيرة. يرجى الانتظار دقيقة", noticeConfig: "لم يتم ضبط Supabase بعد. املأ ملف config.js.", showPass: "عرض كلمة المرور", hidePass: "إخفاء كلمة المرور", addCreator: "+ إضافة مؤثر", importBtn: "استيراد من influencers.js", editCreator: "تعديل مؤثر", save: "حفظ", cancel: "إلغاء", emptyCreators: "لا يوجد مؤثرون حالياً. يمكنك إضافة مؤثر أو الاستيراد.", confirmDel: "هل أنت متأكد من حذف هذا المؤثر نهائياً؟", errName: "الاسم مطلوب", errUrl: "يجب أن يبدأ الرابط بـ https://", errPhotoSize: "حجم الصورة يجب أن لا يتجاوز 5MB", emptyOrders: "لا توجد طلبات حالياً.", exportBtn: "تصدير CSV", searchPlaceholder: "بحث بالاسم أو رقم الهاتف...", confirmDelOrder: "هل أنت متأكد من حذف هذا الطلب نهائياً؟" },
    en: { title: "Sign In", sub: "Store Management Dashboard", email: "Email", pass: "Password", submit: "Sign In", orders: "Orders", creators: "Creators", logout: "Logout", ordersTitle: "Orders Log", creatorsTitle: "Creators Management", errAuth: "Invalid login credentials", errLock: "Too many attempts. Wait 60s", noticeConfig: "Supabase is not configured yet. Fill in config.js.", showPass: "Show password", hidePass: "Hide password", addCreator: "+ Add Creator", importBtn: "Import from influencers.js", editCreator: "Edit Creator", save: "Save", cancel: "Cancel", emptyCreators: "No creators yet. Add a creator or import from influencers.js.", confirmDel: "Are you sure you want to permanently delete this creator?", errName: "Name is required", errUrl: "URL must start with https://", errPhotoSize: "Image must be 5MB or less", emptyOrders: "No orders found.", exportBtn: "Export CSV", searchPlaceholder: "Search name or phone...", confirmDelOrder: "Are you sure you want to delete this order?" }
  };

  const el = id => document.getElementById(id);
  function setLang(l) {
    lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    el('btn-lang').textContent = l === 'ar' ? 'EN' : 'عربي';
    const t = T[l]; el('login-title').textContent = t.title; el('login-sub').textContent = t.sub;
    el('lbl-email').textContent = t.email; el('lbl-password').textContent = t.pass;
    const btnText = el('btn-login-submit').querySelector('.btn-text');
    if (btnText) btnText.textContent = t.submit;
    el('tab-orders-label').textContent = t.orders; el('tab-creators-label').textContent = t.creators; el('btn-logout').textContent = t.logout;
    if (el('orders-title')) el('orders-title').textContent = t.ordersTitle;
    if (el('creators-title')) el('creators-title').textContent = t.creatorsTitle;
    if (el('btn-add-creator')) el('btn-add-creator').textContent = t.addCreator;
    if (el('btn-import-creators')) el('btn-import-creators').textContent = t.importBtn;
    if (el('btn-export-orders')) el('btn-export-orders').textContent = t.exportBtn;
    if (el('search-orders')) el('search-orders').placeholder = t.searchPlaceholder;
    const noticeEl = el('config-notice');
    if (isConfigPlaceholder) { noticeEl.textContent = t.noticeConfig; noticeEl.classList.remove('hidden'); }
    else { noticeEl.classList.add('hidden'); }
    const isPass = el('admin-password').type === 'password';
    el('btn-toggle-pwd').setAttribute('aria-label', isPass ? t.showPass : t.hidePass);
    if (typeof renderAdminCreators === 'function') renderAdminCreators();
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
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
  }

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      const active = b.dataset.tab === name;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    el('tab-orders').classList.toggle('hidden', name !== 'orders');
    el('tab-creators').classList.toggle('hidden', name !== 'creators');
    if (name === 'orders') loadOrders();
    if (name === 'creators') loadCreators();
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
    get creators() { return creators; },
    set creators(val) { creators = val; },
    get orders() { return orders; },
    set orders(val) { orders = val; }
  };
})();
