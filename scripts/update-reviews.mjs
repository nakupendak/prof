import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');

function getPluralReviews(count) {
  const num = Math.abs(Number(count));
  const n = num % 100;
  const n1 = num % 10;

  if (n > 10 && n < 20) {
    return `${num} отзывов`;
  }
  if (n1 > 1 && n1 < 5) {
    return `${num} отзыва`;
  }
  if (n1 === 1) {
    return `${num} отзыв`;
  }
  return `${num} отзывов`;
}

async function fetchYandexData() {
  try {
    const url = 'https://yandex.ru/maps/org/19250466593/reviews/';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const ogDescMatch = html.match(/<meta\s+property=[\"']og:description[\"']\s+content=[\"']([^\"']+)[\"']/i);
    const ogDesc = ogDescMatch ? ogDescMatch[1] : '';

    const ratingRaw = ogDesc.match(/Рейтинг\s+([0-9\.,]+)/i)?.[1];
    const countRaw = ogDesc.match(/на основе\s+([0-9]+)\s+оценок/i)?.[1] || ogDesc.match(/на основе\s+([0-9]+)\s+отзыв/i)?.[1];

    if (!ratingRaw || !countRaw) {
      console.warn('Yandex metadata parsing yielded empty result:', { ogDesc });
      return null;
    }

    const rating = ratingRaw.replace('.', ',');
    const count = parseInt(countRaw, 10);

    return { rating, count };
  } catch (error) {
    console.error('Failed to fetch Yandex data:', error.message);
    return null;
  }
}

async function fetch2GisData() {
  try {
    const url = 'https://2gis.ru/perm/firm/70000001036116202/tab/reviews';
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const metaDescMatch = html.match(/<meta\s+name=[\"']description[\"']\s+content=[\"']([^\"']+)[\"']/i) ||
                          html.match(/<meta\s+property=[\"']og:description[\"']\s+content=[\"']([^\"']+)[\"']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1] : '';

    const ratingRaw = metaDesc.match(/Рейтинг\s+([0-9\.,]+)/i)?.[1];
    const countRaw = metaDesc.match(/на основе\s+([0-9]+)\s+оценок/i)?.[1] || metaDesc.match(/([0-9]+)\s+отзыв/i)?.[1];

    if (!ratingRaw || !countRaw) {
      console.warn('2GIS metadata parsing yielded empty result:', { metaDesc });
      return null;
    }

    const rating = ratingRaw.replace('.', ',');
    const count = parseInt(countRaw, 10);

    return { rating, count };
  } catch (error) {
    console.error('Failed to fetch 2GIS data:', error.message);
    return null;
  }
}

function updateCardInHtml(html, cardSource, data) {
  if (!data) return html;

  const cardRegex = new RegExp(`(<article[^>]*data-review-card="${cardSource}"[\\s\\S]*?<\\/article>)`, 'i');
  const cardMatch = html.match(cardRegex);

  if (!cardMatch) {
    console.warn(`Card block data-review-card="${cardSource}" not found in HTML`);
    return html;
  }

  let cardBlock = cardMatch[1];

  // Update rating
  cardBlock = cardBlock.replace(
    /(<strong[^>]*data-review-rating[^>]*>)[^<]*(<\/strong>)/i,
    `$1${data.rating}$2`
  );

  // Update stars aria-label
  cardBlock = cardBlock.replace(
    /(<div[^>]*data-review-stars[^>]*aria-label=")[^"]*(")/i,
    `$1Оценка ${data.rating} из 5$2`
  );

  // Update review count
  const countText = getPluralReviews(data.count);
  cardBlock = cardBlock.replace(
    /(<p[^>]*data-review-count[^>]*>)[^<]*(<\/p>)/i,
    `$1${countText}$2`
  );

  return html.replace(cardMatch[1], cardBlock);
}

async function main() {
  console.log('Fetching live reviews & ratings data...');
  const [yandexData, gisData] = await Promise.all([
    fetchYandexData(),
    fetch2GisData()
  ]);

  console.log('Fetched Yandex:', yandexData);
  console.log('Fetched 2GIS:', gisData);

  if (!yandexData && !gisData) {
    console.log('No data fetched for both services. Skipping HTML update.');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf8');
  let updatedHtml = html;

  if (yandexData) {
    updatedHtml = updateCardInHtml(updatedHtml, 'yandex', yandexData);
  }

  if (gisData) {
    updatedHtml = updateCardInHtml(updatedHtml, '2gis', gisData);
  }

  if (html !== updatedHtml) {
    fs.writeFileSync(indexPath, updatedHtml, 'utf8');
    console.log('Successfully updated index.html with live ratings and review counts!');
  } else {
    console.log('index.html is already up to date.');
  }
}

main().catch((err) => {
  console.error('Fatal error in update-reviews script:', err);
  process.exit(1);
});
