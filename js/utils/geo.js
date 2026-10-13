// ==========================================================================
// js/utils/geo.js — Geolocation API, Haversine Formula & Route Deep Links
// ==========================================================================

const EARTH_RADIUS_KM = 6371; // Yer radiusi (km)

// Toshkent markazi default koordinatasi (Amir Temur xiyoboni / Talabalar shaharchasi o'rtasi)
export const DEFAULT_TASHKENT_COORDS = {
  lat: 41.311081,
  lng: 69.240562,
  label: "Toshkent markazi (Standart)"
};

/**
 * Darajani radianga o'tkazish
 * @param {number} deg
 * @returns {number}
 */
function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine formulasi yordamida ikki GPS nuqta orasidagi aniq masofani (km da) hisoblash
 * @param {number} lat1 - Foydalanuvchi kengligi (latitude)
 * @param {number} lng1 - Foydalanuvchi uzunligi (longitude)
 * @param {number} lat2 - Manzil kengligi
 * @param {number} lng2 - Manzil uzunligi
 * @returns {number} Masofa kilometrda (masalan: 0.354 yoki 2.41)
 */
export function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lng2 !== 'number'
  ) {
    return null;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Masofani foydalanuvchi uchun qulay ko'rinishda formatlash ("350 m" yoki "1.2 km")
 * @param {number|null} distanceKm
 * @returns {string}
 */
export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return '—';
  }

  if (distanceKm < 1) {
    const meters = Math.max(20, Math.round((distanceKm * 1000) / 10) * 10);
    return `${meters} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Piyoda yoki transportda taxminiy yetib borish vaqtini hisoblash
 * @param {number|null} distanceKm
 * @returns {string}
 */
export function formatTravelTime(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return '';
  }

  // 2 km gacha piyoda (~5 km/soat tezlik bilan)
  if (distanceKm <= 2.0) {
    const walkMins = Math.max(2, Math.round((distanceKm / 4.8) * 60));
    return `🚶 ~${walkMins} daq`;
  }

  // 2 km dan uzoq bo'lsa jamoat transporti / mashinada (~28 km/soat shahar ichida)
  const driveMins = Math.max(5, Math.round((distanceKm / 26) * 60));
  return `🚌 ~${driveMins} daq`;
}

/**
 * Brauzer Geolocation API orqali foydalanuvchi joylashuvini aniqlash
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("Qurilmangizda Geolocation qo'llab-quvvatlanmaydi."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy || 0)
        });
      },
      (error) => {
        let message = "Joylashuvni aniqlab bo'lmadi.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Geolokatsiyaga ruxsat berilmadi. Yuqoridagi tayyor Toshkent hududlaridan birini tanlashingiz mumkin!";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "GPS signali topilmadi. Tayyor hududlardan birini tanlang.";
        } else if (error.code === error.TIMEOUT) {
          message = "Joylashuvni aniqlash vaqti tugadi.";
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Yandex Maps marshrut havolasini yaratish
 * @param {{lat: number, lng: number}|null} userCoords
 * @param {{lat: number, lng: number, name?: string}} place
 * @returns {string}
 */
export function getYandexMapsUrl(userCoords, place) {
  if (userCoords && userCoords.lat && userCoords.lng) {
    return `https://yandex.uz/maps/?rtext=${userCoords.lat},${userCoords.lng}~${place.lat},${place.lng}&rtt=auto`;
  }
  return `https://yandex.uz/maps/?pt=${place.lng},${place.lat}&z=17&l=map`;
}

/**
 * Mobil qurilmalar uchun Yandex Navigator deep-link
 * @param {{lat: number, lng: number}} place
 * @returns {string}
 */
export function getYandexNaviUrl(place) {
  return `yandexnavi://build_route_on_map?lat_to=${place.lat}&lon_to=${place.lng}`;
}

/**
 * Google Maps marshrut havolasini yaratish
 * @param {{lat: number, lng: number}|null} userCoords
 * @param {{lat: number, lng: number}} place
 * @returns {string}
 */
export function getGoogleMapsUrl(userCoords, place) {
  if (userCoords && userCoords.lat && userCoords.lng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${place.lat},${place.lng}&travelmode=walking`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
}
