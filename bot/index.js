// ==========================================================================
// bot/index.js — "@ovqat_byudjet_bot" (Obed) Telegram Bot & TMA Server
// Funksiyalar:
// 1. Bot komandalari, tavsifi va WebApp MenuButton ni avtomatik sozlash
// 2. /start, /near, /top, /categories, /districts buyruqlariga javob berish
// 3. Foydalanuvchi GPS lokatsiyasini yuborganda Haversine formulasi orqali
//    eng yaqin 5 ta arzon ovqatlanish joyini topib berish
// 4. Matn orqali qidiruv (masalan: "Chilonzor", "osh", "Beruniy", "lavash")
// ==========================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACES_DATA, CATEGORIES } from '../data/places.js';
import {
  calculateHaversineDistance,
  formatDistance,
  formatTravelTime,
  getYandexMapsUrl,
  getGoogleMapsUrl
} from '../js/utils/geo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env faylini o'qish (qo'shimcha kutubxonasiz)
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  });
}

loadEnvFile();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL =
  process.env.WEBAPP_URL || 'https://byudjet-ovqat.vercel.app';

if (!BOT_TOKEN) {
  console.error('❌ Xatolik: TELEGRAM_BOT_TOKEN topilmadi! .env faylini tekshiring.');
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Telegram Bot API ga so'rov yuborish
 * @param {string} method
 * @param {object} body
 */
async function callTelegramApi(method, body = {}) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API [${method}] error: ${data.description || 'Unknown error'}`);
  }
  return data.result;
}

/**
 * Narxni so'mda chiroyli formatlash
 * @param {number} price
 */
function formatUZS(price) {
  return `${Number(price).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}

/**
 * Bot profilini, buyruqlarini va WebApp Menu tugmasini sozlash
 */
async function configureBotProfile() {
  console.log('⚙️ @ovqat_byudjet_bot sozlanmoqda...');

  const me = await callTelegramApi('getMe');
  console.log(`✅ Bot ulandi: @${me.username} (${me.first_name}, ID: ${me.id})`);

  // 1. Komandalarni o'rnatish
  await callTelegramApi('setMyCommands', {
    commands: [
      { command: 'start', description: '🍲 Mini App ni ochish va asosiy menyu' },
      { command: 'near', description: '📍 Menga eng yaqin arzon joylarni topish' },
      { command: 'top', description: '🔥 Eng arzon Top-5 tushlik joylari (16k-20k)' },
      { command: 'categories', description: '🍽 Taom toifalari (Osh, Kombo, Somsa, Lavash)' },
      { command: 'districts', description: '🏙 Toshkent tumanlari bo‘yicha qidirish' },
      { command: 'help', description: 'ℹ️ Bot va ilovadan foydalanish yordami' }
    ]
  });
  console.log('✅ Bot komandalari (setMyCommands) o‘rnatildi.');

  // 2. Bot tavsifini (Description) o'rnatish
  await callTelegramApi('setMyDescription', {
    description:
      "🍲 Arzon Ovqat Toshkent (@ovqat_byudjet_bot) — Talabalar va hamyonbop tushlik qilmoqchi bo'lganlar uchun Toshkent shahridagi 216+ eng arzon va ishonchli ovqatlanish joylari (Osh, Tushlik kombo, Fast food, Somsa, Suyuq va Kechki ovqatlar) xaritasi!\n\n👇 Boshlash uchun «Start» tugmasini bosing yoki «🍲 Arzon Ovqat» Mini App ilovasini oching."
  });

  await callTelegramApi('setMyShortDescription', {
    short_description:
      "🍲 Toshkent bo'ylab 216+ eng hamyonbop osh, tushlik kombo, somsa va fast-food joylari xaritasi!"
  });
  console.log('✅ Bot tavsifi (Description & ShortDescription) yangilandi.');

  // 3. Chat Menu Button ni WebApp ga ulash
  try {
    await callTelegramApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🍲 Arzon Ovqat',
        web_app: { url: WEBAPP_URL }
      }
    });
    console.log(`✅ Chat Menu Button ulandi -> ${WEBAPP_URL}`);
  } catch (err) {
    console.warn('⚠️ MenuButton eslatma:', err.message);
  }

  return me;
}

/**
 * Asosiy Inline klaviatura (Mini App + Tezkor Toifalar)
 */
function getMainInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '🍲 Arzon Ovqat Mini App ni ochish (216+ joy)',
          web_app: { url: WEBAPP_URL }
        }
      ],
      [
        { text: '🍛 Osh', callback_data: 'cat:osh' },
        { text: '🍱 Tushlik (Kombo)', callback_data: 'cat:kombo' }
      ],
      [
        { text: '🌯 Fast food', callback_data: 'cat:fastfood' },
        { text: '🥟 Somsa', callback_data: 'cat:somsa' }
      ],
      [
        { text: '🍜 Suyuq ovqatlar', callback_data: 'cat:suyuq' },
        { text: '🥘 Kechki ovqat', callback_data: 'cat:kechki' }
      ],
      [
        { text: '🔥 Top-5 Eng Arzon Joylar', callback_data: 'action:top_cheap' },
        { text: '🏙 Tumanlar', callback_data: 'action:districts' }
      ]
    ]
  };
}

/**
 * Joylashuv yuborish uchun pastki Reply klaviatura
 */
function getLocationReplyKeyboard() {
  return {
    keyboard: [
      [
        {
          text: '📍 Menga eng yaqin arzon joylarni topish (GPS yuborish)',
          request_location: true
        }
      ],
      [{ text: '🔥 Eng arzon 5 ta joy' }, { text: '🏙 Tumanlar ro‘yxati' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

/**
 * Joylar ro'yxatini chiroyli Telegram xabari sifatida formatlash
 * @param {Array} places
 * @param {string} title
 * @param {{lat: number, lng: number}|null} userCoords
 */
function formatPlacesMessage(places, title, userCoords = null) {
  const lines = [`<b>${title}</b>\n`];

  places.forEach((p, idx) => {
    const distInfo =
      p.distanceKm !== undefined && p.distanceKm !== null
        ? ` · 📍 <b>${formatDistance(p.distanceKm)}</b> (${formatTravelTime(p.distanceKm)})`
        : '';
    const yandexUrl = getYandexMapsUrl(userCoords, p);
    const googleUrl = getGoogleMapsUrl(userCoords, p);

    lines.push(
      `<b>${idx + 1}. ${p.name}</b> — ★ ${p.rating}${distInfo}\n` +
        `🍽 <b>${p.dishName}</b>\n` +
        `💰 Narxi: <b>${formatUZS(p.price)}</b> (${p.portion})\n` +
        `🧭 Manzil: ${p.district} t., ${p.landmark}\n` +
        `🕒 Ish vaqti: ${p.workingHours} | 📞 ${p.phone}\n` +
        `🗺 <a href="${yandexUrl}">Yandex Xarita</a>  |  <a href="${googleUrl}">Google Maps</a>\n`
    );
  });

  return lines.join('\n');
}

/**
 * Foydalanuvchi xabarlarini qayta ishlash
 */
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'Do‘stim';
  const text = (msg.text || '').trim();

  // 1. Agar foydalanuvchi GPS lokatsiya yuborgan bo'lsa
  if (msg.location) {
    const { latitude, longitude } = msg.location;
    const nearest = PLACES_DATA.map((p) => ({
      ...p,
      distanceKm: calculateHaversineDistance(latitude, longitude, p.lat, p.lng)
    }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);

    const responseHtml = formatPlacesMessage(
      nearest,
      `📍 Sizga eng yaqin 5 ta hamyonbop ovqatlanish joyi:`,
      { lat: latitude, lng: longitude }
    );

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: responseHtml,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🗺 Mini App Xaritada barchasini ko‘rish',
              web_app: { url: WEBAPP_URL }
            }
          ]
        ]
      }
    });
    return;
  }

  // 2. Agar Mini App dan web_app_data kelsa
  if (msg.web_app_data?.data) {
    try {
      const payload = JSON.parse(msg.web_app_data.data);
      await callTelegramApi('sendMessage', {
        chat_id: chatId,
        parse_mode: 'HTML',
        text:
          `✅ <b>Tanlangan joy ma'lumotlari:</b>\n\n` +
          `🏪 <b>${payload.name || ''}</b>\n` +
          `🍽 ${payload.dishName || ''}\n` +
          `💰 Hisob: <b>${formatUZS(payload.totalPrice || payload.price || 0)}</b>\n` +
          `📍 Manzil: ${payload.address || ''}\n` +
          `📞 Tel: ${payload.phone || ''}`
      });
    } catch (_) {
      // Ignore parse error
    }
    return;
  }

  // 3. Komandalar
  if (text.startsWith('/start')) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text:
        `Assalomu alaykum, <b>${firstName}</b>! 👋\n\n` +
        `🍲 <b>«Arzon Ovqat Toshkent» (@ovqat_byudjet_bot)</b> ga xush kelibsiz!\n\n` +
        `Bu yerda talabalar va arzon tushlik qilmoqchi bo'lganlar uchun Toshkentning <b>12 ta tumani bo'ylab 216 ta</b> eng hamyonbop va sifatli oshxonalar jamlangan (narxlar <b>15 000 – 44 000 so'm</b>).\n\n` +
        `👇 <b>Quyidagi tugma orqali Mini App ilovani oching</b> yoki menga 📍 <b>GPS joylashuvingizni</b> yuboring:`,
      reply_markup: getMainInlineKeyboard()
    });

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '📍 Eng yaqin oshxonalarni bir zumda topish uchun pastdagi GPS tugmasini bosing yoki taom/tuman nomini yozing:',
      reply_markup: getLocationReplyKeyboard()
    });
    return;
  }

  if (text.startsWith('/near')) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '📍 Sizga eng yaqin arzon joylarni Haversine formulasi orqali aniqlash uchun quyidagi tugma orqali joylashuvingizni yuboring:',
      reply_markup: getLocationReplyKeyboard()
    });
    return;
  }

  if (text.startsWith('/top') || text === '🔥 Eng arzon 5 ta joy') {
    const cheapest = [...PLACES_DATA].sort((a, b) => a.price - b.price).slice(0, 5);
    const html = formatPlacesMessage(cheapest, '🔥 Toshkent bo‘yicha eng arzon Top-5 taomlar:');
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: getMainInlineKeyboard()
    });
    return;
  }

  if (text.startsWith('/categories')) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '🍽 Qaysi toifadagi arzon taomlarni qidiryapsiz? Tanlang:',
      reply_markup: getMainInlineKeyboard()
    });
    return;
  }

  if (text.startsWith('/districts') || text === '🏙 Tumanlar ro‘yxati') {
    const districts = [...new Set(PLACES_DATA.map((p) => p.district))];
    const rows = [];
    for (let i = 0; i < districts.length; i += 2) {
      const pair = [{ text: `📍 ${districts[i]}`, callback_data: `dist:${districts[i]}` }];
      if (districts[i + 1]) {
        pair.push({ text: `📍 ${districts[i + 1]}`, callback_data: `dist:${districts[i + 1]}` });
      }
      rows.push(pair);
    }
    rows.push([{ text: '🍲 Mini App Xaritada ochish', web_app: { url: WEBAPP_URL } }]);

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '🏙 Toshkent tumanlaridan birini tanlang:',
      reply_markup: { inline_keyboard: rows }
    });
    return;
  }

  if (text.startsWith('/help')) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text:
        `ℹ️ <b>Botdan qanday foydalaniladi?</b>\n\n` +
        `1️⃣ <b>Mini App orqali:</b> «🍲 Arzon Ovqat Mini App ni ochish» tugmasini bosing — u yerda xarita, filtrlar, menyu kalkulyatori va 216 ta joy mavjud.\n` +
        `2️⃣ <b>GPS orqali:</b> Botga joylashuvingizni (Location) yuboring — sizga eng yaqin 5 ta arzon oshxona masofasi bilan chiqadi.\n` +
        `3️⃣ <b>Matn yozib qidiring:</b> Masalan, <i>«osh»</i>, <i>«Beruniy»</i>, <i>«Chilonzor»</i>, <i>«lavash»</i> yoki <i>«somsa»</i> deb yozing!`,
      reply_markup: getMainInlineKeyboard()
    });
    return;
  }

  // 4. Erkin matn orqali qidiruv
  if (text.length >= 2) {
    const q = text.toLowerCase();
    const matches = PLACES_DATA.filter((p) =>
      `${p.dishName} ${p.name} ${p.district} ${p.landmark} ${p.categoryLabel}`
        .toLowerCase()
        .includes(q)
    )
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    if (matches.length === 0) {
      await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: `🧐 «${text}» bo'yicha joy topilmadi. Boshqa so'z yozib ko'ring (masalan: Osh, Somsa, Chilonzor, TATU, Beruniy) yoki Mini App ni oching:`,
        reply_markup: getMainInlineKeyboard()
      });
      return;
    }

    const html = formatPlacesMessage(matches, `🔍 «${text}» bo'yicha eng arzon joylar:`);
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: getMainInlineKeyboard()
    });
  }
}

/**
 * Inline tugmalar (Callback Query) ni qayta ishlash
 */
async function handleCallbackQuery(query) {
  const chatId = query.message?.chat?.id;
  const data = query.data || '';

  await callTelegramApi('answerCallbackQuery', { callback_query_id: query.id });
  if (!chatId) return;

  if (data.startsWith('cat:')) {
    const catId = data.replace('cat:', '');
    const catObj = CATEGORIES.find((c) => c.id === catId);
    const matches = PLACES_DATA.filter((p) => p.category === catId)
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    const html = formatPlacesMessage(
      matches,
      `${catObj ? catObj.emoji + ' ' + catObj.label : 'Taomlar'} — Eng arzon Top-5:`
    );
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: getMainInlineKeyboard()
    });
    return;
  }

  if (data.startsWith('dist:')) {
    const district = data.replace('dist:', '');
    const matches = PLACES_DATA.filter((p) => p.district === district)
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    const html = formatPlacesMessage(
      matches,
      `📍 ${district} tumanidagi eng arzon Top-5 joylar:`
    );
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: getMainInlineKeyboard()
    });
    return;
  }

  if (data === 'action:top_cheap') {
    const cheapest = [...PLACES_DATA].sort((a, b) => a.price - b.price).slice(0, 5);
    const html = formatPlacesMessage(cheapest, '🔥 Toshkent bo‘yicha eng arzon Top-5 taomlar:');
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: getMainInlineKeyboard()
    });
    return;
  }

  if (data === 'action:districts') {
    const districts = [...new Set(PLACES_DATA.map((p) => p.district))];
    const rows = [];
    for (let i = 0; i < districts.length; i += 2) {
      const pair = [{ text: `📍 ${districts[i]}`, callback_data: `dist:${districts[i]}` }];
      if (districts[i + 1]) {
        pair.push({ text: `📍 ${districts[i + 1]}`, callback_data: `dist:${districts[i + 1]}` });
      }
      rows.push(pair);
    }
    rows.push([{ text: '🍲 Mini App Xaritada ochish', web_app: { url: WEBAPP_URL } }]);

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '🏙 Toshkent tumanlaridan birini tanlang:',
      reply_markup: { inline_keyboard: rows }
    });
  }
}

/**
 * Long-Polling sikli
 */
async function startPolling() {
  await configureBotProfile();

  if (process.argv.includes('--setup-only')) {
    console.log('🎉 Bot profili va MenuButton muvaffaqiyatli sozlandi (--setup-only).');
    return;
  }

  console.log('🚀 @ovqat_byudjet_bot Long-Polling rejimida xabarlarni kutmoqda...');
  let offset = 0;

  while (true) {
    try {
      const updates = await callTelegramApi('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message', 'callback_query']
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) {
          await handleMessage(update.message);
        } else if (update.callback_query) {
          await handleCallbackQuery(update.callback_query);
        }
      }
    } catch (err) {
      console.error('Polling xatoligi:', err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();
