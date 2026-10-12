// DLA7A SERVICE - Main Application Script (Vanilla JS)

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let currentLang = localStorage.getItem('dla7a_lang') || 'ar';
  let currentTheme = localStorage.getItem('dla7a_theme') || 'light';
  let activePricingTab = 'ig';

  // Core DOM Elements
  const menuToggleBtn = document.getElementById('menu-toggle-mobile');
  const menuDrawer = document.getElementById('menu-drawer');
  const mainContent = document.getElementById('main-content');
  const themeToggleDesktop = document.getElementById('theme-toggle-desktop');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const langToggleDesktop = document.getElementById('lang-toggle-desktop');
  const langToggleMobile = document.getElementById('lang-toggle-mobile');
  const backToTopBtn = document.getElementById('back-to-top');

  const igHandleText = document.getElementById('ig-handle-text');
  const waDisplayText = document.getElementById('wa-display-text');
  const igLinkBtn = document.getElementById('ig-link-btn');
  const waLinkBtn = document.getElementById('wa-link-btn');
  const floatingWaBtn = document.getElementById('floating-whatsapp');

  const orderForm = document.getElementById('whatsapp-order-form');
  const userServiceSelect = document.getElementById('user-service');

  // Initialize Config Texts
  if (igHandleText) igHandleText.textContent = SITE_CONFIG.instagramHandle;
  if (waDisplayText) waDisplayText.textContent = SITE_CONFIG.whatsappDisplay;
  if (igLinkBtn) igLinkBtn.href = SITE_CONFIG.instagramUrl;

  // Helper: Build WhatsApp URL
  function getWhatsAppUrl(msg) {
    const text = encodeURIComponent(msg || "مرحباً DLA7A SERVICE، أريد الاستفسار عن خدماتكم.");
    return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${text}`;
  }

  // Theme Management
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}

    const isDark = theme === 'dark';
    
    // Update theme toggle icons & aria-labels on desktop and mobile
    const toggles = document.querySelectorAll('[data-theme-toggle]');
    toggles.forEach(btn => {
      btn.textContent = isDark ? '🌙' : '☀️';
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    });

    // Update meta theme-color tag
    const metaThemeColor = document.getElementById('meta-theme-color');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0A0A0A' : '#FFFFFF');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  // Event Delegation for Theme Toggles (Works for desktop, mobile drawer, and any [data-theme-toggle])
  document.addEventListener('click', (e) => {
    const themeBtn = e.target.closest('[data-theme-toggle]');
    if (themeBtn) {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Set Language
  function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('dla7a_lang', lang);
    } catch (e) {}

    // Update text content for data-i18n elements (skipping theme toggle buttons)
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      if (el.hasAttribute('data-theme-toggle')) return;
      const key = el.getAttribute('data-i18n');
      const text = getNestedTranslation(TRANSLATIONS[lang], key);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.innerHTML = text;
        }
      }
    });

    // Update placeholders for data-i18n-placeholder elements
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = getNestedTranslation(TRANSLATIONS[lang], key);
      if (text) {
        el.placeholder = text;
      }
    });

    // Re-apply theme UI
    applyTheme(document.documentElement.dataset.theme || 'light');

    // Update WhatsApp Direct Links with current language greeting
    const fullWaUrl = getWhatsAppUrl(lang === 'ar' ? "مرحباً DLA7A SERVICE، أريد الاستفسار أو طلب خدمة." : "Hello DLA7A SERVICE, I would like to order or inquire about a service.");
    
    const heroWaBtn = document.getElementById('hero-wa-btn');
    if (heroWaBtn) heroWaBtn.href = fullWaUrl;
    if (waLinkBtn) waLinkBtn.href = fullWaUrl;
    if (floatingWaBtn) floatingWaBtn.href = fullWaUrl;

    // IntersectionObserver to hide floating WhatsApp button while hero WhatsApp button is visible
    if (heroWaBtn && floatingWaBtn && !window.heroWaObserver) {
      window.heroWaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            floatingWaBtn.classList.add('wa-hidden-hero');
          } else {
            floatingWaBtn.classList.remove('wa-hidden-hero');
          }
        });
      }, { threshold: 0.1 });
      window.heroWaObserver.observe(heroWaBtn);
    }

    // Render Dynamic Content
    renderHero();
    renderSelectOptions();
    renderServicesOverview();
    renderPricingList();
    renderDigitalAccounts();
    renderWhatsAppServices();
    renderGameTopUp();
    renderWhyUs();
    renderStats();
    renderTestimonials();
    renderPaymentChips();
    renderUnbanSection();
    initUnbanLightbox();
  }

  // Nested translation helper
  function getNestedTranslation(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // Render Hero Section
  function renderHero() {
    const t = TRANSLATIONS[currentLang].hero;

    // Headline - simple text replacement
    const headline = document.querySelector('.hero-headline');
    if (headline) {
      headline.textContent = t.headline;
    }

    // Cards
    const cardsContainer = document.getElementById('hero-cards-container');
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="visual-card card-1">
          <span class="card-timestamp">now</span>
          <div class="card-logo-tile tile-ig">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><radialGradient id="ig-g" cx="30%" cy="107%" r="138%"><stop offset="0%" stop-color="#fdf497"/><stop offset="5%" stop-color="#fdf497"/><stop offset="45%" stop-color="#fd5949"/><stop offset="60%" stop-color="#d6249f"/><stop offset="90%" stop-color="#285AEB"/></radialGradient><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-g)"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="#FFF" stroke-width="1.5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#FFF" stroke-width="2"/></svg>
          </div>
          <div class="card-content">
            <span class="card-title-text">${t.card1Title}</span>
            <span class="card-sub-text">${t.card1Sub}</span>
          </div>
          <span class="card-status-pill status-delivered">${t.card1Status}</span>
        </div>

        <div class="visual-card card-2">
          <span class="card-timestamp">2m ago</span>
          <div class="card-logo-tile tile-tt">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V5.8a6.34 6.34 0 0 0-1-.08 6.34 6.34 0 1 0 6.34 6.34V8.65a8.3 8.3 0 0 0 4.89 1.48V6.69z"/></svg>
          </div>
          <div class="card-content">
            <span class="card-title-text">${t.card2Title}</span>
            <span class="card-sub-text">${t.card2Sub}</span>
          </div>
          <span class="card-status-pill status-completed">${t.card2Status}</span>
        </div>

        <div class="visual-card card-3">
          <span class="card-timestamp">5m ago</span>
          <div class="card-logo-tile tile-netflix">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#E50914"><path d="M16.5 2h-3.5l-3.5 13.5L6 2H2.5v20H6V8.5L9.8 22h3.9l3.8-13.5V22h3.5V2z"/></svg>
          </div>
          <div class="card-content">
            <span class="card-title-text">${t.card3Title}</span>
            <span class="card-sub-text">${t.card3Sub}</span>
          </div>
          <span class="card-status-pill status-ready">${t.card3Status}</span>
        </div>
      `;
    }

    // Entrance animation
    if (!introActive) {
      triggerHeroFadeUp();
    }
  }

  // Render Select Options for Order Form
  function renderSelectOptions() {
    if (!userServiceSelect) return;
    userServiceSelect.innerHTML = '';
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = TRANSLATIONS[currentLang].orderForm.selectPlaceholder;
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    userServiceSelect.appendChild(defaultOpt);

    SELECTABLE_SERVICES.forEach(service => {
      const opt = document.createElement('option');
      opt.value = service;
      opt.textContent = service;
      userServiceSelect.appendChild(opt);
    });
  }

  // Render Services Overview Cards
  function renderServicesOverview() {
    const container = document.getElementById('services-grid');
    if (!container) return;
    container.innerHTML = '';

    const items = TRANSLATIONS[currentLang].services.items;
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const featuresHtml = item.features.map(f => `
        <li class="feature-item">
          <span class="check-mark">✓</span>
          <span>${f}</span>
        </li>
      `).join('');

      const orderMsg = currentLang === 'ar' 
        ? `مرحباً DLA7A SERVICE، أريد طلب (${item.title}).` 
        : `Hello DLA7A SERVICE, I want to order (${item.title}).`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <h3 class="card-title">${item.title}</h3>
          <span class="badge">${item.badge}</span>
        </div>
        <p class="body-text">${item.desc}</p>
        <div class="flex-col" style="gap: 8px; margin-block-start: 4px;">
          <span class="form-label">${TRANSLATIONS[currentLang].services.featuresTitle}</span>
          <ul class="feature-list">${featuresHtml}</ul>
        </div>
        <a href="${getWhatsAppUrl(orderMsg)}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-block-start: auto;">
          ${TRANSLATIONS[currentLang].services.orderBtn}
        </a>
      `;
      container.appendChild(card);
    });
  }

  // Render Social Pricing List Rows
  function renderPricingList() {
    const container = document.getElementById('pricing-list-container');
    if (!container) return;
    container.innerHTML = '';

    const packages = PRICING_PACKAGES[activePricingTab] || [];
    packages.forEach(pkg => {
      const title = currentLang === 'ar' ? pkg.titleAr : pkg.titleEn;
      const price = currentLang === 'ar' ? pkg.price : pkg.priceEn;

      const row = document.createElement('div');
      row.className = 'pricing-row';

      const waMsg = currentLang === 'ar' 
        ? `مرحباً DLA7A SERVICE، أريد طلب باقة (${title}) بسعر (${price}).` 
        : `Hello DLA7A SERVICE, I want to order package (${title}) at (${price}).`;

      row.innerHTML = `
        <div class="pricing-info">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="pricing-title">${title}</span>
            ${pkg.popular ? `<span class="badge" style="font-size:12px; padding: 2px 8px;">${TRANSLATIONS[currentLang].pricing.popularBadge}</span>` : ''}
          </div>
          <span class="micro-text ltr-isolate">${pkg.amount}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
          <span class="pricing-price ltr-isolate">${price}</span>
          <a href="${getWhatsAppUrl(waMsg)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
            ${TRANSLATIONS[currentLang].pricing.orderBtn}
          </a>
        </div>
      `;
      container.appendChild(row);
    });
  }

  // Render Digital Accounts Cards
  function renderDigitalAccounts() {
    const container = document.getElementById('accounts-grid');
    if (!container) return;
    container.innerHTML = '';

    const items = TRANSLATIONS[currentLang].accounts.items;
    items.forEach(acc => {
      const card = document.createElement('div');
      card.className = 'card';

      const featsHtml = acc.feats.map(f => `
        <li class="feature-item">
          <span class="check-mark">✓</span>
          <span>${f}</span>
        </li>
      `).join('');

      const waMsg = currentLang === 'ar'
        ? `مرحباً DLA7A SERVICE، أريد طلب حساب (${acc.name}).`
        : `Hello DLA7A SERVICE, I want to order account (${acc.name}).`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span class="micro-text" style="font-weight: 700;">${acc.cat}</span>
          <span class="badge">${acc.badge}</span>
        </div>
        <h3 class="card-title">${acc.name}</h3>
        <span class="micro-text ltr-isolate" style="font-weight: 600;">${TRANSLATIONS[currentLang].accounts.from} ${acc.note}</span>
        <ul class="feature-list" style="margin-block: 8px;">${featsHtml}</ul>
        <a href="${getWhatsAppUrl(waMsg)}" target="_blank" rel="noopener" class="btn btn-secondary" style="margin-block-start: auto;">
          ${TRANSLATIONS[currentLang].accounts.orderBtn}
        </a>
      `;
      container.appendChild(card);
    });
  }

  // Render WhatsApp Services Cards
  function renderWhatsAppServices() {
    const container = document.getElementById('whatsapp-grid');
    if (!container) return;
    container.innerHTML = '';

    const items = TRANSLATIONS[currentLang].whatsappSec.items;
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';

      const featsHtml = item.features.map(f => `
        <li class="feature-item">
          <span class="check-mark">✓</span>
          <span>${f}</span>
        </li>
      `).join('');

      const waMsg = currentLang === 'ar'
        ? `مرحباً DLA7A SERVICE، أريد طلب (${item.title}).`
        : `Hello DLA7A SERVICE, I want to order (${item.title}).`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <h3 class="card-title">${item.title}</h3>
          <span class="badge">${item.badge}</span>
        </div>
        <p class="body-text">${item.desc}</p>
        <span class="micro-text ltr-isolate" style="font-weight: 700;">${item.price}</span>
        <ul class="feature-list" style="margin-block: 8px;">${featsHtml}</ul>
        <a href="${getWhatsAppUrl(waMsg)}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-block-start: auto;">
          ${TRANSLATIONS[currentLang].whatsappSec.orderBtn}
        </a>
      `;
      container.appendChild(card);
    });
  }

  // Render Game Top-Up Cards
  function renderGameTopUp() {
    const container = document.getElementById('gaming-grid');
    if (!container) return;
    container.innerHTML = '';

    const items = TRANSLATIONS[currentLang].gaming.items;
    items.forEach(g => {
      const card = document.createElement('div');
      card.className = 'card';

      const packsHtml = g.packs.map(p => `
        <li class="feature-item">
          <span class="check-mark">💎</span>
          <span class="ltr-isolate">${p}</span>
        </li>
      `).join('');

      const waMsg = currentLang === 'ar'
        ? `مرحباً DLA7A SERVICE، أريد شحن (${g.title}).`
        : `Hello DLA7A SERVICE, I want to top up (${g.title}).`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <h3 class="card-title">${g.title}</h3>
          <span class="badge">${g.badge}</span>
        </div>
        <p class="body-text">${g.desc}</p>
        <div class="flex-col" style="gap: 6px; margin-block: 8px;">
          <span class="form-label">${TRANSLATIONS[currentLang].gaming.popularPacksTitle}</span>
          <ul class="feature-list">${packsHtml}</ul>
        </div>
        <a href="${getWhatsAppUrl(waMsg)}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-block-start: auto;">
          ${TRANSLATIONS[currentLang].gaming.orderBtn}
        </a>
      `;
      container.appendChild(card);
    });
  }

  // Render Why Choose Us Cards
  function renderWhyUs() {
    const container = document.getElementById('why-grid');
    if (!container) return;
    container.innerHTML = '';

    const items = TRANSLATIONS[currentLang].whyUs.items;
    items.forEach(w => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <h3 class="card-title">${w.title}</h3>
          <span class="badge">${w.tag}</span>
        </div>
        <p class="body-text">${w.desc}</p>
      `;
      container.appendChild(card);
    });
  }

  // Render Stats Cards
  function renderStats() {
    const container = document.getElementById('stats-grid');
    if (!container) return;
    container.innerHTML = '';

    const items = TRANSLATIONS[currentLang].stats.items;
    items.forEach(st => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.textAlign = 'center';
      card.innerHTML = `
        <div class="hero-title ltr-isolate" style="font-size: 40px; color: var(--text-main);">${st.value}</div>
        <div class="card-title">${st.label}</div>
        <div class="micro-text">${st.sub}</div>
      `;
      container.appendChild(card);
    });
  }

  // Render Testimonials Cards
  function renderTestimonials() {
    const container = document.getElementById('testimonials-grid');
    if (!container) return;
    container.innerHTML = '';

    const items = TRANSLATIONS[currentLang].testimonials.items;
    items.forEach(t => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--text-main); color: var(--bg-body); font-weight: 700; display: flex; align-items: center; justify-content: center;">${t.avatar}</div>
            <div>
              <h4 class="card-title" style="font-size: 16px;">${t.name}</h4>
              <span class="micro-text">${t.role} - ${t.city}</span>
            </div>
          </div>
          <span class="micro-text" style="color: currentColor; font-weight: 700;">★★★★★</span>
        </div>
        <p class="body-text" style="font-style: italic;">"${t.comment}"</p>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-block-start: auto; padding-block-start: 8px; border-block-start: 1px solid var(--border-color);">
          <span class="micro-text">${t.service}</span>
          <span class="badge" style="font-size: 12px; padding: 2px 8px;">${TRANSLATIONS[currentLang].testimonials.verified}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Render Payment Methods Text Chips in Footer
  function renderPaymentChips() {
    const container = document.getElementById('payment-chips');
    if (!container) return;
    container.innerHTML = '';

    const chips = TRANSLATIONS[currentLang].footer.payments;
    chips.forEach(chipText => {
      const chip = document.createElement('span');
      chip.className = 'payment-chip';
      chip.textContent = chipText;
      container.appendChild(chip);
    });
  }

  // Render Unban Section
  function renderUnbanSection() {
    const t = TRANSLATIONS[currentLang].unban;
    const fixesGrid = document.getElementById('unban-fixes-grid');
    const stepsContainer = document.getElementById('unban-steps-container');
    const galleryContainer = document.getElementById('unban-gallery-container');
    const emptyState = document.getElementById('unban-empty-state');
    const priceDisplay = document.getElementById('unban-price-display');
    const ctaBtn = document.getElementById('unban-cta-btn');

    // Render fix cards
    if (fixesGrid) {
      fixesGrid.innerHTML = '';
      t.fixes.forEach(fix => {
        const card = document.createElement('div');
        card.className = 'unban-fix-card';
        card.innerHTML = `
          <div class="unban-fix-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              ${getLucideIcon(fix.icon)}
            </svg>
          </div>
          <span class="unban-fix-title">${fix.title}</span>
        `;
        fixesGrid.appendChild(card);
      });
    }

    // Render steps
    if (stepsContainer) {
      stepsContainer.innerHTML = '';
      t.steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'unban-step';
        stepEl.innerHTML = `
          <span class="unban-step-num">${step.num}</span>
          <span class="unban-step-title">${step.title}</span>
        `;
        stepsContainer.appendChild(stepEl);
      });
    }

    // Render gallery
    if (galleryContainer && emptyState) {
      galleryContainer.innerHTML = '';
      
      if (UNBAN_GALLERY.length === 0) {
        galleryContainer.style.display = 'none';
        emptyState.style.display = 'flex';
      } else {
        galleryContainer.style.display = 'grid';
        emptyState.style.display = 'none';

        const initialCount = Math.min(6, UNBAN_GALLERY.length);
        
        for (let i = 0; i < initialCount; i++) {
          const item = UNBAN_GALLERY[i];
          const galleryItem = document.createElement('div');
          galleryItem.className = 'unban-gallery-item';
          galleryItem.dataset.index = i;
          galleryItem.innerHTML = `
            <img src="${item.photo}" alt="${currentLang === 'ar' ? (item.caption_ar || 'حساب مسترجع') : (item.caption_en || 'Recovered account')}" loading="lazy" decoding="async" width="300" height="400">
            <span class="unban-verified-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              ${t.verified}
            </span>
          `;
          galleryItem.addEventListener('click', () => openLightbox(i));
          galleryContainer.appendChild(galleryItem);
        }

        // Add view more button if there are more than 6 photos
        if (UNBAN_GALLERY.length > 6) {
          const viewMoreBtn = document.createElement('button');
          viewMoreBtn.className = 'unban-view-more-btn';
          viewMoreBtn.textContent = t.viewMore;
          viewMoreBtn.addEventListener('click', () => {
            for (let i = 6; i < UNBAN_GALLERY.length; i++) {
              const item = UNBAN_GALLERY[i];
              const galleryItem = document.createElement('div');
              galleryItem.className = 'unban-gallery-item';
              galleryItem.dataset.index = i;
              galleryItem.innerHTML = `
                <img src="${item.photo}" alt="${currentLang === 'ar' ? (item.caption_ar || 'حساب مسترجع') : (item.caption_en || 'Recovered account')}" loading="lazy" decoding="async" width="300" height="400">
                <span class="unban-verified-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  ${t.verified}
                </span>
              `;
              galleryItem.addEventListener('click', () => openLightbox(i));
              galleryContainer.appendChild(galleryItem);
            }
            viewMoreBtn.style.display = 'none';
          });
          galleryContainer.parentElement.appendChild(viewMoreBtn);
        }
      }
    }

    // Update price display
    if (priceDisplay) {
      if (SITE_CONFIG.priceUnban > 0) {
        priceDisplay.textContent = `From ${SITE_CONFIG.priceUnban} MAD`;
      } else {
        priceDisplay.textContent = t.contactForPrice;
      }
    }

    // Update CTA button
    if (ctaBtn) {
      const msg = currentLang === 'ar'
        ? "السلام عليكم، حسابي على إنستغرام محظور/معطل وأريد استرجاعه. اسم الحساب: "
        : "Hello, my Instagram account is banned/disabled. I want to recover it. Username: ";
      ctaBtn.href = getWhatsAppUrl(msg);
    }
  }

  // Lucide icon helper
  function getLucideIcon(iconName) {
    const icons = {
      'ban': '<line x1="8" y1="6" x2="21" y2="6"></line><path d="M17 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10"></path><path d="M14.5 6h-5"></path><line x1="6" y1="4" x2="6" y2="8"></line><line x1="10" y1="4" x2="10" y2="8"></line><line x1="14" y1="4" x2="14" y2="8"></line><line x1="18" y1="4" x2="18" y2="8"></line>',
      'power-off': '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line>',
      'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
      'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
    };
    return icons[iconName] || icons['ban'];
  }

  // Lightbox functionality
  let currentLightboxIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  function initUnbanLightbox() {
    const lightbox = document.getElementById('unban-lightbox');
    const closeBtn = lightbox?.querySelector('.unban-lightbox-close');
    const prevBtn = lightbox?.querySelector('.unban-lightbox-prev');
    const nextBtn = lightbox?.querySelector('.unban-lightbox-next');

    if (!lightbox) return;

    // Close button
    closeBtn?.addEventListener('click', closeLightbox);

    // Navigation buttons
    prevBtn?.addEventListener('click', () => navigateLightbox(-1));
    nextBtn?.addEventListener('click', () => navigateLightbox(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Backdrop click to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Touch swipe support
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        navigateLightbox(1); // Swipe left = next
      } else {
        navigateLightbox(-1); // Swipe right = prev
      }
    }
  }

  function openLightbox(index) {
    const lightbox = document.getElementById('unban-lightbox');
    const img = document.getElementById('unban-lightbox-img');
    const counter = document.getElementById('unban-lightbox-counter');

    if (!lightbox || !img || UNBAN_GALLERY.length === 0) return;

    currentLightboxIndex = index;
    const item = UNBAN_GALLERY[index];
    img.src = item.photo;
    img.alt = currentLang === 'ar' ? (item.caption_ar || 'حساب مسترجع') : (item.caption_en || 'Recovered account');
    
    if (counter) {
      counter.textContent = `${index + 1} / ${UNBAN_GALLERY.length}`;
    }

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    lockScroll();
  }

  function closeLightbox() {
    const lightbox = document.getElementById('unban-lightbox');
    if (!lightbox) return;

    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }

  function navigateLightbox(direction) {
    if (UNBAN_GALLERY.length === 0) return;

    currentLightboxIndex += direction;

    if (currentLightboxIndex < 0) {
      currentLightboxIndex = UNBAN_GALLERY.length - 1;
    } else if (currentLightboxIndex >= UNBAN_GALLERY.length) {
      currentLightboxIndex = 0;
    }

    openLightbox(currentLightboxIndex);
  }

  // Event Listeners: Language Toggles
  if (langToggleDesktop) {
    langToggleDesktop.addEventListener('click', () => setLanguage(currentLang === 'ar' ? 'en' : 'ar'));
  }
  if (langToggleMobile) {
    langToggleMobile.addEventListener('click', () => setLanguage(currentLang === 'ar' ? 'en' : 'ar'));
  }

  // Scroll Lock/Unlock functions
  let savedScrollY = 0;

  function lockScroll() {
    savedScrollY = window.scrollY;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('menu-open');
    if (mainContent) {
      mainContent.setAttribute('inert', '');
      mainContent.setAttribute('aria-hidden', 'true');
    }
  }

  function unlockScroll() {
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    if (mainContent) {
      mainContent.removeAttribute('inert');
      mainContent.removeAttribute('aria-hidden');
    }
  }

  function openDrawer() {
    if (menuDrawer) {
      menuDrawer.classList.add('active');
      menuDrawer.setAttribute('aria-hidden', 'false');
      lockScroll();
      // Swap icons
      const hamburgerIcon = menuToggleBtn.querySelector('.menu-icon-hamburger');
      const closeIcon = menuToggleBtn.querySelector('.menu-icon-close');
      if (hamburgerIcon) hamburgerIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      menuToggleBtn.setAttribute('aria-expanded', 'true');
      menuToggleBtn.setAttribute('aria-label', 'Close menu');
      // Hide WhatsApp float
      const floatingWaBtn = document.getElementById('floating-whatsapp');
      if (floatingWaBtn) floatingWaBtn.classList.add('menu-hidden');
    }
  }

  function closeDrawer() {
    if (menuDrawer) {
      menuDrawer.classList.remove('active');
      menuDrawer.setAttribute('aria-hidden', 'true');
      unlockScroll();
      // Swap icons back
      const hamburgerIcon = menuToggleBtn.querySelector('.menu-icon-hamburger');
      const closeIcon = menuToggleBtn.querySelector('.menu-icon-close');
      if (hamburgerIcon) hamburgerIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      menuToggleBtn.setAttribute('aria-expanded', 'false');
      menuToggleBtn.setAttribute('aria-label', 'Open menu');
      // Show WhatsApp float
      const floatingWaBtn = document.getElementById('floating-whatsapp');
      if (floatingWaBtn) floatingWaBtn.classList.remove('menu-hidden');
    }
  }

  // Event Listeners: Mobile Drawer Toggle & Lock
  if (menuToggleBtn) {
    menuToggleBtn.addEventListener('click', () => {
      if (menuDrawer.classList.contains('active')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  // Close Mobile Drawer when a link is clicked
  const drawerLinks = document.querySelectorAll('.drawer-nav-link');
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuDrawer && menuDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // Close drawer and unlock scroll on window resize past mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && menuDrawer && menuDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // Event Listeners: Pricing Tabs Switcher
  const tabPills = document.querySelectorAll('.tab-pill');
  tabPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      tabPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      activePricingTab = e.target.getAttribute('data-tab');
      renderPricingList();
    });
  });

  // Event Listener: Order Form Submission
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('user-name').value.trim();
      const phone = document.getElementById('user-phone').value.trim();
      const service = userServiceSelect.value;
      const notes = document.getElementById('user-notes').value.trim();

      const errName = TRANSLATIONS[currentLang].orderForm.errName;
      const errPhone = TRANSLATIONS[currentLang].orderForm.errPhone;

      if (!name) {
        alert(errName);
        return;
      }
      if (!phone) {
        alert(errPhone);
        return;
      }

      const msg = currentLang === 'ar'
        ? `مرحباً DLA7A SERVICE 👋\nطلب خدمة جديد عبر الموقع:\n- الاسم: ${name}\n- الهاتف/الواتساب: ${phone}\n- الخدمة: ${service || 'خدمة عامة'}\n- ملاحظات: ${notes || 'لا توجد'}`
        : `Hello DLA7A SERVICE 👋\nNew order from website:\n- Name: ${name}\n- Phone/WhatsApp: ${phone}\n- Service: ${service || 'General'}\n- Notes: ${notes || 'None'}`;

      window.open(getWhatsAppUrl(msg), '_blank');
    });
  }

  // Trigger Hero Entrance Animation
  function triggerHeroFadeUp() {
    const fadeEls = document.querySelectorAll('.hero-fade-up');
    fadeEls.forEach(el => el.classList.remove('visible'));
    fadeEls.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, index * 60);
    });
  }

  // Welcome Intro Splash Screen Controller
  let introActive = false;

  // Failsafe: Force reveal after 2.5s regardless of intro/observer status
  setTimeout(() => {
    document.documentElement.classList.add('reveal-done');
  }, 2500);

  // Enable JS reveal mode
  document.documentElement.classList.add('js-reveal');

  function initWelcomeIntro() {
    const overlay = document.getElementById('welcome-intro-overlay');
    if (!overlay) {
      triggerHeroFadeUp();
      return;
    }

    let isSeen = false;
    let forceReplay = false;
    let reducedMotion = false;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      forceReplay = urlParams.get('intro') === '1' || urlParams.get('replay') === '1';
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      isSeen = sessionStorage.getItem('dla7a_intro_seen') === '1';
    } catch (e) {}

    // Check if intro should be skipped immediately
    if ((isSeen && !forceReplay) || reducedMotion) {
      overlay.classList.add('intro-hidden');
      overlay.style.pointerEvents = 'none';
      overlay.style.visibility = 'hidden';
      overlay.remove();
      unlockScroll();
      triggerHeroFadeUp();
      return;
    }

    introActive = true;
    lockScroll();

    // Set translated text for tagline & skip button
    const tIntro = TRANSLATIONS[currentLang]?.intro || {};
    const skipBtn = document.getElementById('intro-skip-btn');
    const taglineEl = document.getElementById('intro-tagline');
    
    if (skipBtn) skipBtn.textContent = tIntro.skip || (currentLang === 'ar' ? 'تخطي' : 'Skip');
    if (taglineEl) taglineEl.textContent = tIntro.tagline || (currentLang === 'ar' ? 'المنصة رقم 1 للخدمات الرقمية في المغرب' : "Morocco's #1 digital services platform");
    
    if (currentLang === 'ar' && taglineEl) {
      taglineEl.dir = 'rtl';
    } else if (taglineEl) {
      taglineEl.dir = 'ltr';
    }

    let isCompleted = false;
    let timers = [];

    function cleanupAndFinish() {
      if (isCompleted) return;
      isCompleted = true;
      introActive = false;

      timers.forEach(t => clearTimeout(t));

      try {
        sessionStorage.setItem('dla7a_intro_seen', '1');
      } catch (e) {}

      overlay.classList.add('intro-exiting');

      setTimeout(() => {
        overlay.classList.add('intro-hidden');
        overlay.style.pointerEvents = 'none';
        overlay.style.visibility = 'hidden';
        overlay.remove();
        unlockScroll();
      }, 550);

      setTimeout(() => {
        triggerHeroFadeUp();
      }, 100);
    }

    // Failsafe timer (3.5s)
    const failsafeTimer = setTimeout(() => {
      cleanupAndFinish();
    }, 3500);
    timers.push(failsafeTimer);

    // End early on tap / click anywhere on overlay or skip button
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanupAndFinish();
    });

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cleanupAndFinish();
      });
    }

    // Font readiness check before sequence start (max 600ms wait)
    const fontReadyPromise = (document.fonts && document.fonts.ready) 
      ? document.fonts.ready 
      : Promise.resolve();
    const fontTimeoutPromise = new Promise(resolve => setTimeout(resolve, 600));

    Promise.race([fontReadyPromise, fontTimeoutPromise]).then(() => {
      if (isCompleted) return;

      const dot = document.getElementById('intro-pulse-dot');
      const line = document.getElementById('intro-line');
      const letters = overlay.querySelectorAll('.intro-letter');
      const serviceText = document.getElementById('intro-service-text');
      const progressBar = document.getElementById('intro-progress-bar');

      // 0.0s: Line draw & dot & progress line
      timers.push(setTimeout(() => {
        if (dot) dot.classList.add('active');
        if (line) line.classList.add('active');
        if (progressBar) progressBar.classList.add('active');
      }, 50));

      // 0.3s - 1.2s: DLA7A wordmark letters slide up
      timers.push(setTimeout(() => {
        letters.forEach(l => l.classList.add('active'));
      }, 300));

      // 1.0s - 1.5s: SERVICE & Tagline fade in
      timers.push(setTimeout(() => {
        if (serviceText) serviceText.classList.add('active');
        if (taglineEl) taglineEl.classList.add('active');
      }, 1000));

      // 1.7s: Start Curtain Exit
      timers.push(setTimeout(() => {
        cleanupAndFinish();
      }, 1700));
    });
  }

  // Initial Boot
  applyTheme(document.documentElement.dataset.theme || 'light');
  setLanguage(currentLang);
  initWelcomeIntro();
});
