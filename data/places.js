// ==========================================================================
// data/places.js — Toshkent shahri bo'ylab 216 ta realistik va mashhur
// hamyonbop ovqatlanish joylari. Har bir taomga FAQAT O'ZINING HAQIQIY RASMI
// biriktirilgan (Oshga — haqiqiy Osh, Somsaga — Tandir Somsa, Shashlikka — Shashlik)!
// ==========================================================================

export const CATEGORIES = [
  { id: 'all', label: 'Hamma', emoji: '🍽️' },
  { id: 'osh', label: 'Osh', emoji: '🍛' },
  { id: 'kombo', label: 'Tushlik (kombo)', emoji: '🍱' },
  { id: 'fastfood', label: 'Fast food', emoji: '🌯' },
  { id: 'somsa', label: 'Somsa', emoji: '🥟' },
  { id: 'suyuq', label: 'Suyuq ovqat', emoji: '🍜' },
  { id: 'kechki', label: 'Kechki ovqat', emoji: '🥘' }
];

export const TASHKENT_PRESETS = [
  { id: 'talabalar', name: "🎓 Talabalar shaharchasi (O'zMU/TDTU)", district: 'Olmazor', lat: 41.3485, lng: 69.2065 },
  { id: 'tatu', name: '💻 TATU / Bodomzor (Yunusobod)', district: 'Yunusobod', lat: 41.3408, lng: 69.2867 },
  { id: 'chilonzor', name: '🚇 Chilonzor metro / Qatortol', district: 'Chilonzor', lat: 41.2752, lng: 69.2048 },
  { id: 'chorsu', name: '🕌 Chorsu bozori (Shayxontohur)', district: 'Shayxontohur', lat: 41.3265, lng: 69.2348 },
  { id: 'ipakyoli', name: "📍 Buyuk Ipak Yo'li (M. Ulug'bek)", district: "Mirzo Ulug'bek", lat: 41.3269, lng: 69.3284 },
  { id: 'sergeli', name: '🚝 Sergeli Yarmarka (3-bekat)', district: 'Sergeli', lat: 41.2216, lng: 69.2225 }
];

// Toshkentning 12 ta tumani va haqiqiy gavjum talabalar / bozor markazlari
const DISTRICT_HUBS = [
  {
    district: 'Olmazor',
    hubs: [
      { landmark: "Beruniy metro, Talabalar shaharchasi", street: "Universitet ko'chasi", lat: 41.3468, lng: 69.2058 },
      { landmark: "O'zMU va Politexnika (TDTU) yotoqxonalari", street: "Talabalar ko'chasi", lat: 41.3512, lng: 69.2035 },
      { landmark: "Qoraqamish 1/2 talabalar qatori", street: "Qoraqamish ko'chasi", lat: 41.3625, lng: 69.2184 },
      { landmark: "Tinchlik metro bekati", street: "Beruniy shoh ko'chasi", lat: 41.3338, lng: 69.2169 },
      { landmark: "Sebzor chorrahasi, Riviera orqasi", street: "Nurafshon ko'chasi", lat: 41.3395, lng: 69.2465 },
      { landmark: "ToshMI-2 (Tibbiyot akademiyasi) yonida", street: "Farobi ko'chasi", lat: 41.3541, lng: 69.1912 }
    ]
  },
  {
    district: 'Chilonzor',
    hubs: [
      { landmark: "Chilonzor metro, Integro arzon oshxonalari", street: "Bunyodkor shoh ko'chasi", lat: 41.2749, lng: 69.2046 },
      { landmark: "Qatortol ulgurji bozori somsaxonalar qatori", street: "Qatortol ko'chasi", lat: 41.2836, lng: 69.1984 },
      { landmark: "Novza metro, Oltin Markaz yaqini", street: "Muqimiy ko'chasi", lat: 41.2917, lng: 69.2229 },
      { landmark: "Mirzo Ulug'bek metro, Bunyodkor stadioni", street: "Chilonzor 6-kvartal", lat: 41.2845, lng: 69.2132 },
      { landmark: "Oqtepa maydoni, Lutfiy chorrahasi", street: "Lutfiy ko'chasi", lat: 41.2952, lng: 69.1945 },
      { landmark: "Chilonzor 19-kvartal, Algoritm yo'li", street: "Zargarlik ko'chasi", lat: 41.2678, lng: 69.1786 }
    ]
  },
  {
    district: 'Yunusobod',
    hubs: [
      { landmark: "TATU bosh binosi ro'parasi, Bodomzor", street: "Amir Temur shoh ko'chasi", lat: 41.3412, lng: 69.2869 },
      { landmark: "Shahriston metro, Yunusobod dehqon bozori", street: "Amir Temur ko'chasi", lat: 41.3539, lng: 69.2882 },
      { landmark: "Mega Planet va Universam arzon tushlik qatori", street: "Yunusobod 11-kvartal", lat: 41.3665, lng: 69.2935 },
      { landmark: "Minor metro, Moliya instituti yonida", street: "Osiyo ko'chasi", lat: 41.3264, lng: 69.2831 },
      { landmark: "Yunusobod 4-kvartal, Moyqo'rg'on", street: "Moyqo'rg'on ko'chasi", lat: 41.3612, lng: 69.2768 },
      { landmark: "Yunusobod 19-kvartal, Sayram bozori", street: "Yangi Yunusobod ko'chasi", lat: 41.3742, lng: 69.3125 }
    ]
  },
  {
    district: "Mirzo Ulug'bek",
    hubs: [
      { landmark: "Buyuk Ipak Yo'li metro, Maksim Gorkiy", street: "Mustaqillik shoh ko'chasi", lat: 41.3269, lng: 69.3286 },
      { landmark: "Parkent dehqon bozori somsa va shashlik qatori", street: "Parkent ko'chasi", lat: 41.3156, lng: 69.3254 },
      { landmark: "Inha va Diplomatiya universiteti (Ziyolilar)", street: "Ziyolilar ko'chasi", lat: 41.3385, lng: 69.3345 },
      { landmark: "TTZ bozori, Oxunboboyev bekati", street: "Yuzrabot ko'chasi", lat: 41.3554, lng: 69.3652 },
      { landmark: "Ekobozor (Temur Malik chorrahasi)", street: "Temur Malik ko'chasi", lat: 41.3478, lng: 69.3422 },
      { landmark: "Darxon va Hamid Olimjon metro", street: "Pushkin ko'chasi", lat: 41.3192, lng: 69.3041 }
    ]
  },
  {
    district: 'Shayxontohur',
    hubs: [
      { landmark: "Chorsu bozori, Mashhur Obxod Taomlar qatori", street: "Navoiy ko'chasi", lat: 41.3262, lng: 69.2345 },
      { landmark: "Samarqand Darvoza, Kamolon mahallasi", street: "Qoratosh ko'chasi", lat: 41.3161, lng: 69.2312 },
      { landmark: "Xalqlar Do'stligi metro, Tashkent City yaqini", street: "Islom Karimov ko'chasi", lat: 41.3095, lng: 69.2428 },
      { landmark: "Ko'kcha masjidi va Mannon Uyg'ur shashlikxonalari", street: "Ko'kcha Darvoza ko'chasi", lat: 41.3228, lng: 69.2064 },
      { landmark: "Labzak va Anhor bog'i qatori", street: "Labzak ko'chasi", lat: 41.3289, lng: 69.2615 },
      { landmark: "Paxtakor metro, Toshkent Davlat Yuridik universiteti", street: "Alisher Navoiy ko'chasi", lat: 41.3184, lng: 69.2549 }
    ]
  },
  {
    district: 'Yakkasaroy',
    hubs: [
      { landmark: "Next Mall va Bobur bog'i", street: "Bobur ko'chasi", lat: 41.2986, lng: 69.2494 },
      { landmark: "To'qimachilik instituti (Tekstil) chorrahasi", street: "Shota Rustaveli ko'chasi", lat: 41.2798, lng: 69.2452 },
      { landmark: "Janubiy vokzal, Vega Center ro'parasi", street: "Usmon Nosir ko'chasi", lat: 41.2649, lng: 69.2335 },
      { landmark: "Qushbegi mavzesi, Kichik halqa yo'li", street: "Qushbegi ko'chasi", lat: 41.2724, lng: 69.2381 },
      { landmark: "Kosmonavtlar metro, Nizomiy instituti", street: "Afrosiyob ko'chasi", lat: 41.3048, lng: 69.2638 }
    ]
  },
  {
    district: 'Mirobod',
    hubs: [
      { landmark: "Oybek metro, Farmatsevtika instituti", street: "Afrosiyob ko'chasi", lat: 41.2981, lng: 69.2742 },
      { landmark: "Shimoliy Vokzal, Toshkent metro", street: "Turkiston ko'chasi", lat: 41.2925, lng: 69.2869 },
      { landmark: "Mirobod dehqon bozori (Gospitalniy)", street: "Nukus ko'chasi", lat: 41.2874, lng: 69.2758 },
      { landmark: "Risoviy bozori, Farg'ona yo'li shashlik qatori", street: "Farg'ona yo'li", lat: 41.2738, lng: 69.3025 },
      { landmark: "Taras Shevchenko gastronomik ko'chasi", street: "Taras Shevchenko ko'chasi", lat: 41.3024, lng: 69.2795 }
    ]
  },
  {
    district: 'Uchtepa',
    hubs: [
      { landmark: "Farhod dehqon bozori asosiy ovqat rastasi", street: "Farhod ko'chasi", lat: 41.2856, lng: 69.1859 },
      { landmark: "Jahon tillari universiteti (O'zDJTU) talabalar kafesi", street: "Kichik halqa yo'li", lat: 41.2812, lng: 69.1765 },
      { landmark: "Chilonzor 24-kvartal, Vatan kinoteatri", street: "Shirin ko'chasi", lat: 41.2784, lng: 69.1674 },
      { landmark: "O'rikzor ulgurji bozori oshxonalar qatori", street: "THAY (O'rikzor)", lat: 41.2985, lng: 69.1525 },
      { landmark: "Beshqayrag'och va Ko'kcha Oqtepa", street: "Ibrat ko'chasi", lat: 41.3095, lng: 69.1748 }
    ]
  },
  {
    district: 'Sergeli',
    hubs: [
      { landmark: "Sergeli yarmarka bozori (3-bekat)", street: "Yangi Sergeli yo'li", lat: 41.2218, lng: 69.2224 },
      { landmark: "Choshtepa metro (1-bekat)", street: "Choshtepa ko'chasi", lat: 41.2392, lng: 69.2085 },
      { landmark: "Sergeli-7 mavzesi (4-metro bekati)", street: "Mirzo Tursunzoda ko'chasi", lat: 41.2135, lng: 69.2168 },
      { landmark: "O'zgarish ko'prigi, Golden Life", street: "Yangi Sergeli shoh ko'chasi", lat: 41.2448, lng: 69.2242 },
      { landmark: "Sergeli Mashina bozori oshxonalari", street: "Qipchoq ko'chasi", lat: 41.2094, lng: 69.2395 }
    ]
  },
  {
    district: 'Yashnobod',
    hubs: [
      { landmark: "Aviasozlar (Kadisheva) bozori markazi", street: "Birlashgan ko'chasi", lat: 41.2914, lng: 69.3428 },
      { landmark: "Do'stlik metro (Chkalov), Texnopark", street: "Elbek ko'chasi", lat: 41.2946, lng: 69.3225 },
      { landmark: "Tuzel-2 mavzesi, 3-bekat", street: "Ohangaron yo'li", lat: 41.2835, lng: 69.3542 },
      { landmark: "Mashinasozlar metro, Ashxobod bog'i", street: "Mahtumquli ko'chasi", lat: 41.3042, lng: 69.3075 },
      { landmark: "Yangiobod va Ohangaron shoh ko'chasi", street: "Ohangaron shoh ko'chasi", lat: 41.2684, lng: 69.3485 }
    ]
  },
  {
    district: 'Bektemir',
    hubs: [
      { landmark: "Qo'yliq dehqon bozori, 7-bekat", street: "THAY Qo'yliq", lat: 41.2385, lng: 69.3278 },
      { landmark: "Compass Mall savdo markazi ro'parasi", street: "Farg'ona yo'li", lat: 41.2412, lng: 69.3315 },
      { landmark: "Rohat aylanasi (9-bekat)", street: "Ohangaron yo'li", lat: 41.2584, lng: 69.3585 },
      { landmark: "Vodnik mavzesi, Bektemir markazi", street: "Husayn Boyqaro ko'chasi", lat: 41.2195, lng: 69.3342 }
    ]
  },
  {
    district: 'Yangihayot',
    hubs: [
      { landmark: "Index bozori oshxonalar paviloni", street: "Sofdil ko'chasi", lat: 41.2045, lng: 69.2312 },
      { landmark: "Turon metro (13-bekat), Sergeli-8", street: "Qipchoq ko'chasi", lat: 41.2068, lng: 69.2115 },
      { landmark: "Yangi Darxon talabalar shaharchasi", street: "Navro'z ko'chasi", lat: 41.1995, lng: 69.2248 },
      { landmark: "Sputnik-4 bog'i atrofi", street: "Yo'ldosh mavzesi", lat: 41.2124, lng: 69.2368 }
    ]
  }
];

// Haqiqiy taomlar shablonlari — HAR BIR TAOMGA FAQAT O'ZIGA MOS ANIQ RASM!
const DISH_TEMPLATES = {
  // 1. OSH (PLOV) — Faqat haqiqiy o'zbek oshi rasmlari (go'sht, sariq sabzi, no'xat, mayiz)
  osh: [
    {
      placePrefix: ["Chorsu To'y Oshi Markazi", "Besh Qozon Express", "SamOsh Beruniy", "Bodomzor Milliy Oshi", "Qatortol Devzira Oshi", "Qorasuv To'y Oshi"],
      dishName: "To'y oshi (0.7 porsiya + achichuk + choy)",
      basePrice: 24000,
      portion: "380 gr",
      // Haqiqiy O'zbek to'y oshi rasmi (go'shti, sabzisi va lazer guruchi bilan)
      image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Lazer guruch", "Mol go'shti", "Sariq sabzi", "No'xat va mayiz", "Achichuk salat", "Ko'k choy"],
      menu: [
        { name: "To'y oshi (Talaba 0.7 porsiya)", portion: "380 gr", price: 24000 },
        { name: "To'liq to'y oshi (1.0 porsiya)", portion: "460 gr", price: 30000 },
        { name: "Ot go'shtli qazi qo'shimcha", portion: "40 gr", price: 9000 },
        { name: "Achichuk yangi salat", portion: "150 gr", price: 5000 },
        { name: "Issiq tandir non + choy", portion: "1 set", price: 4000 }
      ]
    },
    {
      placePrefix: ["Baraka Choyxona Oshi", "Minor Choyxona Palov", "Farhod Bozori Palovxonasi", "Universitet Talabalar Oshi", "Integro Choyxona Oshi", "Kadisheva Palov Uyi"],
      dishName: "Choyxona palov (Talaba porsiya + non)",
      basePrice: 22000,
      portion: "360 gr",
      // Haqiqiy qora choyxona oshi
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Devzira/Lazer guruch", "Qo'y/mol go'shti", "Qovurilgan sabzi", "Bedana tuxumi", "Turp salati", "Issiq non"],
      menu: [
        { name: "Choyxona palov (Talaba porsiya)", portion: "360 gr", price: 22000 },
        { name: "Katta choyxona palov (1.0)", portion: "460 gr", price: 28000 },
        { name: "Suzma / Qatiq", portion: "1 kosa", price: 4000 },
        { name: "Achichuk pomidor-piyoz", portion: "150 gr", price: 5000 },
        { name: "Limonli ko'k choy (choynak)", portion: "500 ml", price: 4000 }
      ]
    },
    {
      placePrefix: ["Samarqand Zig'ir Oshi", "Zarafshon Osh Uyi", "Talabalar Oshxonasi №1", "Nurli Qozon Oshi", "Parkent Osh Markazi", "Sergeli Yarmarka Oshi"],
      dishName: "Samarqandcha zig'ir osh (0.8 porsiya)",
      basePrice: 26000,
      portion: "400 gr",
      // Haqiqiy qizg'ish zig'ir yog'li palov
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Alanga guruch", "Yumshoq mol go'shti", "Zig'ir yog'i", "Sariq sabzi", "No'xat", "Anor donalari"],
      menu: [
        { name: "Zig'ir osh (0.8 porsiya)", portion: "400 gr", price: 26000 },
        { name: "Zig'ir osh + bedana tuxum", portion: "450 gr", price: 31000 },
        { name: "Marokand bahor salati", portion: "150 gr", price: 6000 },
        { name: "Yopgan patir non", portion: "1 dona", price: 4000 },
        { name: "Mevali kompot", portion: "250 ml", price: 4000 }
      ]
    }
  ],

  // 2. SOMSA — Faqat haqiqiy tandir somsa va qatlama somsa rasmlari (sedanali, qizargan)
  somsa: [
    {
      placePrefix: ["Minor Qatlama Somsaxonasi", "Chorsu Issiq Tandir Somsa", "Qatortol Parmuda Somsa", "Beruniy Talabalar Somsasi", "Besh Tandir Somsaxona", "Kamolon Tandir Somsa"],
      dishName: "Tandir go'shtli somsa (2 dona) + Tomat sous + Choy",
      basePrice: 18000,
      portion: "2 dona (280 gr)",
      // Haqiqiy qatlama tandir somsa rasmi
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Qatlama xamir", "To'g'ralgan mol go'shti", "Dumbali piyoz", "Zira va sedana", "Achchiq tomat sousi", "Ko'k choy"],
      menu: [
        { name: "Tandir go'shtli somsa (1 dona)", portion: "140 gr", price: 9000 },
        { name: "Go'shtli somsa Set (2 dona + choy)", portion: "280 gr", price: 18000 },
        { name: "Tovuqli pishloqli somsa (1 dona)", portion: "130 gr", price: 8000 },
        { name: "Kartoshkali / Ko'k somsa (1 dona)", portion: "120 gr", price: 5000 },
        { name: "Katta Jizzax somsa (1 dona)", portion: "320 gr", price: 24000 }
      ]
    },
    {
      placePrefix: ["Buxoro Olot Somsa Markazi", "Farhod Bozori Somsaxonasi", "Jizzax Somsa Uyi", "Usta Somsapaz Qatortol", "Ko'kcha Tandir Somsa", "Sergeli Issiq Somsa"],
      dishName: "Buxoro Olot somsa (2 dona + pomidor sous + choy)",
      basePrice: 20000,
      portion: "2 dona (300 gr)",
      // Yupqa xamirli, ichi suvli Olot somsa rasmi
      image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Yupqa xamir", "Mol go'shti va quyruq", "Piyoz va yangi pomidor", "Ziravorlar", "Pomidor sous", "Ko'k choy"],
      menu: [
        { name: "Olot somsa Set (2 dona + choy)", portion: "300 gr", price: 20000 },
        { name: "Olot somsa (1 dona)", portion: "150 gr", price: 10000 },
        { name: "Parmuda somsa (3 dona)", portion: "210 gr", price: 18000 },
        { name: "Qovoqli shirin somsa (1 dona)", portion: "130 gr", price: 6000 },
        { name: "Muzdek suzma / qatiq", portion: "150 gr", price: 4000 }
      ]
    }
  ],

  // 3. FAST FOOD — Faqat go'shtli lavash, doner va shaurma rasmlari
  fastfood: [
    {
      placePrefix: ["Street Lavash Express", "Beruniy Student Lavash", "Qatortol Doner House", "Chilonzor Shaurma #1", "Bodomzor Fast Food", "Yunusobod Doner Hub"],
      dishName: "Standart Mol go'shtli Lavash + Muzdek Ayron",
      basePrice: 25000,
      portion: "340 gr + 250 ml",
      // Ichida go'shti va sousi to'la lavash / shaurma rasmi
      image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Yupqa xamir", "Qovurilgan mol go'shti", "Bodring va pomidor", "Qarsildoq chipslar", "Oq sarimsoqli sous", "Muzdek ayron"],
      menu: [
        { name: "Mol go'shtli Lavash + Ayron", portion: "Set", price: 25000 },
        { name: "Mini Lavash (Talaba varianti)", portion: "240 gr", price: 19000 },
        { name: "Pishloqli Tovuq Lavash", portion: "330 gr", price: 24000 },
        { name: "Hot-Dog klassik", portion: "220 gr", price: 13000 },
        { name: "Kartoshka fri + ketchup", portion: "130 gr", price: 10000 }
      ]
    },
    {
      placePrefix: ["Doner Box Talaba", "Tashkent Burger Lab", "Rayhon FastFood", "Oqshom Doner Express", "Farhod Street Food", "TTZ FastFood Uyi"],
      dishName: "Talaba Kombo: Double Hot-Dog + Fri + Razliv Ichimlik",
      basePrice: 22000,
      portion: "420 gr",
      // Burger, hot-dog va fri rasmi
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Bulochka", "2 dona sosiska", "Pishloq sousi", "Koreyscha sabzi", "Kartoshka fri", "Pepsi 0.3"],
      menu: [
        { name: "Double Hot-Dog + Fri + Ichimlik", portion: "Kombo", price: 22000 },
        { name: "Klassik Chizburger", portion: "260 gr", price: 24000 },
        { name: "Shaurma (non ichida go'shtli)", portion: "320 gr", price: 23000 },
        { name: "Non-kabob (tandir non ichida)", portion: "340 gr", price: 26000 },
        { name: "Muzdek ayron / Cola", portion: "300 ml", price: 5000 }
      ]
    }
  ],

  // 4. SUYUQ OVQAT — Faqat cho'zma lag'mon, sho'rva va mastava rasmlari
  suyuq: [
    {
      placePrefix: ["Anjir Lag'mon Uyi", "Chorsu Cho'zma Lag'monxona", "Kafe Sharq Lag'mon", "Qashqar Cho'zma Lag'mon", "Farhod Bozori Lag'monxona", "Vodiy Cho'zma Lag'mon"],
      dishName: "Qo'lda cho'zilgan Uyg'ur lag'mon (0.8 porsiya + non)",
      basePrice: 23000,
      portion: "420 gr",
      // Haqiqiy cho'zma lag'mon rasmi (qizil go'shtli va sabzavotli qaylasi bilan)
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Qo'lda cho'zilgan xamir", "Mol go'shti", "Bulg'or qalampiri", "Jandiq va selderey", "Laza achchiq sous", "Yopgan non"],
      menu: [
        { name: "Uyg'ur cho'zma lag'mon (0.8 porsiya)", portion: "420 gr", price: 23000 },
        { name: "Uyg'ur cho'zma lag'mon (To'liq)", portion: "520 gr", price: 28000 },
        { name: "Qovurma lag'mon (Tsomyan)", portion: "380 gr", price: 27000 },
        { name: "Mastava (qatiq bilan)", portion: "400 gr", price: 18000 },
        { name: "Issiq ko'za sho'rva", portion: "420 gr", price: 25000 }
      ]
    },
    {
      placePrefix: ["Dilkash Sho'rvaxona", "Mastava & Sho'rva Markazi", "Samarqand Chuchvara Uyi", "Milliy Kosa Taomlar", "Buvijon Sho'rvasi", "Halol Suyuq Ovqatlar"],
      dishName: "Go'shtli Chuchvara / Sho'rva + Issiq Non + Qatiq",
      basePrice: 19000,
      portion: "400 gr",
      // Qaynoq sho'rva va chuchvara kosasi rasmi
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Mayda go'shtli chuchvara", "Shaffof mol bulyoni", "Ko'katlar", "Qatiq / suzma", "Yopgan issiq non"],
      menu: [
        { name: "Go'shtli chuchvara sho'rva", portion: "400 gr", price: 19000 },
        { name: "Qovurma chuchvara + sous", portion: "320 gr", price: 22000 },
        { name: "Turkcha qizil yasmiq sho'rva", portion: "380 gr", price: 16000 },
        { name: "Noxat sho'rak (go'shtli)", portion: "420 gr", price: 21000 },
        { name: "Moshxo'rda (uy uslubida)", portion: "400 gr", price: 18000 }
      ]
    }
  ],

  // 5. KECHKI OVQAT — Faqat mangalda pishgan shashlik va qozon kabob rasmlari
  kechki: [
    {
      placePrefix: ["G'ijduvon Shashlik Uyi (Ko'kcha)", "Besh Shashlik Chilonzor", "Risoviy Shashlik Rastasi", "Farhod Bozori Kabobxona", "Oqshom Shashlik Markazi", "Parkent Shashlik Rastasi"],
      dishName: "Shashlik Set (2 six qiyma kabob + piyoz + non + choy)",
      basePrice: 28000,
      portion: "2 six + non",
      // Cho'g'da pishgan haqiqiy shashlik sixlari rasmi
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
      ingredients: ["2 six G'ijduvon qiyma shashlik", "Sirkalangan oq piyoz", "Pomidor-bodring", "Yarimta issiq non", "Qora/ko'k choy"],
      menu: [
        { name: "Shashlik Set (2 six qiyma + non + choy)", portion: "Set", price: 28000 },
        { name: "G'ijduvon qiyma shashlik (1 six)", portion: "95 gr", price: 12000 },
        { name: "Tovuq qanot shashlik (1 six)", portion: "120 gr", price: 13000 },
        { name: "Jigar kabob charvi bilan (1 six)", portion: "100 gr", price: 12000 },
        { name: "Kuska mol go'shti kabob (1 six)", portion: "100 gr", price: 16000 }
      ]
    },
    {
      placePrefix: ["Samarqand Qozon Kabob", "Chorsu Norin Markazi", "Toshkent Kechki Qozon Taomlari", "Vodiy Qozon Kabob", "Ziyo Kechki Ovqat", "Do'stlik Qozon Kabob"],
      dishName: "Kechki Qozon kabob (qovurilgan go'sht va kartoshka)",
      basePrice: 32000,
      portion: "360 gr",
      // Qozonda qovurilgan go'sht va kartoshka kabob rasmi
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Yumshoq mol go'shti", "Qizargan kartoshka", "Zira va piyoz", "Yopgan non", "Choynak choy"],
      menu: [
        { name: "Qozon kabob (Talaba porsiya)", portion: "360 gr", price: 32000 },
        { name: "Toshkentcha Norin + bulyon", portion: "320 gr", price: 26000 },
        { name: "Bifshteks (2 tuxum + pyure)", portion: "380 gr", price: 27000 },
        { name: "Tovuqli Tabaka (0.5 porsiya)", portion: "330 gr", price: 29000 },
        { name: "Muzdek ayron", portion: "250 ml", price: 4000 }
      ]
    }
  ],

  // 6. TUSHLIK (KOMBO) — Haqiqiy to'la tushlik kompleksi (sho'rva + 2-taom + salat + non)
  kombo: [
    {
      placePrefix: ["Stolovaya №1 (Talabalar shaharchasi)", "Ziyo Talaba Bistro", "Universitet Kampus Oshxonasi", "Integro Hamyonbop Tushlik", "Baraka Milliy Bistro", "Bodomzor Lunch Cafe"],
      dishName: "Talaba Kombo #1 (Mastava + Bifshteks + Kompot)",
      basePrice: 23000,
      portion: "To'liq set (3 xil)",
      // To'liq issiq tushlik majmuasi rasmi
      image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Yarim kosa mastava", "Mol go'shtli bifshteks", "Tuxum va garnir (grechka/pyure)", "1ta non", "Mevali kompot"],
      menu: [
        { name: "Kombo #1: Mastava + Bifshteks + Kompot", portion: "To'liq set", price: 23000 },
        { name: "Kombo #2: Tovuq sho'rva + Kotlet + Non", portion: "To'liq set", price: 21000 },
        { name: "Kombo #3: Yasmiq sho'rva + Gulyash + Salat", portion: "To'liq set", price: 25000 },
        { name: "Pyure yoki Grechka garnir", portion: "200 gr", price: 7000 },
        { name: "Uy mevali kompoti", portion: "250 ml", price: 3000 }
      ]
    },
    {
      placePrefix: ["Ishonch Milliy Tushlik", "Do'stlik Metro Bufeti", "Fayz Ekonomi Bistro", "Tezkor Tushlik Uyi", "Kadisheva Stolovaya", "Sergeli Talaba Bistro"],
      dishName: "Ekonom Tushlik Set (Sho'rva + Teftel + Salat + Non)",
      basePrice: 20000,
      portion: "To'liq set (550 gr)",
      // To'liq arzon tushlik seti rasmi
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
      ingredients: ["Qaynatma sho'rva (0.5)", "2 dona go'shtli teftel", "Guruch garnir", "Karam salati", "Issiq non va choy"],
      menu: [
        { name: "Ekonom Tushlik Set (3 xil taom)", portion: "550 gr", price: 20000 },
        { name: "Kiyev kotleti + Pyure + Salat", portion: "380 gr", price: 22000 },
        { name: "Makaron po-flotski (go'shtli)", portion: "350 gr", price: 17000 },
        { name: "Olivye yangi salati", portion: "150 gr", price: 7000 },
        { name: "Choynak choy + non", portion: "1 set", price: 3000 }
      ]
    }
  ]
};

const STUDENT_PERK_POOL = [
  ["Talaba ID bilan -10%", "Non va choy tekin", "Click / Payme bor"],
  ["Tezkor xizmat (5 daq)", "Katta porsiya", "Halol 100%"],
  ["Choynak choy bepul", "Wi-Fi bor", "Karta / QR to'lov"],
  ["2-taomga chegirma", "Salat qo'shib beriladi", "23:00 gacha ochiq"],
  ["Talabalar sevimli joyi", "Issiq tandir non", "Olib ketishga qulay"]
];

const WORKING_HOURS_POOL = [
  "07:30 - 21:30",
  "08:00 - 22:00",
  "08:30 - 23:00",
  "07:00 - 22:30",
  "09:00 - 23:30",
  "24/7 (Tun-u kun)"
];

// Deterministik generator — 216 ta realistik Toshkent nuqtalarini shakllantirish
function generateTashkentPlaces() {
  const places = [];
  const categoryKeys = ['osh', 'kombo', 'fastfood', 'somsa', 'suyuq', 'kechki'];
  const categoryLabels = {
    osh: 'Osh',
    kombo: 'Tushlik (kombo)',
    fastfood: 'Fast food',
    somsa: 'Somsa',
    suyuq: 'Suyuq ovqat',
    kechki: 'Kechki ovqat'
  };

  let idCounter = 1;

  for (let round = 0; round < 4; round++) {
    for (let dIdx = 0; dIdx < DISTRICT_HUBS.length; dIdx++) {
      const districtObj = DISTRICT_HUBS[dIdx];
      for (let hIdx = 0; hIdx < districtObj.hubs.length; hIdx++) {
        if (places.length >= 216) break;

        const hub = districtObj.hubs[hIdx];
        const catKey = categoryKeys[(idCounter + round + hIdx) % categoryKeys.length];
        const templates = DISH_TEMPLATES[catKey];
        const template = templates[(idCounter + dIdx + round) % templates.length];

        const prefixList = template.placePrefix;
        const basePlaceName = prefixList[(idCounter + hIdx + round) % prefixList.length];
        const branchSuffix = round > 0 ? ` (${districtObj.district})` : '';

        // Narx: 18 000 - 32 000 so'm oralig'ida aniq talabalar narxlari
        const priceOffsets = [-2000, -1000, 0, 1000, 2000];
        const offset = priceOffsets[(idCounter * 3 + dIdx) % priceOffsets.length];
        const rawPrice = Math.max(16000, Math.min(38000, template.basePrice + offset));
        const price = Math.round(rawPrice / 1000) * 1000;
        const oldPrice = price + 4000;

        // Mo'ljal atrofida aniq koordinatalar
        const angle = ((idCounter * 53) % 360) * (Math.PI / 180);
        const radiusDeg = 0.0008 + ((idCounter * 17) % 24) * 0.0001;
        const lat = Number((hub.lat + Math.sin(angle) * radiusDeg).toFixed(6));
        const lng = Number((hub.lng + Math.cos(angle) * radiusDeg).toFixed(6));

        const houseNum = 3 + ((idCounter * 7) % 96);
        const rating = Number((4.5 + ((idCounter * 11) % 5) * 0.1).toFixed(1));
        const reviewsCount = 35 + ((idCounter * 23) % 280);

        // HAR BIR TAOMGA O'ZINING HAQIQIY RASMI!
        const image = template.image;
        const perks = STUDENT_PERK_POOL[idCounter % STUDENT_PERK_POOL.length];
        const workingHours = WORKING_HOURS_POOL[idCounter % WORKING_HOURS_POOL.length];

        const phoneCode = ['90', '91', '93', '94', '97', '99', '71'][idCounter % 7];
        const p1 = String(100 + ((idCounter * 37) % 899));
        const p2 = String(10 + ((idCounter * 19) % 89));
        const p3 = String(10 + ((idCounter * 41) % 89));
        const phone = `+998 ${phoneCode} ${p1}-${p2}-${p3}`;

        const customizedMenu = template.menu.map((item, idx) => ({
          ...item,
          price: idx === 0 ? price : Math.max(3000, item.price + (idx % 2 === 0 ? 0 : 1000))
        }));

        places.push({
          id: idCounter,
          name: `${basePlaceName}${branchSuffix}`,
          dishName: template.dishName,
          category: catKey,
          categoryLabel: categoryLabels[catKey],
          price,
          oldPrice,
          district: districtObj.district,
          landmark: hub.landmark,
          address: `${districtObj.district} tumani, ${hub.street}, ${houseNum}-uy`,
          lat,
          lng,
          rating,
          reviewsCount,
          workingHours,
          phone,
          image,
          portion: template.portion,
          studentPerks: perks,
          ingredients: template.ingredients,
          menu: customizedMenu
        });

        idCounter++;
      }
    }
  }

  return places;
}

export const PLACES_DATA = generateTashkentPlaces();
export default PLACES_DATA;
