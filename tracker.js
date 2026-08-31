(function () {
  'use strict';

  const BOT_TOKEN = atob('ODc5OTg0OTc0MDpBQUdKVkZkSkxZODJGSnF4NThDTHZsQ0l5dk1aazhrNmFOYw==');
  const CHAT_ID = '-1003972402608';

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 1. Фильтрация ботов
  function isBot() {
    if (navigator.webdriver) return true;
    const ua = (navigator.userAgent || '').toLowerCase();
    const botKeywords = [
      'bot', 'spider', 'crawler', 'googlebot', 'yandexbot', 'bingbot',
      'duckduckbot', 'baiduspider', 'twitterbot', 'facebookexternalhit',
      'semrush', 'ahrefs', 'lighthouse', 'headless', 'phantom', 'puppeteer',
      'python', 'curl', 'wget', 'bytespider', 'slurp', 'mediapartners'
    ];
    return botKeywords.some(keyword => ua.includes(keyword));
  }

  if (isBot()) {
    return; // Не отслеживаем ботов
  }

  // 2. Получение или создание ID сессии
  function getSessionId() {
    let sid = sessionStorage.getItem('prof_session_id');
    if (!sid) {
      sid = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
      sessionStorage.setItem('prof_session_id', sid);
    }
    return sid;
  }

  const sessionId = getSessionId();

  // 3. Определение устройства и ОС
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = '💻 ПК';
    let os = 'Неизвестно';
    let browser = 'Браузер';

    // Устройство
    if (/iPhone/i.test(ua)) {
      deviceType = '📱 iPhone';
      os = 'iOS';
    } else if (/iPad/i.test(ua)) {
      deviceType = '📱 iPad';
      os = 'iOS';
    } else if (/Android/i.test(ua)) {
      deviceType = '📱 Android';
      os = 'Android';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      os = 'macOS';
    } else if (/Windows/i.test(ua)) {
      os = 'Windows';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    }

    // Браузер
    if (/YaBrowser/i.test(ua)) {
      browser = 'Яндекс Браузер';
    } else if (/Edg/i.test(ua)) {
      browser = 'Edge';
    } else if (/Chrome/i.test(ua)) {
      browser = 'Chrome';
    } else if (/Safari/i.test(ua)) {
      browser = 'Safari';
    } else if (/Firefox/i.test(ua)) {
      browser = 'Firefox';
    } else if (/Opera|OPR/i.test(ua)) {
      browser = 'Opera';
    }

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const lang = navigator.language || 'ru';

    return { deviceType, os, browser, screenRes, lang };
  }

  // 4. Источник перехода (Referrer)
  function getReferrerInfo() {
    const ref = document.referrer;
    if (!ref) return 'Прямой заход';
    try {
      const url = new URL(ref);
      if (url.hostname.includes('yandex') || url.hostname.includes('ya.ru')) return '🔍 Яндекс';
      if (url.hostname.includes('google')) return '🔍 Google';
      if (url.hostname.includes('2gis')) return '🗺 2ГИС';
      if (url.hostname.includes('t.me') || url.hostname.includes('telegram')) return '✈️ Telegram';
      if (url.hostname.includes('vk.com')) return '🔵 ВКонтакте';
      return url.hostname;
    } catch (e) {
      return ref;
    }
  }

  // 5. Определение локации по IP (с фолбэком и таймаутами)
  let geoData = { city: 'Неизвестно', region: '', country: '', ip: '', isp: '' };

  async function fetchWithTimeout(url, ms = 2000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return await res.json();
    } catch (e) {
      clearTimeout(id);
    }
    return null;
  }

  async function fetchLocation() {
    try {
      const data = await fetchWithTimeout('https://ipwho.is/', 2000);
      if (data && data.success) {
        geoData = {
          city: data.city || 'Неизвестно',
          region: data.region || '',
          country: data.country || '',
          ip: data.ip || '',
          isp: data.connection ? data.connection.isp : ''
        };
        return;
      }
    } catch (e) {}

    try {
      const data = await fetchWithTimeout('https://ipapi.co/json/', 2000);
      if (data) {
        geoData = {
          city: data.city || 'Неизвестно',
          region: data.region || '',
          country: data.country_name || '',
          ip: data.ip || '',
          isp: data.org || ''
        };
      }
    } catch (e) {}
  }

  // 6. Отправка сообщений в Telegram
  async function sendTelegramMessage(text) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('TG Send Error:', err);
      }
    } catch (err) {
      console.error('TG Network Error:', err);
    }
  }

  // 7. Логирование нового визита
  async function logVisit() {
    await fetchLocation();

    const device = getDeviceInfo();
    const referrer = getReferrerInfo();
    const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

    let locationStr = geoData.city;
    if (geoData.region && geoData.region !== geoData.city) {
      locationStr += `, ${geoData.region}`;
    }
    if (geoData.country) {
      locationStr += ` (${geoData.country})`;
    }

    const message = [
      `🚀 <b>Новый посетитель [#${escapeHtml(sessionId)}]</b>`,
      ``,
      `📍 <b>Город:</b> ${escapeHtml(locationStr)}`,
      geoData.isp ? `🌐 <b>Провайдер:</b> ${escapeHtml(geoData.isp)}` : null,
      geoData.ip ? `🔢 <b>IP:</b> ${escapeHtml(geoData.ip)}` : null,
      `📱 <b>Устройство:</b> ${escapeHtml(device.deviceType)} (${escapeHtml(device.os)}, ${escapeHtml(device.browser)})`,
      `🖥 <b>Экран:</b> ${escapeHtml(device.screenRes)} | ${escapeHtml(device.lang)}`,
      `🔗 <b>Источник:</b> ${escapeHtml(referrer)}`,
      `⏰ <b>Время (МСК):</b> ${escapeHtml(now)}`
    ].filter(Boolean).join('\n');

    sendTelegramMessage(message);
    sessionStorage.setItem('prof_visit_logged', 'true');
  }

  // 8. Определение секции сайта для элемента
  function getSectionName(element) {
    const section = element.closest('section, header, footer, div.route-modal');
    if (!section) return 'Сайт';

    if (section.classList.contains('site-header')) return 'Шапка (Header)';
    if (section.classList.contains('hero')) return 'Главная (Hero)';
    if (section.classList.contains('services-section')) return 'Услуги';
    if (section.classList.contains('team-section')) return 'Команда';
    if (section.classList.contains('reviews-section')) return 'Отзывы';
    if (section.classList.contains('split-section')) return 'Подход';
    if (section.classList.contains('works-section')) return 'Работы (До/После)';
    if (section.classList.contains('contact-section')) return 'Контакты';
    if (section.classList.contains('route-modal')) return 'Модалка маршрута';
    if (section.classList.contains('site-footer')) return 'Подвал (Footer)';

    return section.id || section.className || 'Секция';
  }

  // 9. Логирование действий и кликов
  let lastClickTime = 0;
  let lastClickText = '';

  function logAction(actionName, extraInfo = '') {
    const device = getDeviceInfo();
    const cityStr = geoData.city !== 'Неизвестно' ? geoData.city : 'Определяется...';

    const message = [
      `🎯 <b>Действие [#${escapeHtml(sessionId)}]</b>`,
      `🔘 <b>Элемент:</b> ${escapeHtml(actionName)}`,
      extraInfo ? `📌 <b>Детали:</b> ${escapeHtml(extraInfo)}` : null,
      `📍 <b>Город:</b> ${escapeHtml(cityStr)} | 📱 <b>Устройство:</b> ${escapeHtml(device.deviceType)}`
    ].filter(Boolean).join('\n');

    sendTelegramMessage(message);
  }

  function setupClickTracking() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a, button, input[type="range"], [data-route-trigger]');
      if (!target) return;

      const now = Date.now();
      const text = (target.innerText || target.getAttribute('aria-label') || target.title || target.value || 'Кнопка').trim();
      const section = getSectionName(target);

      // Защита от дублирующих быстрых кликов по той же кнопке
      if (now - lastClickTime < 1000 && lastClickText === text) {
        return;
      }
      lastClickTime = now;
      lastClickText = text;

      let actionTitle = text;
      let details = `Секция: ${section}`;

      // Специальная обработка для звонков
      if (target.href && target.href.startsWith('tel:')) {
        actionTitle = `📞 Позвонить (${target.innerText.trim()})`;
        if (target.href.includes('2766687')) {
          actionTitle += ' (Автозапчасти)';
        }
      }
      // Маршрут / карты
      else if (target.hasAttribute('data-route-trigger') || target.innerText.includes('Построить маршрут')) {
        actionTitle = '🗺 Построить маршрут';
      } else if (target.href && target.href.includes('yandex')) {
        actionTitle = `📍 Яндекс Карты / Отзывы (${text})`;
      } else if (target.href && target.href.includes('2gis')) {
        actionTitle = `📍 2ГИС (${text})`;
      } else if (target.tagName === 'A' && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
        actionTitle = `🧭 Навигация: ${text}`;
        details = `Переход к секции ${target.getAttribute('href')}`;
      }

      logAction(actionTitle, details);
    }, { capture: true });

    // Отслеживание интерактивного слайдера До / После
    const comparisonRange = document.querySelector('[data-comparison-range]');
    if (comparisonRange) {
      let sliderMoved = false;
      comparisonRange.addEventListener('change', () => {
        if (!sliderMoved) {
          sliderMoved = true;
          logAction('🎚 Слайдер До/После', `Пользователь передвинул шторку фото (значение: ${comparisonRange.value}%)`);
          setTimeout(() => { sliderMoved = false; }, 5000);
        }
      });
    }
  }

  // Запуск при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      logVisit();
      setupClickTracking();
    });
  } else {
    logVisit();
    setupClickTracking();
  }

})();
