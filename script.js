'use strict';

const TMDB_KEY = '163344463f871a6784d27ef79284ac7b';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const RAWG_KEY = '0b6e15e577f04becb4880db44505f2b4';

const MOOD_MAP = {
  happy: {
    label: 'Feliz',
    movies:  { genres: '35|10751|16', sort: 'popularity.desc' },
    series:  { genres: '35|10751|16', sort: 'popularity.desc' },
    music:   { term: 'Bad Bunny Karol G pop 2024' },
    books:   { subject: 'humor' },
    games:   { genres: 'arcade,platformer', ordering: '-rating' },
    comics:  { character: 'spider-man' },
    anime:   { genres: '4,36', order_by: 'score' },
    recipes: { category: 'Dessert' },
    podcasts:{ term: 'comedy humor podcast' },
  },
  sad: {
    label: 'Triste',
    movies:  { genres: '18|10749', sort: 'vote_average.desc' },
    series:  { genres: '18|10749', sort: 'vote_average.desc' },
    music:   { term: 'Billie Eilish Olivia Rodrigo sad' },
    books:   { subject: 'literary fiction' },
    games:   { genres: 'indie,adventure', ordering: '-rating' },
    comics:  { character: 'wolverine' },
    anime:   { genres: '8,7', order_by: 'score' },
    recipes: { category: 'Pasta' },
    podcasts:{ term: 'storytelling narrativa podcast' },
  },
  angry: {
    label: 'Intenso',
    movies:  { genres: '28|80|53', sort: 'popularity.desc' },
    series:  { genres: '28|80|53', sort: 'popularity.desc' },
    music:   { term: 'Travis Scott Kendrick Lamar rap 2024' },
    books:   { subject: 'thriller' },
    games:   { genres: 'action,shooter', ordering: '-rating' },
    comics:  { character: 'punisher' },
    anime:   { genres: '1,17', order_by: 'score' },
    recipes: { category: 'Beef' },
    podcasts:{ term: 'true crime misterio investigacion podcast' },
  },
  scared: {
    label: 'Inquieto',
    movies:  { genres: '27|9648|53', sort: 'popularity.desc' },
    series:  { genres: '27|9648', sort: 'popularity.desc' },
    music:   { term: 'The Weeknd dark thriller night' },
    books:   { subject: 'horror' },
    games:   { genres: 'horror,survival', ordering: '-rating' },
    comics:  { character: 'ghost rider' },
    anime:   { genres: '14,7', order_by: 'score' },
    recipes: { category: 'Chicken' },
    podcasts:{ term: 'terror horror paranormal podcast' },
  },
  chill: {
    label: 'Chill',
    movies:  { genres: '35|18|12', sort: 'popularity.desc' },
    series:  { genres: '35|18|10751', sort: 'popularity.desc' },
    music:   { term: 'indie pop lofi chill 2024' },
    books:   { subject: 'travel' },
    games:   { genres: 'puzzle,casual', ordering: '-rating' },
    comics:  { character: 'groot' },
    anime:   { genres: '36,22', order_by: 'score' },
    recipes: { category: 'Vegetarian' },
    podcasts:{ term: 'meditacion bienestar relajacion podcast' },
  },
  romantic: {
    label: 'Romántico',
    movies:  { genres: '10749|18|35', sort: 'popularity.desc' },
    series:  { genres: '10749|18', sort: 'popularity.desc' },
    music:   { term: 'romantic love songs ballads 2024' },
    books:   { subject: 'romance' },
    games:   { genres: 'indie,adventure', ordering: '-rating' },
    comics:  { character: 'scarlet witch' },
    anime:   { genres: '22,13', order_by: 'score' },
    recipes: { category: 'Seafood' },
    podcasts:{ term: 'amor relaciones pareja romance podcast' },
  },
};

const CAT_META = {
  movies:  { label: 'Película',    emoji: '🎬', square: false },
  series:  { label: 'Serie',       emoji: '📺', square: false },
  music:   { label: 'Canción',     emoji: '🎵', square: true  },
  books:   { label: 'Libro',       emoji: '📚', square: false },
  games:   { label: 'Videojuego',  emoji: '🎮', square: true  },
  comics:  { label: 'Cómic',       emoji: '🎭', square: false },
  anime:   { label: 'Anime',       emoji: '📺', square: false },
  recipes: { label: 'Receta',      emoji: '🍽️', square: true  },
  podcasts:{ label: 'Podcast',     emoji: '🎙️', square: true  },
};

let currentMood = null;
let currentPage = 1;
let currentResults = [];
let isLoading = false;

const body           = document.body;
const moodBtns       = document.querySelectorAll('.mood-btn');
const discoverBtn    = document.getElementById('discoverBtn');
const btnText        = discoverBtn.querySelector('.btn-text');
const categorySelect = document.getElementById('categorySelect');
const resultsRange   = document.getElementById('resultsRange');
const rangeVal       = document.getElementById('rangeVal');
const loadingState   = document.getElementById('loadingState');
const errorState     = document.getElementById('errorState');
const errorText      = document.getElementById('errorText');
const cardsGrid      = document.getElementById('cardsGrid');
const resultsHeader  = document.getElementById('resultsHeader');
const resultsTitle   = document.getElementById('resultsTitle');
const resultsSub     = document.getElementById('resultsSubtitle');
const loadMoreWrap   = document.getElementById('loadMoreWrap');
const loadMoreBtn    = document.getElementById('loadMoreBtn');
const modalOverlay   = document.getElementById('modalOverlay');
const modalContent   = document.getElementById('modalContent');
const modalClose     = document.getElementById('modalClose');

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
    btnText.textContent = `Descubrir · ${MOOD_MAP[mood].label}`;
    document.getElementById('filtersSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

resultsRange.addEventListener('input', () => {
  rangeVal.textContent = resultsRange.value;
  updateRangeGradient();
});

function updateRangeGradient() {
  const pct = ((+resultsRange.value - +resultsRange.min) / (+resultsRange.max - +resultsRange.min)) * 100;
  const color = getComputedStyle(body).getPropertyValue('--mood-primary').trim();
  resultsRange.style.background = `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
}

categorySelect.addEventListener('change', () => {
  if (currentMood) btnText.textContent = `Descubrir · ${MOOD_MAP[currentMood].label}`;
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

  const cat    = categorySelect.value;
  const limit  = +resultsRange.value;
  const query  = document.getElementById('searchQuery').value.trim();
  const sortBy = document.querySelector('input[name="sortBy"]:checked').value;

  showLoading(true);
  hideError();

  try {
    let items = [];

    if      (cat === 'movies')   items = await fetchMovies(query, sortBy, limit);
    else if (cat === 'series')   items = await fetchSeries(query, sortBy, limit);
    else if (cat === 'music')    items = await fetchMusic(query, limit);
    else if (cat === 'books')    items = await fetchBooks(query, limit);
    else if (cat === 'games')    items = await fetchGames(query, sortBy, limit);
    else if (cat === 'comics')   items = await fetchComics(query, limit);
    else if (cat === 'anime')    items = await fetchAnime(query, sortBy, limit);
    else if (cat === 'recipes')  items = await fetchRecipes(query, limit);
    else if (cat === 'podcasts') items = await fetchPodcasts(query, limit);

    if (!items || items.length === 0)
      throw new Error('Sin resultados. Prueba otro mood o cambia los filtros.');

    currentResults = append ? [...currentResults, ...items] : items;
    renderCards(items, append, cat);

    resultsHeader.style.display = 'block';
    resultsTitle.textContent = `${MOOD_MAP[currentMood].label} · ${CAT_META[cat].label}`;
    resultsSub.textContent   = `${currentResults.length} recomendaciones encontradas`;
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

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status} al conectar con la API.`);
  return res.json();
}

async function fetchMovies(query, sortBy, limit) {
  const cfg = MOOD_MAP[currentMood].movies;
  const sortMap = { popularity: 'popularity.desc', rating: 'vote_average.desc', newest: 'release_date.desc' };
  const sort = sortMap[sortBy] || cfg.sort;
  const url = query
    ? `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${enc(query)}&page=${currentPage}&language=es-MX`
    : `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${enc(cfg.genres)}&sort_by=${sort}&vote_count.gte=20&page=${currentPage}&language=es-MX`;
  const data = await apiFetch(url);
  return (data.results || []).slice(0, limit).map(m => ({
    id: m.id, title: m.title,
    year: m.release_date?.slice(0, 4) || '—',
    rating: m.vote_average ? m.vote_average.toFixed(1) : '—',
    img: m.poster_path ? TMDB_IMG + m.poster_path : null,
    overview: m.overview || 'Sin descripción.',
    type: 'movies', link: `https://www.themoviedb.org/movie/${m.id}`,
    tags: [],
  }));
}

async function fetchSeries(query, sortBy, limit) {
  const cfg = MOOD_MAP[currentMood].series;
  const sortMap = { popularity: 'popularity.desc', rating: 'vote_average.desc', newest: 'first_air_date.desc' };
  const sort = sortMap[sortBy] || cfg.sort;
  const url = query
    ? `${TMDB_BASE}/search/tv?api_key=${TMDB_KEY}&query=${enc(query)}&page=${currentPage}&language=es-MX`
    : `${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=${enc(cfg.genres)}&sort_by=${sort}&vote_count.gte=20&page=${currentPage}&language=es-MX`;
  const data = await apiFetch(url);
  return (data.results || []).slice(0, limit).map(s => ({
    id: s.id, title: s.name,
    year: s.first_air_date?.slice(0, 4) || '—',
    rating: s.vote_average ? s.vote_average.toFixed(1) : '—',
    img: s.poster_path ? TMDB_IMG + s.poster_path : null,
    overview: s.overview || 'Sin descripción.',
    type: 'series', link: `https://www.themoviedb.org/tv/${s.id}`,
    tags: [],
  }));
}

async function fetchMusic(query, limit) {
  const term = query || MOOD_MAP[currentMood].music.term;
  const url = `https://itunes.apple.com/search?term=${enc(term)}&media=music&entity=song&limit=${limit * 2}`;
  const data = await apiFetch(url);
  return (data.results || [])
    .filter(t => t.artworkUrl100 && t.trackName && t.artistName)
    .slice(0, limit)
    .map(t => ({
      id: t.trackId, title: t.trackName,
      year: t.releaseDate?.slice(0, 4) || '—',
      rating: null,
      img: t.artworkUrl100.replace('100x100bb', '600x600bb'),
      overview: `${t.artistName} · ${t.collectionName || ''} · ${t.primaryGenreName || ''}`,
      type: 'music', link: t.trackViewUrl,
      preview: t.previewUrl, artist: t.artistName,
      album: t.collectionName, tags: [t.primaryGenreName],
    }));
}

async function fetchBooks(query, limit) {
  const subject = query || MOOD_MAP[currentMood].books.subject;
  const url = `https://openlibrary.org/search.json?q=${enc(subject)}&limit=${limit}&page=${currentPage}&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,number_of_pages_median`;
  const data = await apiFetch(url);
  return (data.docs || []).slice(0, limit).map(b => ({
    id: b.key, title: b.title,
    year: b.first_publish_year || '—',
    rating: b.ratings_average ? (+b.ratings_average).toFixed(1) : '—',
    img: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
    overview: `Autor: ${(b.author_name || ['Desconocido']).join(', ')}${b.number_of_pages_median ? ` · ${b.number_of_pages_median} págs.` : ''}`,
    type: 'books', link: `https://openlibrary.org${b.key}`,
    author: (b.author_name || []).join(', '), tags: [],
  }));
}

async function fetchGames(query, sortBy, limit) {
  const cfg = MOOD_MAP[currentMood].games;
  const sortMap = { popularity: '-added', rating: '-rating', newest: '-released' };
  const ordering = sortMap[sortBy] || cfg.ordering;
  const url = query
    ? `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${enc(query)}&page=${currentPage}&page_size=${limit}`
    : `https://api.rawg.io/api/games?key=${RAWG_KEY}&genres=${enc(cfg.genres)}&ordering=${ordering}&page=${currentPage}&page_size=${limit}`;
  const data = await apiFetch(url);
  return (data.results || []).slice(0, limit).map(g => ({
    id: g.id, title: g.name,
    year: g.released?.slice(0, 4) || '—',
    rating: g.rating ? g.rating.toFixed(1) : '—',
    img: g.background_image || null,
    overview: `Plataformas: ${(g.platforms || []).map(p => p.platform.name).slice(0, 3).join(', ') || '—'}`,
    type: 'games', link: `https://rawg.io/games/${g.slug}`,
    tags: (g.genres || []).map(x => x.name),
  }));
}

async function fetchComics(query, limit) {
  const cfg = MOOD_MAP[currentMood].comics;
  const character = query || cfg.character;
  const apikey = '4c07133ae90c12dded1f41d4a0db6ddf';
  const charUrl = `https://gateway.marvel.com/v1/public/characters?name=${enc(character)}&apikey=${apikey}`;
  const charData = await apiFetch(charUrl);
  const charId = charData?.data?.results?.[0]?.id;
  const url = charId
    ? `https://gateway.marvel.com/v1/public/characters/${charId}/comics?apikey=${apikey}&limit=${limit}&offset=${(currentPage - 1) * limit}&orderBy=-onsaleDate`
    : `https://gateway.marvel.com/v1/public/comics?apikey=${apikey}&limit=${limit}&offset=${(currentPage - 1) * limit}&orderBy=-onsaleDate`;
  const data = await apiFetch(url);
  return (data?.data?.results || []).slice(0, limit).map(c => {
    const thumb = c.thumbnail;
    const img = (thumb && thumb.path && !thumb.path.includes('image_not_available'))
      ? `${thumb.path}.${thumb.extension}` : null;
    return {
      id: c.id, title: c.title,
      year: c.dates?.find(d => d.type === 'onsaleDate')?.date?.slice(0, 4) || '—',
      rating: null, img,
      overview: c.description || `${c.pageCount || '?'} páginas · ${(c.creators?.items || []).slice(0, 2).map(x => x.name).join(', ') || ''}`,
      type: 'comics', link: c.urls?.find(u => u.type === 'detail')?.url || 'https://marvel.com',
      tags: (c.characters?.items || []).slice(0, 3).map(x => x.name),
    };
  });
}

async function fetchAnime(query, sortBy, limit) {
  const cfg = MOOD_MAP[currentMood].anime;
  const sortMap = { popularity: 'popularity', rating: 'score', newest: 'start_date' };
  const order_by = sortMap[sortBy] || cfg.order_by;
  const url = query
    ? `https://api.jikan.moe/v4/anime?q=${enc(query)}&limit=${limit}&page=${currentPage}&sfw=true`
    : `https://api.jikan.moe/v4/anime?genres=${cfg.genres}&order_by=${order_by}&sort=desc&limit=${limit}&page=${currentPage}&sfw=true`;
  const data = await apiFetch(url);
  return (data.data || []).slice(0, limit).map(a => ({
    id: a.mal_id, title: a.title,
    year: a.aired?.from?.slice(0, 4) || '—',
    rating: a.score ? a.score.toFixed(1) : '—',
    img: a.images?.jpg?.image_url || null,
    overview: a.synopsis ? a.synopsis.substring(0, 200) + '...' : 'Sin descripción.',
    type: 'anime', link: a.url || `https://myanimelist.net/anime/${a.mal_id}`,
    tags: (a.genres || []).map(g => g.name),
  }));
}

async function fetchRecipes(query, limit) {
  const cfg = MOOD_MAP[currentMood].recipes;
  const url = query
    ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${enc(query)}`
    : `https://www.themealdb.com/api/json/v1/1/filter.php?c=${enc(cfg.category)}`;
  const data = await apiFetch(url);
  let meals = (data.meals || []).slice(0, limit);
  if (!query && meals.length > 0 && !meals[0].strInstructions) {
    meals = await Promise.all(
      meals.slice(0, limit).map(m =>
        apiFetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`)
          .then(d => d.meals?.[0] || m).catch(() => m)
      )
    );
  }
  return meals.map(m => ({
    id: m.idMeal, title: m.strMeal,
    year: m.strArea || '—', rating: null,
    img: m.strMealThumb || null,
    overview: m.strInstructions
      ? m.strInstructions.substring(0, 200) + '...'
      : `Cocina: ${m.strArea || '—'} · Categoría: ${m.strCategory || '—'}`,
    type: 'recipes',
    link: m.strSource || m.strYoutube || `https://www.themealdb.com/meal/${m.idMeal}`,
    tags: [m.strCategory, m.strArea].filter(Boolean),
  }));
}

async function fetchPodcasts(query, limit) {
  const term = query || MOOD_MAP[currentMood].podcasts.term;
  const url = `https://itunes.apple.com/search?term=${enc(term)}&media=podcast&entity=podcast&limit=${limit * 2}`;
  const data = await apiFetch(url);
  return (data.results || [])
    .filter(p => p.artworkUrl600 && p.collectionName)
    .slice(0, limit)
    .map(p => ({
      id: p.collectionId, title: p.collectionName,
      year: p.releaseDate?.slice(0, 4) || '—', rating: null,
      img: p.artworkUrl600,
      overview: `${p.artistName} · ${p.primaryGenreName || ''} · ${p.trackCount || '?'} episodios`,
      type: 'podcasts', link: p.collectionViewUrl,
      tags: (p.genres || []).slice(0, 3),
    }));
}

function renderCards(items, append, cat) {
  if (!append) cardsGrid.innerHTML = '';
  const meta = CAT_META[cat] || { label: cat, emoji: '◈', square: false };

  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${i * 0.04}s`;

    const isSquare = meta.square;
    const imgHtml = item.img
      ? `<img src="${esc(item.img)}" alt="${esc(item.title)}" loading="lazy"
           style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;"
           onerror="this.parentElement.innerHTML='<div class=card-noimg>${meta.emoji}</div>'" />`
      : `<div class="card-noimg">${meta.emoji}</div>`;

    const ratingHtml = item.rating && item.rating !== '—'
      ? `<span class="card-rating text-[0.72rem] font-semibold">★ ${item.rating}</span>`
      : `<span></span>`;

    card.innerHTML = `
      <div class="card-img-wrap" style="width:100%;aspect-ratio:${isSquare ? '1/1' : '2/3'};overflow:hidden;background:rgba(255,255,255,0.04);position:relative;">
        ${imgHtml}
        <span class="card-badge">${esc(meta.label)}</span>
      </div>
      <div class="card-body" style="padding:0.9rem;">
        <div class="card-title font-display font-bold text-[0.88rem] leading-snug" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(item.title)}</div>
        <div class="card-meta flex items-center justify-between mt-1 text-[0.72rem] text-[rgba(240,240,245,0.55)]">
          <span>${esc(String(item.year))}</span>
          ${ratingHtml}
        </div>
      </div>`;

    card.addEventListener('click', () => openModal(item, meta));
    cardsGrid.appendChild(card);
  });
}

function openModal(item, meta) {
  let extraHtml = '';
  if (item.type === 'music' && item.preview) {
    extraHtml = `
      <p class="text-[rgba(240,240,245,0.55)] text-[0.88rem] mt-4"><strong>🎧 Vista previa:</strong></p>
      <audio controls style="width:100%;margin-top:0.5rem;border-radius:8px;accent-color:var(--mood-primary);">
        <source src="${esc(item.preview)}" type="audio/mpeg">
      </audio>`;
  }
  if (item.type === 'books' && item.author) {
    extraHtml = `<p class="text-[rgba(240,240,245,0.55)] text-[0.88rem]"><strong>Autor:</strong> ${esc(item.author)}</p>`;
  }

  const imgHtml = item.img
    ? `<img src="${esc(item.img)}" alt="${esc(item.title)}"
         style="width:100%;max-height:280px;object-fit:cover;border-radius:16px;margin-bottom:1.5rem;"
         onerror="this.style.display='none'" />`
    : `<div style="font-size:4rem;text-align:center;padding:2rem;">${meta.emoji}</div>`;

  const tagsHtml = (item.tags || []).filter(Boolean)
    .map(t => `<span class="modal-tag">${esc(t)}</span>`).join('');

  modalContent.innerHTML = `
    ${imgHtml}
    <div class="flex flex-wrap gap-2 mb-4">
      <span class="modal-tag">${esc(meta.label)}</span>
      ${item.year !== '—' ? `<span class="modal-tag">${esc(String(item.year))}</span>` : ''}
      ${item.rating && item.rating !== '—' ? `<span class="modal-tag">★ ${item.rating}</span>` : ''}
      ${tagsHtml}
    </div>
    <h2 class="font-display font-extrabold text-[clamp(1.2rem,3vw,1.7rem)] tracking-tight mb-2">${esc(item.title)}</h2>
    <p class="text-[rgba(240,240,245,0.55)] text-[0.88rem] leading-relaxed">${esc(item.overview)}</p>
    ${extraHtml}
    <a href="${esc(item.link)}" target="_blank" rel="noopener noreferrer" class="modal-link">Ver más →</a>`;

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
function enc(str) { return encodeURIComponent(str || ''); }
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

(function init() {
  updateRangeGradient();
})();
