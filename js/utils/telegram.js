// ==========================================================================
// js/utils/telegram.js — Telegram WebApp (TMA) SDK Integration Module
// ==========================================================================

let currentMainButtonHandler = null;
let currentBackButtonHandler = null;

/**
 * Telegram WebApp obyektini olish (agar mavjud bo'lsa)
 */
export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Telegram Mini App ni ishga tushirish, expand qilish va mavzuni moslashtirish
 * @param {(scheme: 'dark'|'light') => void} onThemeChange
 */
export function initTelegramApp(onThemeChange) {
  const tg = getTelegramWebApp();
  if (!tg) return false;

  try {
    tg.ready();
    tg.expand();

    // Rang sxemasini aniqlash
    if (tg.colorScheme && typeof onThemeChange === 'function') {
      onThemeChange(tg.colorScheme);
    }

    // Header va Orqa fon rangini ilova dizayniga moslash
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor(tg.colorScheme === 'light' ? '#f4f6fb' : '#0b0f17');
    }
    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor(tg.colorScheme === 'light' ? '#f4f6fb' : '#0b0f17');
    }

    // Telegram mavzusi o'zgarganda avtomatik yangilash
    if (typeof tg.onEvent === 'function') {
      tg.onEvent('themeChanged', () => {
        if (typeof onThemeChange === 'function') {
          onThemeChange(tg.colorScheme || 'dark');
        }
      });
    }

    return Boolean(tg.initDataUnsafe && tg.initDataUnsafe.user);
  } catch (err) {
    console.warn('Telegram WebApp init warning:', err);
    return false;
  }
}

/**
 * Haptic Feedback (Taktil tebranish) — tugmalar va filtrlarni bosganda
 * @param {'light'|'medium'|'heavy'|'selection'|'success'|'warning'|'error'} style
 */
export function triggerHaptic(style = 'light') {
  const tg = getTelegramWebApp();
  if (!tg || !tg.HapticFeedback) return;

  try {
    if (style === 'selection') {
      tg.HapticFeedback.selectionChanged();
    } else if (['success', 'warning', 'error'].includes(style)) {
      tg.HapticFeedback.notificationOccurred(style);
    } else {
      tg.HapticFeedback.impactOccurred(style);
    }
  } catch (_) {
    // Brauzerda xatolik bermasligi uchun
  }
}

/**
 * Telegram MainButton boshqaruvi
 * @param {{ text?: string, visible?: boolean, color?: string, textColor?: string, onClick?: Function }} config
 */
export function setTelegramMainButton({
  text = '',
  visible = false,
  color = '#10b981',
  textColor = '#ffffff',
  onClick = null
} = {}) {
  const tg = getTelegramWebApp();
  if (!tg || !tg.MainButton) return;

  try {
    if (currentMainButtonHandler) {
      tg.MainButton.offClick(currentMainButtonHandler);
      currentMainButtonHandler = null;
    }

    if (!visible) {
      tg.MainButton.hide();
      return;
    }

    tg.MainButton.setParams({
      text,
      color,
      text_color: textColor,
      is_active: true,
      is_visible: true
    });

    if (typeof onClick === 'function') {
      currentMainButtonHandler = onClick;
      tg.MainButton.onClick(currentMainButtonHandler);
    }

    tg.MainButton.show();
  } catch (err) {
    console.warn('Telegram MainButton error:', err);
  }
}

/**
 * Telegram BackButton boshqaruvi (Bottom Sheet modal yoki ichki oynalar uchun)
 * @param {{ visible: boolean, onClick?: Function }} config
 */
export function setTelegramBackButton({ visible = false, onClick = null } = {}) {
  const tg = getTelegramWebApp();
  if (!tg || !tg.BackButton) return;

  try {
    if (currentBackButtonHandler) {
      tg.BackButton.offClick(currentBackButtonHandler);
      currentBackButtonHandler = null;
    }

    if (!visible) {
      tg.BackButton.hide();
      return;
    }

    if (typeof onClick === 'function') {
      currentBackButtonHandler = onClick;
      tg.BackButton.onClick(currentBackButtonHandler);
    }

    tg.BackButton.show();
  } catch (err) {
    console.warn('Telegram BackButton error:', err);
  }
}

/**
 * Tashqi xarita havolasini Telegram yoki brauzer orqali xavfsiz ochish
 * @param {string} url
 */
export function openExternalMapLink(url) {
  triggerHaptic('medium');
  const tg = getTelegramWebApp();

  if (tg && typeof tg.openLink === 'function' && url.startsWith('http')) {
    try {
      tg.openLink(url);
      return;
    } catch (_) {
      // Fallback
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
