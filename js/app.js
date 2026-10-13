// ==========================================================================
// js/app.js — Main Application Controller for "Arzon Ovqat Toshkent" TMA
// Features: Search, 7 Category Filters, Price & Distance Sorting, Geolocation
//           Haversine Distance, Interactive Map, Bottom Sheet Modal & Telegram SDK
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

// Ilova holati (Application State)
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
    label: TASHKENT_PRESETS[0].name,
    isRealGps: false
  },
  favorites: loadFavorites(),
  visibleCount: PAGE_SIZE,
  activePlace: null,
  selectedMenuItems: new Set([0]), // Bottom sheet kalkulyatori uchun
  theme: localStorage.getItem(THEME_STORAGE_KEY) || 'dark'
};

// Leaflet map instance
let leafletMap = null;
let leafletMarkersLayer = null;
let userMarker = null;
let toastTimer = null;

// DOM Elements Cache
const dom = {};

/**
 * So'm formatlash (masalan: 24000 -> "24 000 so'm")
 * @param {number} amount
 * @returns {string}
 */
function formatPriceUZS(amount) {
  return `${Number(amount).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}

/**
 * LocalStorage dan sevimlilarni yuklash
 */
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (_) {
    return new Set();
  }
}

/**
 * LocalStorage ga sevimlilarni saqlash
 */
function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...state.favorites]));
  } catch (_) {
    // Ignore storage quota errors
  }
}

/**
 * Toast xabarnoma chiqarish
 * @param {string} message
 */
function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add('toast--visible');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('toast--visible');
  }, 2800);
}

/**
 * Mavzuni (Dark / Light) o'rnatish
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem(THEME_STORAGE_KEY, state.theme);

  if (dom.themeBtn) {
    dom.themeBtn.innerHTML = state.theme === 'dark' ? '☀️' : '🌙';
    dom.themeBtn.setAttribute(
      'title',
      state.theme === 'dark' ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"
    );
  }
}

/**
 * Barcha lokatsiyalarga foydalanuvchigacha bo'lgan Haversine masofasini hisoblash
 * va faol filtrlar / saralash qoidalarini qo'llash
 */
function getFilteredAndSortedPlaces() {
  const query = state.searchQuery.trim().toLowerCase();

  // 1. Har bir nuqtaga masofani hisoblash
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

  // 2. Filtrlash
  const filtered = enriched.filter((place) => {
    // Sevimlilar filtri
    if (state.favoritesOnly && !state.favorites.has(place.id)) {
      return false;
    }

    // Kategoriya filtri
    if (state.selectedCategory !== 'all' && place.category !== state.selectedCategory) {
      return false;
    }

    // Tuman filtri
    if (state.selectedDistrict !== 'all' && place.district !== state.selectedDistrict) {
      return false;
    }

    // Maksimal narx chegarasi
    if (state.maxPrice !== 'all' && place.price > Number(state.maxPrice)) {
      return false;
    }

    // "Menga yaqin" (3.5 km radius ichidagilar, agar nearMeActive yoqilgan bo'lsa)
    if (state.nearMeActive && place.distanceKm !== null && place.distanceKm > 3.5) {
      return false;
    }

    // Qidiruv matni (taom nomi, joy nomi, tuman, mo'ljal yoki tarkibi bo'yicha)
    if (query) {
      const haystack = `${place.dishName} ${place.name} ${place.district} ${place.landmark} ${place.categoryLabel} ${place.ingredients.join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // 3. Saralash (Narx, Masofa yoki Reyting bo'yicha)
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

    if (state.sortBy === 'price_desc') {
      return b.price - a.price;
    }

    return 0;
  });

  return filtered;
}

/**
 * Kategoriya chiplarini va har bir toifadagi joylar sonini chizish
 */
function renderCategoryStrip() {
  if (!dom.categoryStrip) return;

  // Har bir kategoriya uchun umumiy sonni hisoblash
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
 * Toshkentning tezkor hudud presetlarini (Talabalar shaharchasi, TATU, Chilonzor va h.k.) chizish
 */
function renderLocationPresets() {
  if (!dom.presetsContainer) return;

  const presetsHtml = TASHKENT_PRESETS.map((preset) => {
    const isActive = !state.userCoords.isRealGps && state.activePresetId === preset.id;
    return `
      <button
        type="button"
        class="near-banner__preset-btn ${isActive ? 'near-banner__preset-btn--active' : ''}"
        data-preset-id="${preset.id}"
      >
        ${preset.name}
      </button>
    `;
  }).join('');

  dom.presetsContainer.innerHTML = `
    <span class="near-banner__preset-label">⚡ Tezkor nuqtalar:</span>
    ${presetsHtml}
  `;
}

/**
 * Tumanlar select ro'yxatini to'ldirish
 */
function populateDistrictSelect() {
  if (!dom.districtSelect) return;

  const districts = [...new Set(PLACES_DATA.map((p) => p.district))].sort();
  const optionsHtml = [
    `<option value="all">📍 Barcha tumanlar (${PLACES_DATA.length})</option>`,
    ...districts.map((d) => {
      const count = PLACES_DATA.filter((p) => p.district === d).length;
      return `<option value="${d}">${d} tumani (${count})</option>`;
    })
  ].join('');

  dom.districtSelect.innerHTML = optionsHtml;
}

/**
 * Joylashuv statusi va Header ko'rsatkichlarini yangilash
 */
function updateHeaderAndLocationUI() {
  if (dom.locationStatusText) {
    dom.locationStatusText.textContent = state.userCoords.label;
  }

  if (dom.coordsTag) {
    dom.coordsTag.textContent = `${state.userCoords.lat.toFixed(4)}, ${state.userCoords.lng.toFixed(4)}`;
  }

  if (dom.favCountBadge) {
    const count = state.favorites.size;
    dom.favCountBadge.textContent = count;
    dom.favCountBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  if (dom.favHeaderBtn) {
    dom.favHeaderBtn.classList.toggle('header__icon-btn--active', state.favoritesOnly);
  }

  if (dom.nearQuickBtn) {
    dom.nearQuickBtn.classList.toggle('search-bar__near-btn--active', state.nearMeActive);
  }
}

/**
 * Taom va Lokatsiya Kartochkalarini (Card UI) chizish
 */
function renderPlacesList() {
  const filteredPlaces = getFilteredAndSortedPlaces();
  const totalCount = filteredPlaces.length;
  const visiblePlaces = filteredPlaces.slice(0, state.visibleCount);

  updateHeaderAndLocationUI();

  // Natijalar sonini yangilash
  if (dom.resultCount) {
    const nearBadge = state.nearMeActive ? ` (3.5 km radiusda)` : '';
    dom.resultCount.innerHTML = `Topildi: <strong>${totalCount} ta</strong> hamyonbop joy${nearBadge}`;
  }

  // Agar hech narsa topilmasa Empty State ko'rsatish
  if (totalCount === 0) {
    dom.placesGrid.innerHTML = '';
    dom.emptyState.style.display = 'block';
    dom.paginationBar.style.display = 'none';
    if (state.viewMode === 'map') {
      updateLeafletMapMarkers([]);
    }
    return;
  }

  dom.emptyState.style.display = 'none';

  // Kartochkalarni generatsiya qilish
  dom.placesGrid.innerHTML = visiblePlaces
    .map((place, index) => {
      const isFav = state.favorites.has(place.id);
      const isVeryNear = place.distanceKm !== null && place.distanceKm <= 1.2;
      const yandexUrl = getYandexMapsUrl(state.userCoords, place);
      const delayMs = Math.min((index % PAGE_SIZE) * 25, 300);

      const categoryEmojiMap = {
        osh: '🍛',
        kombo: '🍱',
        fastfood: '🌯',
        somsa: '🥟',
        suyuq: '🍜',
        kechki: '🥘'
      };
      const catEmoji = categoryEmojiMap[place.category] || '🍽️';

      return `
        <article class="place-card" style="animation-delay: ${delayMs}ms" data-place-id="${place.id}">
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
                aria-label="Sevimlilarga qo'shish"
              >
                ${isFav ? '❤️' : '🤍'}
              </button>
            </div>

            <div class="place-card__overlay-bottom">
              <div class="place-card__price-badge">
                <small>Porsiya narxi</small>
                <span>${formatPriceUZS(place.price)}</span>
              </div>
              <span class="place-card__distance-badge ${isVeryNear ? 'place-card__distance-badge--near' : ''}">
                📍 ${place.distanceText} · ${place.travelTimeText}
              </span>
            </div>
          </div>

          <div class="place-card__body">
            <div class="place-card__header-row">
              <h3 class="place-card__dish-title" title="${place.dishName}">${place.dishName}</h3>
              <span class="place-card__rating">★ ${place.rating}</span>
            </div>

            <div class="place-card__place-name">
              <span>🏪 ${place.name}</span>
            </div>

            <p class="place-card__address">
              <span>🧭</span>
              <span><strong>${place.district} t.</strong>, ${place.landmark}</span>
            </p>

            <div class="place-card__tags">
              <span class="place-card__tag place-card__tag--student">🎓 ${place.studentPerks[0]}</span>
              <span class="place-card__tag">⚖️ ${place.portion}</span>
              <span class="place-card__tag">🕒 ${place.workingHours}</span>
            </div>

            <div class="place-card__footer">
              <a
                href="${yandexUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="place-card__btn place-card__btn--route"
                data-action="open-route"
                data-url="${yandexUrl}"
              >
                🗺️ Yo'nalish
              </a>
              <button
                type="button"
                class="place-card__btn place-card__btn--detail"
                data-action="open-detail"
                data-place-id="${place.id}"
              >
                📋 Batafsil
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  // Pagination ("Yana ko'rsatish" tugmasi)
  if (totalCount > state.visibleCount) {
    dom.paginationBar.style.display = 'flex';
    const remaining = totalCount - state.visibleCount;
    dom.paginationInfo.textContent = `${visiblePlaces.length} / ${totalCount} ta joy ko'rsatilmoqda`;
    dom.loadMoreBtn.textContent = `Yana ko'rsatish (+${Math.min(PAGE_SIZE, remaining)} ta)`;
  } else {
    dom.paginationBar.style.display = 'none';
  }

  // Agar xarita rejimi yoqilgan bo'lsa, xaritadagi pinlarni ham yangilaymiz
  if (state.viewMode === 'map') {
    updateLeafletMapMarkers(filteredPlaces);
  }

  // Telegram MainButton ni yangilash (agar modal yopiq bo'lsa)
  if (!state.activePlace) {
    const cheapestNear = [...filteredPlaces].sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99))[0];
    if (cheapestNear) {
      setTelegramMainButton({
        visible: true,
        text: `📍 Eng yaqini: ${cheapestNear.name} (${cheapestNear.distanceText})`,
        color: '#10b981',
        onClick: () => openBottomSheet(cheapestNear.id)
      });
    }
  }
}

/**
 * Interactive Leaflet Map (Xarita ko'rinishi) ni ishga tushirish va yangilash
 * @param {Array} places
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
      attribution: '&copy; OpenStreetMap & CartoDB',
      maxZoom: 19
    }).addTo(leafletMap);

    leafletMarkersLayer = window.L.layerGroup().addTo(leafletMap);
  }

  setTimeout(() => {
    leafletMap.invalidateSize();
  }, 120);

  leafletMarkersLayer.clearLayers();

  // Foydalanuvchi turgan joy markeri
  const userIcon = window.L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 8px rgba(59,130,246,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  userMarker = window.L.marker([state.userCoords.lat, state.userCoords.lng], { icon: userIcon })
    .bindPopup(`<strong>📍 Sizning nuqtangiz:</strong><br/>${state.userCoords.label}`)
    .addTo(leafletMarkersLayer);

  // Ovqatlanish joylari pinlari (narx yorlig'i bilan)
  places.slice(0, 120).forEach((place) => {
    const shortPrice = `${Math.round(place.price / 1000)}k so'm`;
    const pinIcon = window.L.divIcon({
      className: '',
      html: `<div class="map-price-pin">${shortPrice}</div>`,
      iconSize: [64, 24],
      iconAnchor: [32, 12]
    });

    const marker = window.L.marker([place.lat, place.lng], { icon: pinIcon });
    marker.on('click', () => {
      triggerHaptic('selection');
      openBottomSheet(place.id);
    });
    marker.addTo(leafletMarkersLayer);
  });

  leafletMap.setView([state.userCoords.lat, state.userCoords.lng], state.nearMeActive ? 14 : 12);
}

/**
 * "Batafsil" Bottom Sheet Modal oynasini ochish
 * @param {number} placeId
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
  state.selectedMenuItems = new Set([0]); // Birinchi asosiy taom tanlangan holda

  renderBottomSheetContent();

  dom.bottomSheet.classList.add('bottom-sheet--open');
  document.body.classList.add('modal-open');

  // Telegram BackButton va MainButton ni modal uchun sozlash
  const yandexUrl = getYandexMapsUrl(state.userCoords, place);
  setTelegramBackButton({
    visible: true,
    onClick: closeBottomSheet
  });

  setTelegramMainButton({
    visible: true,
    text: `🗺 Yandex Xaritada yo'nalish (${place.distanceText})`,
    color: '#ff6b2c',
    onClick: () => openExternalMapLink(yandexUrl)
  });
}

/**
 * Bottom Sheet Modal ichidagi ma'lumotlarni va menyu kalkulyatorini chizish
 */
function renderBottomSheetContent() {
  const place = state.activePlace;
  if (!place || !dom.bottomSheetScroll) return;

  const yandexUrl = getYandexMapsUrl(state.userCoords, place);
  const yandexNaviUrl = getYandexNaviUrl(place);
  const googleUrl = getGoogleMapsUrl(state.userCoords, place);
  const cleanPhone = place.phone.replace(/\s+/g, '');

  // Tanlangan menyu taomlari bo'yicha umumiy hisob
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
      >
        ✕
      </button>
      <div class="bottom-sheet__hero-badges">
        <span class="bottom-sheet__hero-price">${formatPriceUZS(place.price)}</span>
        <span class="bottom-sheet__hero-distance">
          📍 Sizdan ${place.distanceText} (${place.travelTimeText})
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
          <div class="bottom-sheet__info-val">${place.address} (Mo'ljal: ${place.landmark})</div>
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
          <div class="bottom-sheet__info-label">Telefon raqam</div>
          <div class="bottom-sheet__info-val">${place.phone}</div>
        </div>
      </div>
    </div>

    <div class="bottom-sheet__section">
      <div class="bottom-sheet__section-title">
        <span>🥗 Taom tarkibi (${place.portion})</span>
      </div>
      <div class="bottom-sheet__ingredients">
        ${ingredientsHtml}
      </div>
    </div>

    <div class="bottom-sheet__section">
      <div class="bottom-sheet__section-title">
        <span>📋 Boshqa arzon menyulari</span>
        <small style="text-transform:none;font-weight:600;">(Tanlab hisoblang 👇)</small>
      </div>
      <div class="bottom-sheet__menu-list">
        ${menuHtml}
      </div>
      <div class="bottom-sheet__calc-summary">
        <span>🧮 Tanlangan tushlik hisobi (${state.selectedMenuItems.size} ta):</span>
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
        🚗 Yandex Navigator ilovasida ochish
      </a>
      <a
        href="tel:${cleanPhone}"
        class="bottom-sheet__action-btn bottom-sheet__action-btn--call"
      >
        📞 Qo'ng'iroq qilish: ${place.phone}
      </a>
    </div>
  `;
}

/**
 * Bottom Sheet Modal oynasini yopish
 */
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
 * Foydalanuvchi real GPS joylashuvini aniqlash va masofa bo'yicha saralash
 */
async function handleDetectUserLocation() {
  triggerHaptic('medium');
  if (dom.locateBtn) {
    dom.locateBtn.disabled = true;
    dom.locateBtn.innerHTML = '⏳ Aniqlanmoqda...';
  }

  try {
    const coords = await getUserLocation();

    // Agar foydalanuvchi Toshkentdan juda uzoqda bo'lsa ham (masalan boshqa viloyat/davlatdan test qilsa)
    // haqiqiy koordinatasini olamiz va ogohlantiramiz
    const distFromTashkentCenter = calculateHaversineDistance(
      DEFAULT_TASHKENT_COORDS.lat,
      DEFAULT_TASHKENT_COORDS.lng,
      coords.lat,
      coords.lng
    );

    state.userCoords = {
      lat: coords.lat,
      lng: coords.lng,
      label:
        distFromTashkentCenter > 45
          ? `GPS aniqlandi (Toshkentdan ${distFromTashkentCenter.toFixed(0)} km)`
          : `Mening GPS joylashuvim (±${coords.accuracy}m)`,
      isRealGps: true
    };

    state.sortBy = 'distance_asc';
    if (dom.sortSelect) dom.sortSelect.value = 'distance_asc';

    // Agar foydalanuvchi Toshkent ichida bo'lsa 3.5km filtrni yoqamiz
    state.nearMeActive = distFromTashkentCenter <= 30;
    state.visibleCount = PAGE_SIZE;

    renderLocationPresets();
    renderPlacesList();
    triggerHaptic('success');
    showToast("📍 GPS joylashuvingiz aniqlandi! Eng yaqin joylar saralandi.");
  } catch (err) {
    triggerHaptic('warning');
    showToast(`⚠️ ${err.message}`);
  } finally {
    if (dom.locateBtn) {
      dom.locateBtn.disabled = false;
      dom.locateBtn.innerHTML = '📍 GPS orqali aniqlash';
    }
  }
}

/**
 * Ro'yxat va Xarita rejimlari o'rtasida almashish
 * @param {'list'|'map'} mode
 */
function setViewMode(mode) {
  triggerHaptic('selection');
  state.viewMode = mode;

  dom.viewListBtn.classList.toggle('controls-bar__view-btn--active', mode === 'list');
  dom.viewMapBtn.classList.toggle('controls-bar__view-btn--active', mode === 'map');

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

/**
 * Pastki navigatsiya (Bottom Nav) tugmalari holatini yangilash
 */
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

/**
 * Barcha filtrlarni dastlabki holatga qaytarish
 */
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
  if (dom.districtSelect) dom.districtSelect.value = 'all';
  if (dom.priceCapSelect) dom.priceCapSelect.value = 'all';
  if (dom.sortSelect) dom.sortSelect.value = 'price_asc';

  renderCategoryStrip();
  renderPlacesList();
  updateBottomNavActiveState();
  showToast('🔄 Barcha filtrlar tozalandi');
}

/**
 * DOM elementlarni bog'lash va Event Listener larni o'rnatish
 */
function initApp() {
  // DOM references
  dom.searchInput = document.getElementById('searchInput');
  dom.searchClearBtn = document.getElementById('searchClearBtn');
  dom.nearQuickBtn = document.getElementById('nearQuickBtn');
  dom.categoryStrip = document.getElementById('categoryStrip');
  dom.presetsContainer = document.getElementById('presetsContainer');
  dom.locateBtn = document.getElementById('locateBtn');
  dom.locationStatusText = document.getElementById('locationStatusText');
  dom.coordsTag = document.getElementById('coordsTag');
  dom.districtSelect = document.getElementById('districtSelect');
  dom.priceCapSelect = document.getElementById('priceCapSelect');
  dom.sortSelect = document.getElementById('sortSelect');
  dom.resultCount = document.getElementById('resultCount');
  dom.viewListBtn = document.getElementById('viewListBtn');
  dom.viewMapBtn = document.getElementById('viewMapBtn');
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
  dom.themeBtn = document.getElementById('themeBtn');
  dom.favHeaderBtn = document.getElementById('favHeaderBtn');
  dom.favCountBadge = document.getElementById('favCountBadge');
  dom.toast = document.getElementById('toast');
  dom.bottomNavItems = document.querySelectorAll('[data-nav-tab]');

  // 1. Mavzuni va Telegram WebApp SDK ni ishga tushirish
  applyTheme(state.theme);
  initTelegramApp((tgScheme) => {
    applyTheme(tgScheme);
  });

  // 2. Boshlang'ich UI qismlarini chizish
  populateDistrictSelect();
  renderCategoryStrip();
  renderLocationPresets();
  renderPlacesList();
  updateBottomNavActiveState();

  // 3. Qidiruv inputi (live filter)
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

  // 4. "Yaqinimda" tezkor tugmasi
  dom.nearQuickBtn.addEventListener('click', () => {
    triggerHaptic('selection');
    state.nearMeActive = !state.nearMeActive;
    if (state.nearMeActive) {
      state.sortBy = 'distance_asc';
      dom.sortSelect.value = 'distance_asc';
      showToast('📍 3.5 km radiusdagi eng yaqin joylar saralandi');
    } else {
      showToast("🌍 Toshkent bo'ylab barcha joylar ko'rsatilmoqda");
    }
    state.visibleCount = PAGE_SIZE;
    renderPlacesList();
    updateBottomNavActiveState();
  });

  // 5. Kategoriya chiplari bosilishi
  dom.categoryStrip.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-category]');
    if (!chip) return;

    triggerHaptic('selection');
    state.selectedCategory = chip.dataset.category;
    state.visibleCount = PAGE_SIZE;
    renderCategoryStrip();
    renderPlacesList();
  });

  // 6. GPS aniqlash va Toshkent hudud presetlari
  dom.locateBtn.addEventListener('click', handleDetectUserLocation);

  dom.presetsContainer.addEventListener('click', (e) => {
    const presetBtn = e.target.closest('[data-preset-id]');
    if (!presetBtn) return;

    const preset = TASHKENT_PRESETS.find((p) => p.id === presetBtn.dataset.presetId);
    if (!preset) return;

    triggerHaptic('selection');
    state.activePresetId = preset.id;
    state.userCoords = {
      lat: preset.lat,
      lng: preset.lng,
      label: preset.name,
      isRealGps: false
    };
    state.sortBy = 'distance_asc';
    dom.sortSelect.value = 'distance_asc';
    state.visibleCount = PAGE_SIZE;

    renderLocationPresets();
    renderPlacesList();
    showToast(`📍 Nuqta o'zgartirildi: ${preset.name}`);
  });

  // 7. Tuman, Narx chegarasi va Saralash selectlari
  dom.districtSelect.addEventListener('change', (e) => {
    triggerHaptic('selection');
    state.selectedDistrict = e.target.value;
    state.visibleCount = PAGE_SIZE;
    renderPlacesList();
  });

  dom.priceCapSelect.addEventListener('change', (e) => {
    triggerHaptic('selection');
    state.maxPrice = e.target.value;
    state.visibleCount = PAGE_SIZE;
    renderPlacesList();
  });

  dom.sortSelect.addEventListener('change', (e) => {
    triggerHaptic('selection');
    state.sortBy = e.target.value;
    state.visibleCount = PAGE_SIZE;
    renderPlacesList();
  });

  // 8. Ro'yxat / Xarita ko'rinishini almashtirish
  dom.viewListBtn.addEventListener('click', () => setViewMode('list'));
  dom.viewMapBtn.addEventListener('click', () => setViewMode('map'));

  // 9. Kartochka ichidagi amallar (Event Delegation)
  dom.placesGrid.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-action="toggle-fav"]');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.placeId);
      triggerHaptic('light');
      if (state.favorites.has(id)) {
        state.favorites.delete(id);
        showToast("💔 Sevimlilardan o'chirildi");
      } else {
        state.favorites.add(id);
        showToast("❤️ Sevimlilarga saqlandi!");
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

  // 10. Pagination ("Yana ko'rsatish")
  dom.loadMoreBtn.addEventListener('click', () => {
    triggerHaptic('light');
    state.visibleCount += PAGE_SIZE;
    renderPlacesList();
  });

  // 11. Filtrlarni tozalash
  dom.resetFiltersBtn.addEventListener('click', resetAllFilters);

  // 12. Header: Mavzu (Dark/Light) va Sevimlilar tugmasi
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
      state.favoritesOnly
        ? `❤️ Saqlangan joylar (${state.favorites.size} ta)`
        : "🍽️ Barcha joylar ro'yxati"
    );
  });

  // 13. Bottom Sheet Modal hodisalari
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

  // Escape tugmasi bilan modalni yopish
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.activePlace) {
      closeBottomSheet();
    }
  });

  // 14. Pastki Navigatsiya (Bottom Navigation Bar)
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
        dom.sortSelect.value = 'distance_asc';
        setViewMode('list');
        showToast('📍 Sizga eng yaqin arzon joylar');
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
