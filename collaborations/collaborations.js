// DLA7A SERVICE - Collaborations Page Controller (Vanilla JS)

(function() {
  let allCreators = [];
  let activePlatform = 'all';
  let searchQuery = '';
  let visibleCount = 12;

  const ICONS = {
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
    tiktok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.84 1.55v-3.38z"/></svg>',
    youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
  }

  function getTranslation(key) {
    const lang = getLang();
    const t = window.TRANSLATIONS && window.TRANSLATIONS[lang] ? window.TRANSLATIONS[lang] : null;
    if (!t) return '';
    return key.split('.').reduce((acc, part) => acc && acc[part], t) || '';
  }

  async function fetchCreators() {
    let items = [];
    const hasSb = window.SUPABASE_URL && !window.SUPABASE_URL.includes('your-project') &&
      window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes('your-anon-key');

    if (hasSb && window.supabase) {
      try {
        if (!window.dla7aSupabase) {
          window.dla7aSupabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        }
        const { data, error } = await window.dla7aSupabase
          .from('creators')
          .select('*')
          .eq('visible', true)
          .order('sort_order', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          items = data.map(c => {
            let photoUrl = c.photo_path || '';
            if (photoUrl && !photoUrl.startsWith('http')) {
              const { data: pub } = window.dla7aSupabase.storage.from('creators').getPublicUrl(photoUrl);
              photoUrl = pub ? pub.publicUrl : photoUrl;
            }
            return {
              name: c.name || '',
              handle: c.handle || '',
              platform: (c.platform || 'instagram').toLowerCase(),
              photo: photoUrl,
              followers: c.followers || '',
              url: c.url || ''
            };
          });
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local dataset', e);
      }
    }

    if (!items.length && typeof INFLUENCERS !== 'undefined' && Array.isArray(INFLUENCERS)) {
      items = INFLUENCERS.filter(inf => !inf.hidden).map(inf => {
        let photo = inf.photo || '';
        if (photo && !photo.startsWith('http') && !photo.startsWith('/')) {
          photo = '/' + photo;
        }
        return {
          name: inf.name || '',
          handle: inf.handle || '',
          platform: (inf.platform || 'instagram').toLowerCase(),
          photo: photo,
          followers: inf.followers || '',
          url: inf.url || ''
        };
      });
    }

    return items;
  }

  function renderFilterTabs() {
    const tabsContainer = document.getElementById('collab-filter-tabs');
    if (!tabsContainer) return;

    const lang = getLang();
    const tCreators = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].creators) || {};
    const platformNames = tCreators.platforms || {
      instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook'
    };
    const allLabel = tCreators.allPlatforms || (lang === 'ar' ? 'الكل' : 'All');

    // Platforms that exist in current dataset
    const available = new Set(allCreators.map(c => c.platform).filter(Boolean));
    const platforms = ['all', ...Array.from(available)];

    tabsContainer.innerHTML = platforms.map(p => {
      const label = p === 'all' ? allLabel : (platformNames[p] || p.charAt(0).toUpperCase() + p.slice(1));
      const isActive = p === activePlatform;
      return `<button type="button" class="collab-tab-pill ${isActive ? 'active' : ''}" data-platform="${esc(p)}">${esc(label)}</button>`;
    }).join('');

    tabsContainer.querySelectorAll('.collab-tab-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const plat = btn.getAttribute('data-platform');
        if (plat !== activePlatform) {
          activePlatform = plat;
          visibleCount = 12;
          renderFilterTabs();
          renderGrid();
        }
      });
    });
  }

  function getFilteredItems() {
    const query = searchQuery.trim().toLowerCase().replace(/^@/, '');
    return allCreators.filter(c => {
      const matchPlatform = activePlatform === 'all' || c.platform === activePlatform;
      if (!matchPlatform) return false;
      if (!query) return true;
      const name = (c.name || '').toLowerCase();
      const handle = (c.handle || '').toLowerCase().replace(/^@/, '');
      return name.includes(query) || handle.includes(query);
    });
  }

  function renderGrid() {
    const gridEl = document.getElementById('collab-grid');
    const loadMoreBtn = document.getElementById('collab-load-more');
    const countNumEl = document.getElementById('collab-count-number');
    const countTxtEl = document.getElementById('collab-count-text');
    if (!gridEl) return;

    const filtered = getFilteredItems();
    const lang = getLang();
    const tCreators = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].creators) || {};

    // Update count in hero
    if (countNumEl) countNumEl.textContent = allCreators.length;
    if (countTxtEl) countTxtEl.textContent = tCreators.countLabel || (lang === 'ar' ? 'مؤثر' : 'creators');

    // Empty state
    if (filtered.length === 0) {
      const msg = allCreators.length === 0
        ? (tCreators.emptyState || (lang === 'ar' ? 'المؤثرون قريباً' : 'Creators coming soon'))
        : (tCreators.noResults || (lang === 'ar' ? 'لم يتم العثور على مؤثرين' : 'No creators found'));
      gridEl.innerHTML = `<li class="collab-empty">${esc(msg)}</li>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    const visibleItems = filtered.slice(0, visibleCount);
    gridEl.innerHTML = visibleItems.map(item => {
      const icon = ICONS[item.platform] || ICONS.instagram;
      const fHtml = item.followers ? `<span class="creator-followers"><span dir="ltr">${esc(item.followers)}</span></span>` : '';
      const hHtml = item.handle ? `<span class="creator-handle" dir="ltr">${esc(item.handle)}</span>` : '';
      const link = item.url ? `<a href="${encodeURI(item.url)}" target="_blank" rel="noopener noreferrer" class="creator-card-link" aria-label="${esc(item.name)}" style="position:absolute;inset:0;z-index:3;"></a>` : '';
      return `<li class="creator-card">
        <img src="${encodeURI(item.photo)}" alt="${esc(item.name)}" loading="lazy" decoding="async" draggable="false" width="280" height="350">
        <span class="creator-platform" aria-hidden="true">${icon}</span>
        <div class="creator-info">
          <span class="creator-name">${esc(item.name)}</span>
          ${hHtml}
          ${fHtml}
        </div>
        ${link}
      </li>`;
    }).join('');

    // Detect image shape for wide cards
    gridEl.querySelectorAll('.creator-card img').forEach(img => {
      const setShape = () => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
        if (img.naturalWidth / img.naturalHeight >= 1.3) {
          const card = img.closest('.creator-card');
          if (card) card.classList.add('creator-card--wide');
        }
      };
      img.addEventListener('load', setShape);
      if (img.complete) setShape();
    });

    // Load more button visibility
    if (loadMoreBtn) {
      if (filtered.length > visibleCount) {
        loadMoreBtn.style.display = 'inline-block';
        loadMoreBtn.textContent = tCreators.loadMore || (lang === 'ar' ? 'تحميل المزيد' : 'Load more');
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  function updateCtaWhatsApp() {
    const ctaWaBtn = document.getElementById('collab-cta-wa');
    if (!ctaWaBtn) return;
    const lang = getLang();
    const tCreators = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].creators) || {};
    const prefill = tCreators.waPrefill || (lang === 'ar'
      ? 'مرحباً DLA7A SERVICE، أنا صانع محتوى وأرغب في التعاون معكم.'
      : 'Hello DLA7A SERVICE, I am a content creator and would like to collaborate with you.');
    ctaWaBtn.href = `https://wa.me/212781385545?text=${encodeURIComponent(prefill)}`;
  }

  async function init() {
    const searchInput = document.getElementById('collab-search-input');
    const loadMoreBtn = document.getElementById('collab-load-more');

    // Setup search listener
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        visibleCount = 12;
        renderGrid();
      });
    }

    // Setup load more listener
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        visibleCount += 12;
        renderGrid();
      });
    }

    // Fetch and initial render
    allCreators = await fetchCreators();
    renderFilterTabs();
    renderGrid();
    updateCtaWhatsApp();

    // Listen for language toggles
    const langToggles = document.querySelectorAll('#lang-toggle-desktop, #lang-toggle-mobile');
    langToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        setTimeout(() => {
          renderFilterTabs();
          renderGrid();
          updateCtaWhatsApp();
        }, 50);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
