"use strict";

const TMDB_KEY = "163344463f871a6784d27ef79284ac7b";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const MOOD_MAP = {
  happy: {
    label: "Feliz",
    movies: { genres: "35|16|10751", sort: "popularity.desc", vote_avg: "6.5" },
    series: { genres: "35|16|10751", sort: "popularity.desc", vote_avg: "6.5" },
    music: { term: "Bad Bunny Karol G pop 2024" },
    books: { subject: "humor" },
    games: { genres: "arcade,platformer,casual", ordering: "-rating" },
    recipes: { category: "Dessert" },
    podcasts: { term: "comedy humor podcast" },
  },
  sad: {
    label: "Triste",
    movies: {
      genres: "18|10749|10402",
      sort: "vote_average.desc",
      vote_avg: "7.0",
    },
    series: { genres: "18|10749", sort: "vote_average.desc", vote_avg: "7.0" },
    music: { term: "Billie Eilish Olivia Rodrigo sad emotional" },
    books: { subject: "literary fiction" },
    games: { genres: "indie,adventure", ordering: "-rating" },
    recipes: { category: "Pasta" },
    podcasts: { term: "storytelling narrativa podcast" },
  },
  angry: {
    label: "Intenso",
    movies: { genres: "28|80|53", sort: "popularity.desc", vote_avg: "6.0" },
    series: { genres: "28|80|53", sort: "popularity.desc", vote_avg: "6.0" },
    music: { term: "Travis Scott Kendrick Lamar rap 2024" },
    books: { subject: "thriller" },
    games: { genres: "action,shooter,fighting", ordering: "-rating" },
    recipes: { category: "Beef" },
    podcasts: { term: "true crime misterio investigacion podcast" },
  },
  scared: {
    label: "Inquieto",
    movies: { genres: "27|9648|53", sort: "popularity.desc", vote_avg: "6.0" },
    series: { genres: "27|9648", sort: "popularity.desc", vote_avg: "6.0" },
    music: { term: "The Weeknd dark thriller night suspense" },
    books: { subject: "horror" },
    games: { genres: "horror,adventure,action", ordering: "-rating" },
    recipes: { category: "Chicken" },
    podcasts: { term: "terror horror paranormal podcast" },
  },
  chill: {
    label: "Chill",
    movies: { genres: "35|12|16|14", sort: "popularity.desc", vote_avg: "6.5" },
    series: { genres: "35|16|10751", sort: "popularity.desc", vote_avg: "6.5" },
    music: { term: "indie pop lofi chill 2024" },
    books: { subject: "travel" },
    games: { genres: "puzzle,casual,simulation", ordering: "-rating" },
    recipes: { category: "Vegetarian" },
    podcasts: { term: "meditacion bienestar relajacion podcast" },
  },
  romantic: {
    label: "Romántico",
    movies: { genres: "10749|18|35", sort: "popularity.desc", vote_avg: "6.5" },
    series: { genres: "10749|18", sort: "popularity.desc", vote_avg: "6.5" },
    music: { term: "romantic love songs ballads 2024" },
    books: { subject: "romance" },
    games: { genres: "indie,adventure,rpg", ordering: "-rating" },
    recipes: { category: "Seafood" },
    podcasts: { term: "amor relaciones pareja romance podcast" },
  },
};

const CAT_META = {
  movies: { label: "Película", square: false },
  series: { label: "Serie", square: false },
  music: { label: "Canción", square: true },
  books: { label: "Libro", square: false },
  games: { label: "Videojuego", square: true },
  recipes: { label: "Receta", square: true },
  podcasts: { label: "Podcast", square: true },
};

let currentMood = null;
let currentPage = 1;
let currentResults = [];
let isLoading = false;

const body = document.body;
const moodBtns = document.querySelectorAll(".mood-btn");
const discoverBtn = document.getElementById("discoverBtn");
const btnText = discoverBtn.querySelector(".btn-text");
const categorySelect = document.getElementById("categorySelect");
const resultsRange = document.getElementById("resultsRange");
const rangeVal = document.getElementById("rangeVal");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorText = document.getElementById("errorText");
const cardsGrid = document.getElementById("cardsGrid");
const resultsHeader = document.getElementById("resultsHeader");
const resultsTitle = document.getElementById("resultsTitle");
const resultsSub = document.getElementById("resultsSubtitle");
const loadMoreWrap = document.getElementById("loadMoreWrap");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

moodBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mood = btn.dataset.mood;
    currentMood = mood;
    currentPage = 1;
    moodBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    body.dataset.mood = mood;
    updateRangeGradient();
    discoverBtn.disabled = false;
    btnText.textContent = `Descubrir ${MOOD_MAP[mood].label}`;
    document
      .getElementById("filtersSection")
      .scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

resultsRange.addEventListener("input", () => {
  rangeVal.textContent = resultsRange.value;
  updateRangeGradient();
});

function updateRangeGradient() {
  const pct =
    ((+resultsRange.value - +resultsRange.min) /
      (+resultsRange.max - +resultsRange.min)) *
    100;
  const color = getComputedStyle(body)
    .getPropertyValue("--mood-primary")
    .trim();
  resultsRange.style.background = `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
}

categorySelect.addEventListener("change", () => {
  if (currentMood)
    btnText.textContent = `Descubrir ${MOOD_MAP[currentMood].label}`;
});

document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
  cb.addEventListener("change", () => {
    if (currentMood && currentResults.length > 0) {
      currentPage = 1;
      currentResults = [];
      cardsGrid.innerHTML = "";
      loadMoreWrap.style.display = "none";
      fetchAndRender();
    }
  });
});

discoverBtn.addEventListener("click", async () => {
  if (!currentMood || isLoading) return;
  currentPage = 1;
  currentResults = [];
  cardsGrid.innerHTML = "";
  loadMoreWrap.style.display = "none";
  await fetchAndRender();
});

loadMoreBtn.addEventListener("click", async () => {
  currentPage++;
  await fetchAndRender(true);
});

function getFilterOptions() {
  return {
    includeAdult: document.getElementById("includeAdult").checked,
    includeClassic: document.getElementById("includeClassic").checked,
    includeIndie: document.getElementById("includeIndie").checked,
  };
}

async function fetchAndRender(append = false) {
  if (isLoading) return;
  isLoading = true;

  const cat = categorySelect.value;
  const limit = +resultsRange.value;
  const query = document.getElementById("searchQuery").value.trim();
  const sortBy = document.querySelector('input[name="sortBy"]:checked').value;
  const filters = getFilterOptions();

  showLoading(true);
  hideError();

  try {
    let items = [];

    if (cat === "movies")
      items = await fetchMovies(query, sortBy, limit, filters);
    else if (cat === "series")
      items = await fetchSeries(query, sortBy, limit, filters);
    else if (cat === "music") items = await fetchMusic(query, limit);
    else if (cat === "books") items = await fetchBooks(query, limit);
    else if (cat === "games")
      items = await fetchGames(query, sortBy, limit, filters);
    else if (cat === "recipes") items = await fetchRecipes(query, limit);
    else if (cat === "podcasts") items = await fetchPodcasts(query, limit);

    if (!items || items.length === 0)
      throw new Error("Sin resultados. Prueba otro mood o cambia los filtros.");

    currentResults = append ? [...currentResults, ...items] : items;
    renderCards(items, append, cat);

    resultsHeader.style.display = "block";
    resultsTitle.textContent = `${MOOD_MAP[currentMood].label} · ${CAT_META[cat].label}`;
    resultsSub.textContent = `${currentResults.length} recomendaciones encontradas`;
    loadMoreWrap.style.display = items.length >= limit ? "block" : "none";

    if (!append)
      document
        .getElementById("resultsSection")
        .scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showError(err.message || "Error al cargar. Verifica tu conexión.");
    console.error(err);
  } finally {
    showLoading(false);
    isLoading = false;
  }
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// PELICULAS
async function fetchMovies(query, sortBy, limit, filters) {
  const cfg = MOOD_MAP[currentMood].movies;
  const sortMap = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    newest: "release_date.desc",
  };
  const sort = sortMap[sortBy] || cfg.sort;

  const adult = filters.includeAdult ? "true" : "false";
  const dateQ = filters.includeClassic
    ? ""
    : `&primary_release_date.gte=${new Date().getFullYear() - 40}-01-01`;
  const voteQ = `&vote_average.gte=${cfg.vote_avg}`;

  let all = [];
  try {
    if (query) {
      for (let p = 1; all.length < limit && p <= 5; p++) {
        const d = await apiFetch(
          `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=${p}&language=es-MX&include_adult=${adult}${dateQ}`,
        );
        if (!d.results?.length) break;
        all.push(...d.results);
      }
    } else {
      for (let p = 1; all.length < limit && p <= 5; p++) {
        const d = await apiFetch(
          `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${cfg.genres}&sort_by=${sort}&vote_count.gte=50${voteQ}&page=${p}&language=es-MX&include_adult=${adult}${dateQ}`,
        );
        if (!d.results?.length) break;
        all.push(...d.results);
      }
    }

    const seen = new Set();
    return all
      .filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .slice(0, limit)
      .map((m) => ({
        id: m.id,
        title: m.title,
        year: m.release_date?.slice(0, 4) || "—",
        rating: m.vote_average ? m.vote_average.toFixed(1) : "—",
        img: m.poster_path ? TMDB_IMG + m.poster_path : null,
        overview: m.overview || "Sin descripción.",
        type: "movies",
        link: `https://www.themoviedb.org/movie/${m.id}`,
        tags: [],
      }));
  } catch (e) {
    console.error("fetchMovies", e);
    return [];
  }
}

// SERIES
async function fetchSeries(query, sortBy, limit, filters) {
  const cfg = MOOD_MAP[currentMood].series;
  const sortMap = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    newest: "first_air_date.desc",
  };
  const sort = sortMap[sortBy] || cfg.sort;

  const adult = filters.includeAdult ? "true" : "false";
  const dateQ = filters.includeClassic
    ? ""
    : `&first_air_date.gte=${new Date().getFullYear() - 30}-01-01`;
  const voteQ = `&vote_average.gte=${cfg.vote_avg}`;

  let all = [];
  try {
    if (query) {
      for (let p = 1; all.length < limit && p <= 5; p++) {
        const d = await apiFetch(
          `${TMDB_BASE}/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=${p}&language=es-MX&include_adult=${adult}${dateQ}`,
        );
        if (!d.results?.length) break;
        all.push(...d.results);
      }
    } else {
      for (let p = 1; all.length < limit && p <= 5; p++) {
        const d = await apiFetch(
          `${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=${cfg.genres}&sort_by=${sort}&vote_count.gte=30${voteQ}&page=${p}&language=es-MX&include_adult=${adult}${dateQ}`,
        );
        if (!d.results?.length) break;
        all.push(...d.results);
      }
    }

    const seen = new Set();
    return all
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .slice(0, limit)
      .map((s) => ({
        id: s.id,
        title: s.name,
        year: s.first_air_date?.slice(0, 4) || "—",
        rating: s.vote_average ? s.vote_average.toFixed(1) : "—",
        img: s.poster_path ? TMDB_IMG + s.poster_path : null,
        overview: s.overview || "Sin descripción.",
        type: "series",
        link: `https://www.themoviedb.org/tv/${s.id}`,
        tags: [],
      }));
  } catch (e) {
    console.error("fetchSeries", e);
    return [];
  }
}

// MUSICA
async function fetchMusic(query, limit) {
  const term = query || MOOD_MAP[currentMood].music.term;
  try {
    const d = await apiFetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${Math.min(limit * 3, 200)}`,
    );
    let res = (d.results || []).filter(
      (t) => t.artworkUrl100 && t.trackName && t.artistName,
    );

    if (res.length < limit) {
      const fallbacks = {
        happy: "happy upbeat pop",
        sad: "sad melancholic",
        angry: "intense aggressive",
        scared: "dark suspense",
        chill: "lofi chill relax",
        romantic: "love romantic ballad",
      };
      const fb = await apiFetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(fallbacks[currentMood] || "top hits")}&media=music&entity=song&limit=${Math.min(limit * 2, 100)}`,
      );
      res.push(
        ...(fb.results || []).filter(
          (t) => t.artworkUrl100 && t.trackName && t.artistName,
        ),
      );
    }

    const seen = new Set();
    return res
      .filter((t) => {
        if (seen.has(t.trackId)) return false;
        seen.add(t.trackId);
        return true;
      })
      .slice(0, limit)
      .map((t) => ({
        id: t.trackId,
        title: t.trackName,
        year: t.releaseDate?.slice(0, 4) || "—",
        rating: null,
        img: t.artworkUrl100.replace("100x100bb", "600x600bb"),
        overview: `${t.artistName} · ${t.collectionName || ""} · ${t.primaryGenreName || ""}`,
        type: "music",
        link: t.trackViewUrl,
        preview: t.previewUrl,
        artist: t.artistName,
        album: t.collectionName,
        tags: [t.primaryGenreName],
      }));
  } catch (e) {
    console.error("fetchMusic", e);
    return [];
  }
}

// LIBROS
async function fetchBooks(query, limit) {
  const subject = query || MOOD_MAP[currentMood].books.subject;
  try {
    const d = await apiFetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(subject)}&limit=${limit * 2}&page=${currentPage}&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,number_of_pages_median`,
    );
    let res = d.docs || [];

    if (res.length < limit) {
      const alts = {
        humor: "comedy funny",
        "literary fiction": "fiction drama",
        thriller: "mystery suspense",
        horror: "scary paranormal",
        travel: "adventure exploration",
        romance: "love story",
      };
      const fb = await apiFetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(alts[subject] || subject)}&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,number_of_pages_median`,
      );
      res.push(...(fb.docs || []));
    }

    const seen = new Set();
    return res
      .filter((b) => {
        if (seen.has(b.key)) return false;
        seen.add(b.key);
        return true;
      })
      .slice(0, limit)
      .map((b) => ({
        id: b.key,
        title: b.title,
        year: b.first_publish_year || "—",
        rating: b.ratings_average ? (+b.ratings_average).toFixed(1) : "—",
        img: b.cover_i
          ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
          : null,
        overview: `Autor: ${(b.author_name || ["Desconocido"]).join(", ")}${b.number_of_pages_median ? ` · ${b.number_of_pages_median} págs.` : ""}`,
        type: "books",
        link: `https://openlibrary.org${b.key}`,
        author: (b.author_name || []).join(", "),
        tags: [],
      }));
  } catch (e) {
    console.error("fetchBooks", e);
    return [];
  }
}

// VIDEOJUEGOS
async function fetchGames(query, sortBy, limit) {
  const moodTerms = {
    happy: "nintendo colorful arcade casual",
    sad: "indie atmospheric emotional narrative",
    angry: "action combat fighting shooter",
    scared: "horror survival dark spooky",
    chill: "relaxing puzzle simulation cozy",
    romantic: "story visual novel adventure",
  };

  const term = query || moodTerms[currentMood];

  try {
    const d = await apiFetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=${limit * 2}`,
    );

    let res = (d.results || []).filter((g) => g.artworkUrl100 && g.trackName);

    return res.slice(0, limit).map((g) => ({
      id: g.trackId,
      title: g.trackName,
      year: g.releaseDate?.slice(0, 4) || "—",
      rating: g.averageUserRating ? g.averageUserRating.toFixed(1) : "—",
      img: g.artworkUrl512 || g.artworkUrl100, // Imagen de alta calidad
      overview: `${g.artistName} · ${g.primaryGenreName} · ${g.description?.substring(0, 160)}...`,
      type: "games",
      link: g.trackViewUrl,
      tags: [g.primaryGenreName, g.contentAdvisoryRating].filter(Boolean),
    }));
  } catch (e) {
    console.error("fetchGames error:", e);
    return [];
  }
}

// RECETAS
async function fetchRecipes(query, limit) {
  const cfg = MOOD_MAP[currentMood].recipes;
  const url = query
    ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
    : `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cfg.category)}`;

  try {
    const d = await apiFetch(url);
    let meals = d.meals || [];

    if (meals.length < limit && !query) {
      const alts = {
        Dessert: ["Breakfast"],
        Pasta: ["Rice", "Vegetarian"],
        Beef: ["Chicken"],
        Chicken: ["Beef"],
        Vegetarian: ["Pasta"],
        Seafood: ["Pasta"],
      };
      for (const cat of alts[cfg.category] || []) {
        if (meals.length >= limit) break;
        const a = await apiFetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`,
        );
        meals.push(...(a.meals || []));
      }
    }

    let detailed = meals.slice(0, limit);
    if (!query && detailed.length && !detailed[0].strInstructions) {
      detailed = await Promise.all(
        detailed.map((m) =>
          apiFetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`,
          )
            .then((r) => r.meals?.[0] || m)
            .catch(() => m),
        ),
      );
    }

    const seen = new Set();
    return detailed
      .filter((m) => {
        if (seen.has(m.idMeal)) return false;
        seen.add(m.idMeal);
        return true;
      })
      .slice(0, limit)
      .map((m) => ({
        id: m.idMeal,
        title: m.strMeal,
        year: m.strArea || "—",
        rating: null,
        img: m.strMealThumb || null,
        overview: m.strInstructions
          ? m.strInstructions.substring(0, 200) + "…"
          : `Cocina: ${m.strArea || "—"} · Categoría: ${m.strCategory || "—"}`,
        type: "recipes",
        link:
          m.strSource ||
          m.strYoutube ||
          `https://www.themealdb.com/meal/${m.idMeal}`,
        tags: [m.strCategory, m.strArea].filter(Boolean),
      }));
  } catch (e) {
    console.error("fetchRecipes", e);
    return [];
  }
}

// PODCASTS
async function fetchPodcasts(query, limit) {
  const term = query || MOOD_MAP[currentMood].podcasts.term;
  try {
    const d = await apiFetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&limit=${Math.min(limit * 3, 200)}`,
    );
    let res = (d.results || []).filter(
      (p) => p.artworkUrl600 && p.collectionName,
    );

    if (res.length < limit) {
      const fallbacks = {
        happy: "comedy podcast",
        sad: "storytelling podcast",
        angry: "true crime podcast",
        scared: "mystery podcast",
        chill: "wellness podcast",
        romantic: "romance podcast",
      };
      const fb = await apiFetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(fallbacks[currentMood] || "podcast")}&media=podcast&entity=podcast&limit=${Math.min(limit * 2, 100)}`,
      );
      res.push(
        ...(fb.results || []).filter(
          (p) => p.artworkUrl600 && p.collectionName,
        ),
      );
    }

    const seen = new Set();
    return res
      .filter((p) => {
        if (seen.has(p.collectionId)) return false;
        seen.add(p.collectionId);
        return true;
      })
      .slice(0, limit)
      .map((p) => ({
        id: p.collectionId,
        title: p.collectionName,
        year: p.releaseDate?.slice(0, 4) || "—",
        rating: null,
        img: p.artworkUrl600,
        overview: `${p.artistName} · ${p.primaryGenreName || ""} · ${p.trackCount || "?"} episodios`,
        type: "podcasts",
        link: p.collectionViewUrl,
        tags: (p.genres || []).slice(0, 3),
      }));
  } catch (e) {
    console.error("fetchPodcasts", e);
    return [];
  }
}







function renderCards(items, append, cat) {
  if (!append) cardsGrid.innerHTML = "";
  const meta = CAT_META[cat] || { label: cat, emoji: "◈", square: false };

  items.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.style.animationDelay = `${i * 0.04}s`;

    const imgHtml = item.img
      ? `<img src="${esc(item.img)}" alt="${esc(item.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;"onerror="this.parentElement.innerHTML='<div class=card-noimg>${meta.emoji}</div>'" />`
      : `<div class="card-noimg">${meta.emoji}</div>`;

    const ratingHtml =
      item.rating && item.rating !== "—"
        ? `<span class="card-rating text-[0.72rem] font-semibold">★ ${item.rating}</span>`
        : `<span></span>`;

    card.innerHTML = `
      <div class="card-img-wrap" style="width:100%;aspect-ratio:${meta.square ? "1/1" : "2/3"};overflow:hidden;background:rgba(255,255,255,0.04);position:relative;">
        ${imgHtml}
      </div>
      <div class="card-body" style="padding:0.9rem;">
        <div class="card-title font-display font-bold text-[0.88rem] leading-snug" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${esc(item.title)}
        </div>
        <div class="card-meta flex items-center justify-between mt-1 text-[0.72rem] text-[rgba(240,240,245,0.55)]">
          <span>${esc(String(item.year))}</span>
          ${ratingHtml}
        </div>
      </div>`;

    card.addEventListener("click", () => openModal(item, meta));
    cardsGrid.appendChild(card);
  });
}

function openModal(item, meta) {
  let extraHtml = "";
  if (item.type === "music" && item.preview) {
    extraHtml = `
      <p class="text-[rgba(240,240,245,0.55)] text-[0.88rem] mt-4"><strong>🎧 Vista previa:</strong></p>
      <audio controls style="width:100%;margin-top:0.5rem;border-radius:8px;accent-color:var(--mood-primary);">
        <source src="${esc(item.preview)}" type="audio/mpeg">
      </audio>`;
  }
  if (item.type === "books" && item.author) {
    extraHtml = `<p class="text-[rgba(240,240,245,0.55)] text-[0.88rem]"><strong>Autor:</strong> ${esc(item.author)}</p>`;
  }

  const imgHtml = item.img
    ? `<img src="${esc(item.img)}" alt="${esc(item.title)}" style="width:100%;max-height:280px;object-fit:cover;border-radius:16px;margin-bottom:1.5rem;" onerror="this.style.display='none'" />`
    : `<div style="font-size:4rem;text-align:center;padding:2rem;">${meta.emoji}</div>`;

  const tagsHtml = (item.tags || [])
    .filter(Boolean)
    .map((t) => `<span class="modal-tag">${esc(t)}</span>`)
    .join("");

  modalContent.innerHTML = `
    ${imgHtml}
    <div class="flex flex-wrap gap-2 mb-4">
      <span class="modal-tag">${esc(meta.label)}</span>
      ${item.year !== "—" ? `<span class="modal-tag">${esc(String(item.year))}</span>` : ""}
      ${item.rating && item.rating !== "—" ? `<span class="modal-tag">★ ${item.rating}</span>` : ""}
      ${tagsHtml}
    </div>
    <h2 class="font-display font-extrabold text-[clamp(1.2rem,3vw,1.7rem)] tracking-tight mb-2">
      ${esc(item.title)}
    </h2>
    <p class="text-[rgba(240,240,245,0.55)] text-[0.88rem] leading-relaxed">${esc(item.overview)}</p>
    ${extraHtml}
    <a href="${esc(item.link)}" target="_blank" rel="noopener noreferrer" class="modal-link">Ver más →</a>`;

  modalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

function showLoading(show) {
  loadingState.style.display = show ? "flex" : "none";
  if (show) cardsGrid.innerHTML = "";
}
function hideError() {
  errorState.style.display = "none";
}
function showError(msg) {
  errorState.style.display = "block";
  errorText.textContent = msg;
  resultsHeader.style.display = "none";
  loadMoreWrap.style.display = "none";
}
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

(function init() {
  updateRangeGradient();
})();
