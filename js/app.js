// ==========================================================================
// js/app.js — Apple iOS Minimalist TMA Controller for "Arzon Ovqat Toshkent"
// ==========================================================================

import { PLACES_DATA, CATEGORIES, TASHKENT_PRESETS } from '../data/places.js';
import {
  DEFAULT_TASHKENT_COORDS,
  calculateHaversineDistance,
  formatDistance,
  formatTravelTime,
  getUserLocation,
  getYandexMapsUrl,
  getYandexNaviUrl,
  getGoogleMapsUrl
} from './utils/geo.js';
import {
  initTelegramApp,
  triggerHaptic,
  setTelegramMainButton,
  setTelegramBackButton,
  openExternalMapLink
} from './utils/telegram.js';

const PAGE_SIZE = 24;
const FAVORITES_STORAGE_KEY = 'arzon_ovqat_favorites_v1';
const THEME_STORAGE_KEY = 'arzon_ovqat_theme_v1';

// Ilova holati (State)
const state = {
  searchQuery: '',
  selectedCategory: 'all',
  selectedDistrict: 'all',
  maxPrice: 'all',
  sortBy: 'price_asc', // 'price_asc' | 'distance_asc' | 'rating_desc'
  viewMode: 'list', // 'list' | 'map'
  favoritesOnly: false,
  nearMeActive: false,
  activePresetId: 'talabalar',
  userCoords: {
    lat: TASHKENT_PRESETS[0].lat,
    lng: TASHKENT_PRESETS[0].lng,
    label: 'Talabalar shaharchasi',
    isRealGps: false
  },
  favorites: loadFavorites(),
  visibleCount: PAGE_SIZE,
  activePlace: null,
  selectedMenuItems: new Set([0]),
  theme: localStorage.getItem(THEME_STORAGE_KEY) || 'dark'
};

let leafletMap = null;
let leafletMarkersLayer = null;
let toastTimer = null;

const dom = {};

function formatPriceUZS(amount) {
  return `${Number(amount).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (_) {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...state.favorites]));
  } catch (_) {}
}

function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add('toast--visible');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('toast--visible');
  }, 2600);
}

function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem(THEME_STORAGE_KEY, state.theme);

  if (dom.themeBtn) {
    dom.themeBtn.innerHTML = state.theme === 'dark' ? '☀️' : '🌙';
  }
}

/**
 * Ma'lumotlarni hisoblash, filtrlash va saralash
 */
function getFilteredAndSortedPlaces() {
  const query = state.searchQuery.trim().toLowerCase();

  const enriched = PLACES_DATA.map((place) => {
    const distanceKm = calculateHaversineDistance(
      state.userCoords.lat,
      state.userCoords.lng,
      place.lat,
      place.lng
    );
    return {
      ...place,
      distanceKm,
      distanceText: formatDistance(distanceKm),
      travelTimeText: formatTravelTime(distanceKm)
    };
  });

  const filtered = enriched.filter((place) => {
    if (state.favoritesOnly && !state.favorites.has(place.id)) {
      return false;
    }

    if (state.selectedCategory !== 'all' && place.category !== state.selectedCategory) {
      return false;
    }

    if (state.selectedDistrict !== 'all' && place.district !== state.selectedDistrict) {
      return false;
    }

    if (state.maxPrice !== 'all' && place.price > Number(state.maxPrice)) {
      return false;
    }

    if (state.nearMeActive && place.distanceKm !== null && place.distanceKm > 4.0) {
      return false;
    }

    if (query) {
      const haystack = `${place.dishName} ${place.name} ${place.district} ${place.landmark} ${place.categoryLabel} ${place.ingredients.join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => {
    if (state.sortBy === 'price_asc') {
      if (a.price !== b.price) return a.price - b.price;
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    }

    if (state.sortBy === 'distance_asc') {
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    }

    if (state.sortBy === 'rating_desc') {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.price - b.price;
    }

    return 0;
  });

  return filtered;
}

/**
 * Kategoriya chiplarini chizish
 */
function renderCategoryStrip() {
  if (!dom.categoryStrip) return;

  const counts = { all: PLACES_DATA.length };
  PLACES_DATA.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  dom.categoryStrip.innerHTML = CATEGORIES.map((cat) => {
    const isActive = state.selectedCategory === cat.id;
    return `
      <button
        type="button"
        class="category-strip__chip ${isActive ? 'category-strip__chip--active' : ''}"
        data-category="${cat.id}"
      >
        <span class="category-strip__emoji">${cat.emoji}</span>
        <span>${cat.label}</span>
        <span class="category-strip__count">${counts[cat.id] || 0}</span>
      </button>
    `;
  }).join('');
}

/**
 * Filter Sheet ichidagi chiplarni (Tumanlar, Presetlar) chizish
 */
function renderFilterSheetOptions() {
  // 1. Tumanlar chiplari
  if (dom.districtChipsContainer) {
    const districts = [...new Set(PLACES_DATA.map((p) => p.district))].sort();
    const allActive = state.selectedDistrict === 'all';
    let html = `
      <button type="button" class="filter-sheet__choice-chip ${allActive ? 'filter-sheet__choice-chip--active' : ''}" data-dist-val="all">
        Barcha tumanlar
      </button>
    `;

    districts.forEach((d) => {
      const isActive = state.selectedDistrict === d;
      html += `
        <button type="button" class="filter-sheet__choice-chip ${isActive ? 'filter-sheet__choice-chip--active' : ''}" data-dist-val="${d}">
          ${d}
        </button>
      `;
    });

    dom.districtChipsContainer.innerHTML = html;
  }

  // 2. Presetlar chiplari
  if (dom.presetChipsContainer) {
    let presetHtml = '';
    TASHKENT_PRESETS.forEach((preset) => {
      const isActive = !state.userCoords.isRealGps && state.activePresetId === preset.id;
      presetHtml += `
        <button type="button" class="filter-sheet__choice-chip ${isActive ? 'filter-sheet__choice-chip--active' : ''}" data-preset-val="${preset.id}">
          ${preset.name}
        </button>
      `;
    });
    dom.presetChipsContainer.innerHTML = presetHtml;
  }
}

/**
 * Asosiy ro'yxat va kartochkalarni chizish
 */
function renderPlacesList() {
  const filteredPlaces = getFilteredAndSortedPlaces();
  const totalCount = filteredPlaces.length;
  const visiblePlaces = filteredPlaces.slice(0, state.visibleCount);

  // Header statusi va sonlar
  if (dom.locationStatusText) {
    dom.locationStatusText.textContent = state.userCoords.label;
  }
  if (dom.activeDistrictBadge) {
    dom.activeDistrictBadge.textContent =
      state.selectedDistrict !== 'all'
        ? `${state.selectedDistrict} t.`
        : state.userCoords.label;
  }
  if (dom.resultCount) {
    dom.resultCount.textContent = `${totalCount} ta joy`;
  }
  if (dom.favCountBadge) {
    const c = state.favorites.size;
    dom.favCountBadge.textContent = c;
    dom.favCountBadge.style.display = c > 0 ? 'flex' : 'none';
  }
  if (dom.favHeaderBtn) {
    dom.favHeaderBtn.classList.toggle('header__icon-btn--active', state.favoritesOnly);
  }

  // Filter tugmasi indikatori (agar maxsus filtr faol bo'lsa)
  const isCustomFilter =
    state.selectedDistrict !== 'all' ||
    state.maxPrice !== 'all' ||
    state.sortBy !== 'price_asc';
  if (dom.filterModalBtn) {
    dom.filterModalBtn.classList.toggle('search-bar__filter-btn--active', isCustomFilter);
  }

  // Bo'sh holat
  if (totalCount === 0) {
    dom.placesGrid.innerHTML = '';
    dom.emptyState.style.display = 'block';
    dom.paginationBar.style.display = 'none';
    if (state.viewMode === 'map') updateLeafletMapMarkers([]);
    return;
  }

  dom.emptyState.style.display = 'none';

  // Apple Cards UI
  dom.placesGrid.innerHTML = visiblePlaces
    .map((place, index) => {
      const isFav = state.favorites.has(place.id);
      const yandexUrl = getYandexMapsUrl(state.userCoords, place);
      const catEmoji =
        {
          osh: '🍛',
          kombo: '🍱',
          fastfood: '🌯',
          somsa: '🥟',
          suyuq: '🍜',
          kechki: '🥘'
        }[place.category] || '🍽️';

      return `
        <article class="place-card" data-place-id="${place.id}">
          <div class="place-card__media">
            <img
              class="place-card__img"
              src="${place.image}"
              alt="${place.dishName}"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'"
            />
            <div class="place-card__overlay-top">
              <span class="place-card__category-badge">
                ${catEmoji} ${place.categoryLabel}
              </span>
              <button
                type="button"
                class="place-card__fav-btn ${isFav ? 'place-card__fav-btn--active' : ''}"
                data-action="toggle-fav"
                data-place-id="${place.id}"
                aria-label="Sevimlilar"
              >
                ${isFav ? '❤️' : '🤍'}
              </button>
            </div>

            <div class="place-card__overlay-bottom">
              <div class="place-card__price-pill">
                <span>${formatPriceUZS(place.price)}</span>
              </div>
              <span class="place-card__dist-pill">
                📍 ${place.distanceText} · ${place.travelTimeText}
              </span>
            </div>
          </div>

          <div class="place-card__body">
            <div class="place-card__title-row">
              <h3 class="place-card__dish-title" title="${place.dishName}">${place.dishName}</h3>
              <span class="place-card__rating">★ ${place.rating}</span>
            </div>

            <div class="place-card__place-name">
              <span>🏪 ${place.name}</span>
            </div>

            <div class="place-card__landmark">
              <span>🧭 ${place.district} t. · ${place.landmark}</span>
            </div>

            <div class="place-card__footer">
              <a
                href="${yandexUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="place-card__action-btn place-card__action-btn--route"
                data-action="open-route"
                data-url="${yandexUrl}"
              >
                🗺️ Yo'nalish
              </a>
              <button
                type="button"
                class="place-card__action-btn place-card__action-btn--detail"
                data-action="open-detail"
                data-place-id="${place.id}"
              >
                Batafsil ▾
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  // Pagination
  if (totalCount > state.visibleCount) {
    dom.paginationBar.style.display = 'flex';
    const remaining = totalCount - state.visibleCount;
    dom.paginationInfo.textContent = `${visiblePlaces.length} / ${totalCount} ta joy`;
    dom.loadMoreBtn.textContent = `Yana ko'rsatish (+${Math.min(PAGE_SIZE, remaining)})`;
  } else {
    dom.paginationBar.style.display = 'none';
  }

  if (state.viewMode === 'map') {
    updateLeafletMapMarkers(filteredPlaces);
  }

  // Telegram MainButton
  if (!state.activePlace) {
    const cheapestNear = [...filteredPlaces].sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99))[0];
    if (cheapestNear) {
      setTelegramMainButton({
        visible: true,
        text: `📍 Eng yaqini: ${cheapestNear.name} (${cheapestNear.distanceText})`,
        color: '#ff6a00',
        onClick: () => openBottomSheet(cheapestNear.id)
      });
    }
  }
}

/**
 * Leaflet Xarita
 */
function updateLeafletMapMarkers(places) {
  if (typeof window.L === 'undefined' || !dom.mapCanvas) return;

  if (!leafletMap) {
    leafletMap = window.L.map(dom.mapCanvas, {
      center: [state.userCoords.lat, state.userCoords.lng],
      zoom: 13,
      zoomControl: true
    });

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(leafletMap);

    leafletMarkersLayer = window.L.layerGroup().addTo(leafletMap);
  }

  setTimeout(() => leafletMap.invalidateSize(), 150);
  leafletMarkersLayer.clearLayers();

  // User Marker
  const userIcon = window.L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#007aff;border:3px solid #fff;box-shadow:0 0 0 6px rgba(0,122,255,0.35);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  window.L.marker([state.userCoords.lat, state.userCoords.lng], { icon: userIcon })
    .bindPopup(`<strong>📍 Sizning nuqtangiz:</strong><br/>${state.userCoords.label}`)
    .addTo(leafletMarkersLayer);

  // Place Pins
  places.slice(0, 100).forEach((place) => {
    const pinIcon = window.L.divIcon({
      className: '',
      html: `<div class="map-price-pin">${Math.round(place.price / 1000)}k</div>`,
      iconSize: [44, 22],
      iconAnchor: [22, 11]
    });

    const marker = window.L.marker([place.lat, place.lng], { icon: pinIcon });
    marker.on('click', () => {
      triggerHaptic('selection');
      openBottomSheet(place.id);
    });
    marker.addTo(leafletMarkersLayer);
  });

  leafletMap.setView([state.userCoords.lat, state.userCoords.lng], 13);
}

/**
 * Bottom Sheet ochish
 */
function openBottomSheet(placeId) {
  const filtered = getFilteredAndSortedPlaces();
  const place =
    filtered.find((p) => p.id === Number(placeId)) ||
    PLACES_DATA.map((p) => {
      const distanceKm = calculateHaversineDistance(
        state.userCoords.lat,
        state.userCoords.lng,
        p.lat,
        p.lng
      );
      return {
        ...p,
        distanceKm,
        distanceText: formatDistance(distanceKm),
        travelTimeText: formatTravelTime(distanceKm)
      };
    }).find((p) => p.id === Number(placeId));

  if (!place) return;

  triggerHaptic('medium');
  state.activePlace = place;
  state.selectedMenuItems = new Set([0]);

  renderBottomSheetContent();
  dom.bottomSheet.classList.add('bottom-sheet--open');
  document.body.classList.add('modal-open');

  const yandexUrl = getYandexMapsUrl(state.userCoords, place);
  setTelegramBackButton({ visible: true, onClick: closeBottomSheet });
  setTelegramMainButton({
    visible: true,
    text: `🗺 Yandex Xarita (${place.distanceText})`,
    color: '#ff6a00',
    onClick: () => openExternalMapLink(yandexUrl)
  });
}

function renderBottomSheetContent() {
  const place = state.activePlace;
  if (!place || !dom.bottomSheetScroll) return;

  const yandexUrl = getYandexMapsUrl(state.userCoords, place);
  const yandexNaviUrl = getYandexNaviUrl(place);
  const googleUrl = getGoogleMapsUrl(state.userCoords, place);
  const cleanPhone = place.phone.replace(/\s+/g, '');

  let totalSelectedBill = 0;
  place.menu.forEach((item, idx) => {
    if (state.selectedMenuItems.has(idx)) {
      totalSelectedBill += item.price;
    }
  });

  const ingredientsHtml = place.ingredients
    .map((ing) => `<span class="bottom-sheet__ingredient-pill">✓ ${ing}</span>`)
    .join('');

  const menuHtml = place.menu
    .map((item, idx) => {
      const isSelected = state.selectedMenuItems.has(idx);
      return `
        <div
          class="bottom-sheet__menu-item ${isSelected ? 'bottom-sheet__menu-item--selected' : ''}"
          data-action="toggle-menu-item"
          data-menu-idx="${idx}"
        >
          <div class="bottom-sheet__menu-left">
            <span class="bottom-sheet__menu-check">✓</span>
            <div>
              <div class="bottom-sheet__menu-name">${item.name}</div>
              <div class="bottom-sheet__menu-portion">Porsiya: ${item.portion}</div>
            </div>
          </div>
          <span class="bottom-sheet__menu-price">${formatPriceUZS(item.price)}</span>
        </div>
      `;
    })
    .join('');

  dom.bottomSheetScroll.innerHTML = `
    <div class="bottom-sheet__hero">
      <img
        class="bottom-sheet__hero-img"
        src="${place.image}"
        alt="${place.dishName}"
        onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'"
      />
      <button
        type="button"
        class="bottom-sheet__close-btn"
        data-action="close-modal"
        aria-label="Yopish"
      >✕</button>
      <div class="bottom-sheet__hero-badges">
        <span class="bottom-sheet__hero-price">${formatPriceUZS(place.price)}</span>
        <span class="bottom-sheet__hero-distance">
          📍 ${place.distanceText} (${place.travelTimeText})
        </span>
      </div>
    </div>

    <div class="bottom-sheet__header">
      <h2 class="bottom-sheet__dish-name">${place.dishName}</h2>
      <div class="bottom-sheet__place-title">
        <span>🏪 ${place.name}</span>
        <span>·</span>
        <span>⭐ ${place.rating} (${place.reviewsCount} ta fikr)</span>
      </div>
    </div>

    <div class="bottom-sheet__info-grid">
      <div class="bottom-sheet__info-box bottom-sheet__info-box--full">
        <span class="bottom-sheet__info-icon">📍</span>
        <div>
          <div class="bottom-sheet__info-label">Aniq manzil va mo'ljal</div>
          <div class="bottom-sheet__info-val">${place.address} (${place.landmark})</div>
        </div>
      </div>

      <div class="bottom-sheet__info-box">
        <span class="bottom-sheet__info-icon">🕒</span>
        <div>
          <div class="bottom-sheet__info-label">Ish vaqti</div>
          <div class="bottom-sheet__info-val">${place.workingHours}</div>
        </div>
      </div>

      <div class="bottom-sheet__info-box">
        <span class="bottom-sheet__info-icon">📞</span>
        <div>
          <div class="bottom-sheet__info-label">Telefon</div>
          <div class="bottom-sheet__info-val">${place.phone}</div>
        </div>
      </div>
    </div>

    <div class="bottom-sheet__section">
      <div class="bottom-sheet__section-title">
        <span>🥗 Tarkibi (${place.portion})</span>
      </div>
      <div class="bottom-sheet__ingredients">
        ${ingredientsHtml}
      </div>
    </div>

    <div class="bottom-sheet__section">
      <div class="bottom-sheet__section-title">
        <span>📋 Boshqa arzon menyulari</span>
      </div>
      <div class="bottom-sheet__menu-list">
        ${menuHtml}
      </div>
      <div class="bottom-sheet__calc-summary">
        <span>🧮 Tanlangan tushlik hisobi:</span>
        <strong>${formatPriceUZS(totalSelectedBill)}</strong>
      </div>
    </div>

    <div class="bottom-sheet__actions">
      <a
        href="${yandexUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="bottom-sheet__action-btn bottom-sheet__action-btn--yandex"
        data-action="open-route"
        data-url="${yandexUrl}"
      >
        🧭 Yandex Maps
      </a>
      <a
        href="${googleUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="bottom-sheet__action-btn bottom-sheet__action-btn--google"
        data-action="open-route"
        data-url="${googleUrl}"
      >
        🗺️ Google Maps
      </a>
      <a
        href="${yandexNaviUrl}"
        class="bottom-sheet__action-btn bottom-sheet__action-btn--call"
      >
        🚗 Yandex Navigator
      </a>
      <a
        href="tel:${cleanPhone}"
        class="bottom-sheet__action-btn bottom-sheet__action-btn--call"
      >
        📞 Qo'ng'iroq: ${place.phone}
      </a>
    </div>
  `;
}

function closeBottomSheet() {
  if (!state.activePlace) return;
  triggerHaptic('light');
  state.activePlace = null;

  dom.bottomSheet.classList.remove('bottom-sheet--open');
  document.body.classList.remove('modal-open');

  setTelegramBackButton({ visible: false });
  renderPlacesList();
}

/**
 * Filter Sheet ochish / yopish
 */
function openFilterSheet() {
  triggerHaptic('medium');
  renderFilterSheetOptions();
  dom.filterSheet.classList.add('filter-sheet--open');
  document.body.classList.add('modal-open');
}

function closeFilterSheet() {
  triggerHaptic('light');
  dom.filterSheet.classList.remove('filter-sheet--open');
  if (!state.activePlace) {
    document.body.classList.remove('modal-open');
  }
}

/**
 * GPS orqali joylashuvni aniqlash
 */
async function handleDetectUserLocation() {
  triggerHaptic('medium');
  if (dom.locateBtn) {
    dom.locateBtn.disabled = true;
    dom.locateBtn.innerHTML = '⏳';
  }

  try {
    const coords = await getUserLocation();
    state.userCoords = {
      lat: coords.lat,
      lng: coords.lng,
      label: `GPS joylashuvingiz`,
      isRealGps: true
    };
    state.sortBy = 'distance_asc';
    state.visibleCount = PAGE_SIZE;

    renderPlacesList();
    triggerHaptic('success');
    showToast("📍 Joylashuvingiz aniqlandi!");
  } catch (err) {
    triggerHaptic('warning');
    showToast(`⚠️ ${err.message}`);
  } finally {
    if (dom.locateBtn) {
      dom.locateBtn.disabled = false;
      dom.locateBtn.innerHTML = '🎯 GPS';
    }
  }
}

/**
 * Ro'yxat / Xarita ko'rinishi
 */
function setViewMode(mode) {
  state.viewMode = mode;

  if (mode === 'map') {
    dom.placesGrid.style.display = 'none';
    dom.paginationBar.style.display = 'none';
    dom.mapView.classList.add('map-view--active');
    updateLeafletMapMarkers(getFilteredAndSortedPlaces());
  } else {
    dom.mapView.classList.remove('map-view--active');
    dom.placesGrid.style.display = 'grid';
    renderPlacesList();
  }

  updateBottomNavActiveState();
}

function updateBottomNavActiveState() {
  if (!dom.bottomNavItems) return;

  dom.bottomNavItems.forEach((btn) => {
    const tab = btn.dataset.navTab;
    let isActive = false;

    if (tab === 'home' && state.viewMode === 'list' && !state.nearMeActive && !state.favoritesOnly) {
      isActive = true;
    } else if (tab === 'near' && state.nearMeActive && state.viewMode === 'list') {
      isActive = true;
    } else if (tab === 'map' && state.viewMode === 'map') {
      isActive = true;
    } else if (tab === 'favorites' && state.favoritesOnly) {
      isActive = true;
    }

    btn.classList.toggle('bottom-nav__item--active', isActive);
  });
}

function resetAllFilters() {
  triggerHaptic('light');
  state.searchQuery = '';
  state.selectedCategory = 'all';
  state.selectedDistrict = 'all';
  state.maxPrice = 'all';
  state.sortBy = 'price_asc';
  state.favoritesOnly = false;
  state.nearMeActive = false;
  state.visibleCount = PAGE_SIZE;

  if (dom.searchInput) dom.searchInput.value = '';
  if (dom.searchClearBtn) dom.searchClearBtn.classList.remove('search-bar__clear--visible');

  renderCategoryStrip();
  renderFilterSheetOptions();
  renderPlacesList();
  updateBottomNavActiveState();
  showToast('🔄 Filtrlar tozalandi');
}

/**
 * PWA O'rnatish
 */
function initPwaInstaller() {
  let deferredPrompt = null;
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    closePwaModal();
    showToast("🎉 «Arzon Ovqat» ilovasi telefoningizga o'rnatildi!");
  });

  const installAppBtn = document.getElementById('installAppBtn');
  const pwaModal = document.getElementById('pwaModal');
  const pwaModalBackdrop = document.getElementById('pwaModalBackdrop');
  const pwaModalCloseBtn = document.getElementById('pwaModalCloseBtn');
  const pwaDismissBtn = document.getElementById('pwaDismissBtn');
  const pwaTabIos = document.getElementById('pwaTabIos');
  const pwaTabAndroid = document.getElementById('pwaTabAndroid');
  const pwaIosBody = document.getElementById('pwaIosBody');
  const pwaAndroidBody = document.getElementById('pwaAndroidBody');
  const pwaAndroidInstallBtn = document.getElementById('pwaAndroidInstallBtn');

  function openPwaModal() {
    triggerHaptic('medium');
    pwaModal.classList.add('pwa-modal--open');
    document.body.classList.add('modal-open');

    if (isIos) {
      showIosTab();
    } else {
      showAndroidTab();
    }
  }

  function closePwaModal() {
    triggerHaptic('light');
    pwaModal.classList.remove('pwa-modal--open');
    if (!state.activePlace && !dom.filterSheet.classList.contains('filter-sheet--open')) {
      document.body.classList.remove('modal-open');
    }
  }

  function showIosTab() {
    pwaTabIos.classList.add('pwa-modal__tab-btn--active');
    pwaTabAndroid.classList.remove('pwa-modal__tab-btn--active');
    pwaIosBody.style.display = 'flex';
    pwaAndroidBody.style.display = 'none';
  }

  function showAndroidTab() {
    pwaTabAndroid.classList.add('pwa-modal__tab-btn--active');
    pwaTabIos.classList.remove('pwa-modal__tab-btn--active');
    pwaAndroidBody.style.display = 'flex';
    pwaIosBody.style.display = 'none';
  }

  if (installAppBtn) installAppBtn.addEventListener('click', openPwaModal);
  if (pwaModalBackdrop) pwaModalBackdrop.addEventListener('click', closePwaModal);
  if (pwaModalCloseBtn) pwaModalCloseBtn.addEventListener('click', closePwaModal);
  if (pwaDismissBtn) pwaDismissBtn.addEventListener('click', closePwaModal);

  if (pwaTabIos) pwaTabIos.addEventListener('click', showIosTab);
  if (pwaTabAndroid) pwaTabAndroid.addEventListener('click', showAndroidTab);

  if (pwaAndroidInstallBtn) {
    pwaAndroidInstallBtn.addEventListener('click', async () => {
      triggerHaptic('medium');
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast("📲 O'rnatilmoqda...");
        }
        deferredPrompt = null;
      } else {
        showToast("💡 Chrome menyusi (⋮) -> «Ilovani o'rnatish»ni bosing");
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pwaModal.classList.contains('pwa-modal--open')) {
      closePwaModal();
    }
  });
}

/**
 * Asosiy ishga tushirish
 */
function initApp() {
  dom.searchInput = document.getElementById('searchInput');
  dom.searchClearBtn = document.getElementById('searchClearBtn');
  dom.filterModalBtn = document.getElementById('filterModalBtn');
  dom.categoryStrip = document.getElementById('categoryStrip');
  dom.locationPill = document.getElementById('locationPill');
  dom.locationStatusText = document.getElementById('locationStatusText');
  dom.activeDistrictBadge = document.getElementById('activeDistrictBadge');
  dom.resultCount = document.getElementById('resultCount');
  dom.locateBtn = document.getElementById('locateBtn');
  dom.placesGrid = document.getElementById('placesGrid');
  dom.mapView = document.getElementById('mapView');
  dom.mapCanvas = document.getElementById('mapCanvas');
  dom.emptyState = document.getElementById('emptyState');
  dom.resetFiltersBtn = document.getElementById('resetFiltersBtn');
  dom.paginationBar = document.getElementById('paginationBar');
  dom.paginationInfo = document.getElementById('paginationInfo');
  dom.loadMoreBtn = document.getElementById('loadMoreBtn');
  dom.bottomSheet = document.getElementById('bottomSheet');
  dom.bottomSheetBackdrop = document.getElementById('bottomSheetBackdrop');
  dom.bottomSheetScroll = document.getElementById('bottomSheetScroll');
  dom.filterSheet = document.getElementById('filterSheet');
  dom.filterSheetBackdrop = document.getElementById('filterSheetBackdrop');
  dom.filterResetLink = document.getElementById('filterResetLink');
  dom.applyFiltersBtn = document.getElementById('applyFiltersBtn');
  dom.sortChipsContainer = document.getElementById('sortChipsContainer');
  dom.priceChipsContainer = document.getElementById('priceChipsContainer');
  dom.districtChipsContainer = document.getElementById('districtChipsContainer');
  dom.presetChipsContainer = document.getElementById('presetChipsContainer');
  dom.themeBtn = document.getElementById('themeBtn');
  dom.favHeaderBtn = document.getElementById('favHeaderBtn');
  dom.favCountBadge = document.getElementById('favCountBadge');
  dom.toast = document.getElementById('toast');
  dom.bottomNavItems = document.querySelectorAll('[data-nav-tab]');

  applyTheme(state.theme);
  initTelegramApp((tgScheme) => applyTheme(tgScheme));

  renderCategoryStrip();
  renderFilterSheetOptions();
  renderPlacesList();
  updateBottomNavActiveState();
  initPwaInstaller();

  // Search input
  dom.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    state.visibleCount = PAGE_SIZE;
    dom.searchClearBtn.classList.toggle('search-bar__clear--visible', state.searchQuery.length > 0);
    renderPlacesList();
  });

  dom.searchClearBtn.addEventListener('click', () => {
    triggerHaptic('light');
    state.searchQuery = '';
    dom.searchInput.value = '';
    dom.searchClearBtn.classList.remove('search-bar__clear--visible');
    renderPlacesList();
    dom.searchInput.focus();
  });

  // Filter Sheet button
  dom.filterModalBtn.addEventListener('click', openFilterSheet);
  dom.locationPill.addEventListener('click', openFilterSheet);
  dom.filterSheetBackdrop.addEventListener('click', closeFilterSheet);
  dom.applyFiltersBtn.addEventListener('click', closeFilterSheet);
  dom.filterResetLink.addEventListener('click', () => {
    resetAllFilters();
    closeFilterSheet();
  });

  // Filter Sheet interactions
  dom.sortChipsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sort-val]');
    if (!btn) return;
    triggerHaptic('selection');
    state.sortBy = btn.dataset.sortVal;
    dom.sortChipsContainer.querySelectorAll('.filter-sheet__choice-chip').forEach((c) => {
      c.classList.toggle('filter-sheet__choice-chip--active', c === btn);
    });
    renderPlacesList();
  });

  dom.priceChipsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-price-val]');
    if (!btn) return;
    triggerHaptic('selection');
    state.maxPrice = btn.dataset.priceVal;
    dom.priceChipsContainer.querySelectorAll('.filter-sheet__choice-chip').forEach((c) => {
      c.classList.toggle('filter-sheet__choice-chip--active', c === btn);
    });
    renderPlacesList();
  });

  dom.districtChipsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dist-val]');
    if (!btn) return;
    triggerHaptic('selection');
    state.selectedDistrict = btn.dataset.distVal;
    dom.districtChipsContainer.querySelectorAll('.filter-sheet__choice-chip').forEach((c) => {
      c.classList.toggle('filter-sheet__choice-chip--active', c === btn);
    });
    renderPlacesList();
  });

  dom.presetChipsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-preset-val]');
    if (!btn) return;
    triggerHaptic('selection');
    const preset = TASHKENT_PRESETS.find((p) => p.id === btn.dataset.presetVal);
    if (!preset) return;
    state.activePresetId = preset.id;
    state.userCoords = {
      lat: preset.lat,
      lng: preset.lng,
      label: preset.name.replace(/^[^\s]+\s+/, ''),
      isRealGps: false
    };
    state.sortBy = 'distance_asc';
    dom.presetChipsContainer.querySelectorAll('.filter-sheet__choice-chip').forEach((c) => {
      c.classList.toggle('filter-sheet__choice-chip--active', c === btn);
    });
    renderPlacesList();
    showToast(`📍 ${state.userCoords.label}`);
  });

  // Categories
  dom.categoryStrip.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-category]');
    if (!chip) return;
    triggerHaptic('selection');
    state.selectedCategory = chip.dataset.category;
    state.visibleCount = PAGE_SIZE;
    renderCategoryStrip();
    renderPlacesList();
  });

  // GPS Locate
  dom.locateBtn.addEventListener('click', handleDetectUserLocation);

  // Places Grid Click (Event Delegation)
  dom.placesGrid.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-action="toggle-fav"]');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.placeId);
      triggerHaptic('light');
      if (state.favorites.has(id)) {
        state.favorites.delete(id);
        showToast("💔 O'chirildi");
      } else {
        state.favorites.add(id);
        showToast("❤️ Saqlandi");
      }
      saveFavorites();
      renderPlacesList();
      return;
    }

    const routeBtn = e.target.closest('[data-action="open-route"]');
    if (routeBtn) {
      e.preventDefault();
      e.stopPropagation();
      openExternalMapLink(routeBtn.dataset.url);
      return;
    }

    const detailBtn = e.target.closest('[data-action="open-detail"]');
    if (detailBtn) {
      openBottomSheet(Number(detailBtn.dataset.placeId));
      return;
    }

    const card = e.target.closest('.place-card');
    if (card && !e.target.closest('a, button')) {
      openBottomSheet(Number(card.dataset.placeId));
    }
  });

  dom.loadMoreBtn.addEventListener('click', () => {
    triggerHaptic('light');
    state.visibleCount += PAGE_SIZE;
    renderPlacesList();
  });

  dom.resetFiltersBtn.addEventListener('click', resetAllFilters);

  dom.themeBtn.addEventListener('click', () => {
    triggerHaptic('light');
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  dom.favHeaderBtn.addEventListener('click', () => {
    triggerHaptic('selection');
    state.favoritesOnly = !state.favoritesOnly;
    state.visibleCount = PAGE_SIZE;
    renderPlacesList();
    updateBottomNavActiveState();
    showToast(
      state.favoritesOnly ? `❤️ Saqlangan joylar (${state.favorites.size})` : "🍽️ Barcha joylar"
    );
  });

  // Bottom Sheet Modal
  dom.bottomSheetBackdrop.addEventListener('click', closeBottomSheet);
  dom.bottomSheetScroll.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="close-modal"]')) {
      closeBottomSheet();
      return;
    }

    const routeLink = e.target.closest('[data-action="open-route"]');
    if (routeLink) {
      e.preventDefault();
      openExternalMapLink(routeLink.dataset.url);
      return;
    }

    const menuItem = e.target.closest('[data-action="toggle-menu-item"]');
    if (menuItem) {
      triggerHaptic('selection');
      const idx = Number(menuItem.dataset.menuIdx);
      if (state.selectedMenuItems.has(idx)) {
        state.selectedMenuItems.delete(idx);
      } else {
        state.selectedMenuItems.add(idx);
      }
      renderBottomSheetContent();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.activePlace) closeBottomSheet();
      else if (dom.filterSheet.classList.contains('filter-sheet--open')) closeFilterSheet();
    }
  });

  // Bottom Navigation Bar
  dom.bottomNavItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.navTab;
      triggerHaptic('selection');

      if (tab === 'home') {
        state.favoritesOnly = false;
        state.nearMeActive = false;
        setViewMode('list');
      } else if (tab === 'near') {
        state.favoritesOnly = false;
        state.nearMeActive = true;
        state.sortBy = 'distance_asc';
        setViewMode('list');
        showToast('📍 Sizga eng yaqin joylar');
      } else if (tab === 'map') {
        state.favoritesOnly = false;
        setViewMode('map');
      } else if (tab === 'favorites') {
        state.favoritesOnly = true;
        setViewMode('list');
      }

      updateBottomNavActiveState();
    });
  });
}

document.addEventListener('DOMContentLoaded', initApp);
