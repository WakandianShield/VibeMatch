'use strict';

const TMDB_KEY = '163344463f871a6784d27ef79284ac7b';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

const MOOD_MAP = {
  happy: {
    label: 'Feliz',
    movies: { genres: '35,10751,16', sort: 'popularity.desc' },
    series: { genres: '35,10751,16', sort: 'popularity.desc' },
    music: { term: 'apple music buena vibra' },
  },
  sad: {
    label: 'Triste',
    movies: { genres: '18,10749', sort: 'vote_average.desc' },
    series: { genres: '18,10749', sort: 'vote_average.desc' },
    music: { term: 'apple music melancolia' },
  },
  angry: {
    label: 'Intenso',
    movies: { genres: '28,80,53', sort: 'popularity.desc' },
    series: { genres: '28,80,53', sort: 'popularity.desc' },
    music: { term: 'apple music metal' },
  },
  scared: {
    label: 'Inquieto',
    movies: { genres: '27,9648,53', sort: 'popularity.desc' },
    series: { genres: '27,9648', sort: 'popularity.desc' },
    music: { term: 'rock' },
  },
  chill: {
    label: 'Chill',
    movies: { genres: '35|18|12', sort: 'popularity.desc' },
    series: { genres: '35|18|10751', sort: 'popularity.desc' },
    music: { term: 'apple music chill' },
  },
  romantic: {
    label: 'Romántico',
    movies: { genres: '10749,18', sort: 'popularity.desc' },
    series: { genres: '10749,18', sort: 'popularity.desc' },
    music: { term: 'romantic and love songs' },
  },
};

let currentMood = null;
let currentCategory = 'movies';
let currentPage = 1;
let currentResults = [];
let isLoading = false;

const TYPE_META = {
  movie: { label: 'Película' },
  movies: { label: 'Película' },
  tv: { label: 'Serie' },
  series: { label: 'Serie' },
  music: { label: 'Canción' },
};

function getTypeMeta(type) {
  return TYPE_META[type] || { label: 'Contenido' };
}

const body = document.body;
const moodBtns = document.querySelectorAll('.mood-btn');
const discoverBtn = document.getElementById('discoverBtn');
const btnText = discoverBtn.querySelector('.btn-text');
const categorySelect = document.getElementById('categorySelect');
const resultsRange = document.getElementById('resultsRange');
const rangeVal = document.getElementById('rangeVal');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorText = document.getElementById('errorText');
const cardsGrid = document.getElementById('cardsGrid');
const resultsHeader = document.getElementById('resultsHeader');
const resultsTitle = document.getElementById('resultsTitle');
const resultsSub = document.getElementById('resultsSubtitle');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');


moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const mood = btn.dataset.mood;
    currentMood = mood;
    currentPage = 1;

    moodBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    body.dataset.mood = mood;
    updateRangeGradient();

    discoverBtn.disabled = false;
    btnText.textContent = `Descubrir vibe ${MOOD_MAP[mood].label}`;

    document.getElementById('filtersSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

resultsRange.addEventListener('input', () => {
  rangeVal.textContent = resultsRange.value;
  updateRangeGradient();
});

function updateRangeGradient() {
  const min = +resultsRange.min;
  const max = +resultsRange.max;
  const val = +resultsRange.value;
  const pct = ((val - min) / (max - min)) * 100;
  const color = getComputedStyle(document.body).getPropertyValue('--mood-primary').trim();
  resultsRange.style.background = `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
}

categorySelect.addEventListener('change', () => {
  currentCategory = categorySelect.value;
  if (currentMood) btnText.textContent = `Descubrir · ${getCategoryLabel(currentCategory)}`;
});

discoverBtn.addEventListener('click', async () => {
  if (!currentMood || isLoading) return;
  currentPage = 1;
  currentResults = [];
  cardsGrid.innerHTML = '';
  loadMoreWrap.style.display = 'none';
  await fetchAndRender();
});

loadMoreBtn.addEventListener('click', async () => {
  currentPage++;
  await fetchAndRender(true);
});

async function fetchAndRender(append = false) {
  if (isLoading) return;
  isLoading = true;

  const category = categorySelect.value;
  const limit = +resultsRange.value;
  const queryInput = document.getElementById('searchQuery');
  const sortByInput = document.querySelector('input[name="sortBy"]:checked');

  const query = queryInput?.value?.trim() || '';
  const sortBy = sortByInput?.value || 'popularity';

  showLoading(true);
  hideError();

  try {
    let items = [];

    if (category === 'movies') {
      items = await fetchMovies({ query, sortBy, limit });
    } else if (category === 'series') {
      items = await fetchSeries({ query, sortBy, limit });
    } else if (category === 'music') {
      items = await fetchMusic({ query, limit });
    }

    if (!items || items.length === 0)
      throw new Error('No encontramos resultados. Intenta cambiar los filtros.');

    currentResults = append ? [...currentResults, ...items] : items;
    renderCards(items, append);

    resultsHeader.style.display = 'block';
    resultsTitle.textContent = `${MOOD_MAP[currentMood].label} · ${getCategoryLabel(category)}`;
    resultsSub.textContent = `${currentResults.length} recomendaciones encontradas`;
    loadMoreWrap.style.display = items.length >= limit ? 'block' : 'none';

    if (!append)
      document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showError(err.message || 'Error al cargar. Verifica tu conexión.');
    console.error(err);
  } finally {
    showLoading(false);
    isLoading = false;
  }
}

async function fetchMovies({ query, sortBy, limit }) {
  const cfg = MOOD_MAP[currentMood].movies;
  const sortMap = { popularity: 'popularity.desc', rating: 'vote_average.desc', newest: 'release_date.desc' };
  const sort = sortMap[sortBy] || cfg.sort;

  const url = query
    ? `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}&language=es-MX`
    : `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${encodeURIComponent(cfg.genres)}&sort_by=${sort}&vote_count.gte=50&page=${currentPage}&language=es-MX`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error TMDB ${res.status} — revisa que tu API key esté aprobada en themoviedb.org → Settings → API`);
  const data = await res.json();

  return data.results.slice(0, limit).map(m => ({
    id: m.id,
    title: m.title,
    year: m.release_date?.substring(0, 4) || '—',
    rating: m.vote_average ? m.vote_average.toFixed(1) : '—',
    img: m.poster_path ? TMDB_IMG + m.poster_path : null,
    overview: m.overview || 'Sin descripción disponible.',
    type: 'movie',
    link: `https://www.themoviedb.org/movie/${m.id}`,
  }));
}

async function fetchSeries({ query, sortBy, limit }) {
  const cfg = MOOD_MAP[currentMood].series;
  const sortMap = { popularity: 'popularity.desc', rating: 'vote_average.desc', newest: 'first_air_date.desc' };
  const sort = sortMap[sortBy] || cfg.sort;

  const url = query
    ? `${TMDB_BASE}/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}&language=es-MX`
    : `${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=${encodeURIComponent(cfg.genres)}&sort_by=${sort}&vote_count.gte=30&page=${currentPage}&language=es-MX`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error TMDB ${res.status} — revisa que tu API key esté aprobada en themoviedb.org → Settings → API`);
  const data = await res.json();

  return data.results.slice(0, limit).map(s => ({
    id: s.id,
    title: s.name,
    year: s.first_air_date?.substring(0, 4) || '—',
    rating: s.vote_average ? s.vote_average.toFixed(1) : '—',
    img: s.poster_path ? TMDB_IMG + s.poster_path : null,
    overview: s.overview || 'Sin descripción disponible.',
    type: 'series',
    link: `https://www.themoviedb.org/tv/${s.id}`,
  }));
}

async function fetchMusic({ query, limit }) {
  const cfg = MOOD_MAP[currentMood].music;
  const term = query || cfg.term;

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit * 2}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error iTunes ${res.status}`);
  const data = await res.json();

  return (data.results || [])
    .filter(t => t.artworkUrl100 && t.trackName && t.artistName)
    .slice(0, limit)
    .map(t => ({
      id: t.trackId,
      title: t.trackName,
      year: t.releaseDate?.substring(0, 4) || '—',
      rating: null,
      img: t.artworkUrl100.replace('100x100bb', '600x600bb'),
      overview: `${t.artistName} · ${t.collectionName || ''} · ${t.primaryGenreName || ''}`,
      type: 'music',
      link: t.trackViewUrl,
      artist: t.artistName,
      preview: t.previewUrl,
      album: t.collectionName,
      genre: t.primaryGenreName,
    }));
}

function renderCards(items, append) {
  if (!append) cardsGrid.innerHTML = '';

  items.forEach((item, i) => {
    const typeMeta = getTypeMeta(item.type);

    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${i * 0.04}s`;

    const imgHtml = item.img
      ? `<img src="${item.img}" alt="${escapeHtml(item.title)}" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=card-no-img>${typeMeta.emoji}</div>'" />`
      : `<div class="card-no-img">${typeMeta.emoji}</div>`;

    const ratingHtml = item.rating && item.rating !== '—'
      ? `<span class="card-rating">★ ${item.rating}</span>`
      : `<span></span>`;

    card.innerHTML = `
      <div class="card-img-wrap">
        ${imgHtml}
        <span class="card-badge">${typeMeta.label}</span>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-meta">
          <span>${item.year}</span>
          ${ratingHtml}
        </div>
      </div>`;

    card.addEventListener('click', () => openModal(item));
    cardsGrid.appendChild(card);
  });
}

function openModal(item) {
  const typeMeta = getTypeMeta(item.type);

  let extraInfo = '';
  if (item.type === 'music') {
    if (item.artist) extraInfo += `<p class="modal-desc"><strong>Artista:</strong> ${escapeHtml(item.artist)}</p>`;
    if (item.album) extraInfo += `<p class="modal-desc"><strong>Álbum:</strong> ${escapeHtml(item.album)}</p>`;
    if (item.preview) extraInfo += `
      <p class="modal-desc" style="margin-top:1rem;"><strong>🎧 Vista previa:</strong></p>
      <audio controls style="width:100%;margin-top:0.5rem;border-radius:8px;accent-color:var(--mood-primary);">
        <source src="${item.preview}" type="audio/mpeg">
      </audio>`;
  }

  const imgHtml = item.img
    ? `<img src="${item.img}" alt="${escapeHtml(item.title)}" class="modal-img" onerror="this.style.display='none'" />`
    : `<div style="font-size:4rem;text-align:center;padding:2rem;">${typeMeta.emoji}</div>`;

  modalContent.innerHTML = `
    ${imgHtml}
    <div class="modal-meta-row">
      <span class="modal-tag">${typeMeta.label}</span>
      ${item.year !== '—' ? `<span class="modal-tag">${item.year}</span>` : ''}
      ${item.rating && item.rating !== '—' ? `<span class="modal-tag">★ ${item.rating}</span>` : ''}
      ${item.genre ? `<span class="modal-tag">${escapeHtml(item.genre)}</span>` : ''}
    </div>
    <h2 class="modal-title">${escapeHtml(item.title)}</h2>
    <p class="modal-desc">${escapeHtml(item.overview)}</p>
    ${extraInfo}
    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="modal-link">Ver más →</a>`;

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function showLoading(show) {
  loadingState.style.display = show ? 'flex' : 'none';
  if (show) cardsGrid.innerHTML = '';
}
function hideError() { errorState.style.display = 'none'; }
function showError(msg) {
  errorState.style.display = 'block';
  errorText.textContent = msg;
  resultsHeader.style.display = 'none';
  loadMoreWrap.style.display = 'none';
}
function getCategoryLabel(cat) {
  return { movies: 'Películas', series: 'Series', music: 'Música' }[cat] || cat;
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

(function init() {
  updateRangeGradient();
  console.log('%cMoodPick 🎬🎵', 'color:#e91e8c;font-size:1.2rem;font-weight:bold;');
})();
