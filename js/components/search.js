import { status, initFlashcardHover, randomAnime } from './initializer.js';
import { BASE_URL, searchAnime, getTopRatedAnime, getMostPopularAnime, getGenres, genres } from '../api.js';
import { createSection, createFlashcard } from './UIs.js';
import { loadCSS, showLoader, hideLoader, updateMetaTags } from '../pages.js'
const activeFilters = {};

export async function loadSearchPage() {
    document.title = 'Search for Anime';
    updateMetaTags(
        'Search for anime on MediaRoster. Use filters to find the exact anime you are looking for.',
        ['mediaroster', 'anime', 'anime list', 'AnimeList', 'Anime keywords', 'list', 'roster', 'home', 'media', 'anim', 'search', 'filter']
    );
    const currentHash = window.location.hash;
    loadCSS('./css/search.css');
    console.log('Loading Search Page');
    document.getElementById('navsearch').style.color = '#8960ff';
    document.getElementById('navhome').style.color = '#ddd';
    if (JSON.stringify(genres) === '{}') {
        getGenres();
    }
    const content = document.getElementById('content');
    content.innerHTML = `
    <h1 class="search-title">Search across our databases and make your pick!</h1>
    <div class="search-container">
        <div class="search-bar">
            <div class="search-top">

                <button class="filter-button">
                    <i class="fas fa-filter"></i>
                    Filters
                </button>

                <div class="search-bar-content">
                    <input
                        type="search"
                        id="search-input"
                        placeholder="Search for anime..."
                        autocomplete="off"
                        autocorrect="off"
                        autocapitalize="off"
                        spellcheck="false"
                    >

                    <button id="search-button">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            <div id="search-suggestions"></div>
            <div class="search-note">NSFW results are enabled by default. Use the filters to change this.</div>
        </div>
        <div class="filter-options" style="display: none;">
            <h2 class='filter-title'>Filter Options</h2>
            <div class="filter-section">
                <div class="filter-controls">
                    <h4 class="filter-header">Type:</h4>
                    <div class="filter-buttons">
                        <button class="filter-btn" data-filter="type" data-value="tv">TV</button>
                        <button class="filter-btn" data-filter="type" data-value="movie">Movie</button>
                        <button class="filter-btn" data-filter="type" data-value="ova">OVA</button>
                        <button class="filter-btn" data-filter="type" data-value="special">Special</button>
                        <button class="filter-btn" data-filter="type" data-value="ona">ONA</button>
                        <button class="filter-btn" data-filter="type" data-value="music">Music</button>
                        <button class="filter-btn" data-filter="type" data-value="cm">Commercial</button>
                        <button class="filter-btn" data-filter="type" data-value="pv">Promotional Video</button>
                        <button class="filter-btn" data-filter="type" data-value="tv_special">TV Special</button>
                    </div>
                </div>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <h4 class="filter-header">Status:</h4>
                    <div class="filter-buttons">
                        <button class="filter-btn" data-filter="status" data-value="airing">Airing</button>
                        <button class="filter-btn" data-filter="status" data-value="complete">Completed</button>
                        <button class="filter-btn" data-filter="status" data-value="upcoming">Upcoming</button>
                    </div>
                </div>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <h4 class="filter-header">Rating:</h4>
                    <div class="filter-buttons">
                        <button class="filter-btn" data-filter="rating" data-value="g">G - All Ages</button>
                        <button class="filter-btn" data-filter="rating" data-value="pg">PG - Children</button>
                        <button class="filter-btn" data-filter="rating" data-value="pg13">PG-13 - Teens 13+</button>
                        <button class="filter-btn" data-filter="rating" data-value="r17">R - 17+ (violence)</button>
                        <button class="filter-btn" data-filter="rating" data-value="r">R+ - Mild Nudity</button>
                        <button class="filter-btn" data-filter="rating" data-value="rx">Rx - Hentai</button>
                    </div>
                </div>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <h4 class="filter-header">Score:</h4>
                    <input type="number" class="filter-input" placeholder="Min Score" id="min_score" min="0" max="10" step="0.1">
                    <input type="number" class="filter-input" placeholder="Max Score" id="max_score" min="0" max="10" step="0.1">
                </div>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <h4 class="filter-header">Season:</h4>
                    <div class="filter-buttons">
                        <button class="filter-btn" data-filter="season" data-value="winter">Winter</button>
                        <button class="filter-btn" data-filter="season" data-value="spring">Spring</button>
                        <button class="filter-btn" data-filter="season" data-value="summer">Summer</button>
                        <button class="filter-btn" data-filter="season" data-value="fall">Fall</button>
                    </div>
                </div>
            </div>
            <div class="filter-section">
                <h4 class="filter-header">Genres:</h4>
                <div class= "filter-buttons" id="genresDiv">
                </div>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <h4 class="filter-header">Order By:</h4>
                    <select id="order_by" class="filter-dropdown">
                        <option value="score">Score</option>
                        <option value="members">Members</option>
                        <option value="popularity">Popularity</option>
                        <option value="title">A-Z</option>
                        <option value="favorites">Favorites</option>
                        <option value="episodes">Episodes</option>
                    </select>
                    <h4 class="filter-header">Sort Direction:</h4>
                    <select id="sort" class="filter-dropdown">
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>
            <div class="sfw-toggle">
                <label class="switch">
                    <input type="checkbox" id="sfw-checkbox" checked>
                    <span class="slider round"></span>
                </label>
                <span>Allow NSFW content</span>
            </div>
        </div>
    </div>
    <div id="search-results"></div>
    `;
    showLoader();
    initFilters();
    initSearch();
    renderGenres();

    const [path, query] = currentHash.split('?');
    if (path === '#/search' && !query) {
        const allAnime = await searchAnime(`${BASE_URL}/anime?page=1`);
        if (currentHash !== '#/search') return;
        displaySearchResults(allAnime);
        const searchResultsContainer = document.getElementById('search-results');
        if (searchResultsContainer) {
            if (currentHash !== '#/search') return;
            const topRatedSection = await createSection({
                title: 'Top Rated Anime',
                apiFunction: getTopRatedAnime,
                cardType: 'top-rated',
                containerClass: 'airing-container',
                titleClass: 'airing-title',
                galleryClass: 'gridGallery'
            });
            if (currentHash !== '#/search') return;
            searchResultsContainer.insertAdjacentHTML('beforeend', topRatedSection)
            if (currentHash !== '#/search') return;
            const mostPopularSection = await createSection({
                title: 'Most Popular Anime',
                apiFunction: getMostPopularAnime,
                cardType: 'most-popular',
                containerClass: 'airing-container',
                titleClass: 'airing-title',
                galleryClass: 'gridGallery'
            });
            if (currentHash !== '#/search') return;
            searchResultsContainer.insertAdjacentHTML('beforeend', mostPopularSection)
        }

        if (currentHash === '#/search') {
            initFlashcardHover();
            document.getElementById('randomDiv').style.display = 'block';
            randomAnime();
            hideLoader();
        }

    } else {
        console.log(`Search initiated with query: ${query}`);
    }
}

function loadPagination(paginationData, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const { current_page, last_visible_page, has_next_page } = paginationData;

    const createButton = (text, page, enabled) => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.disabled = !enabled;
        if (enabled) {
            btn.addEventListener('click', () => {
                const params = getSafeParams();
                console.log(`Current params before setting page: ${params.toString()}`);
                params.set('page', page);
                const hash = `#/search?${params.toString() || `page=${page}`}`
                window.location.hash = hash;
            });
        }
        return btn;
    };

    containerEl.appendChild(createButton('<<', 1, current_page > 1));
    containerEl.appendChild(createButton('<', current_page - 1, current_page > 1));

    const pageIndicator = document.createElement('span');
    pageIndicator.textContent = current_page;
    containerEl.appendChild(pageIndicator);

    containerEl.appendChild(createButton('>', current_page + 1, has_next_page));
    containerEl.appendChild(createButton('>>', last_visible_page, current_page < last_visible_page));
}
export async function displaySearchResults(searchResults) {
    document.title = activeFilters.q ? `Search : ${activeFilters.q}` : 'Search for Anime';
    const container = document.getElementById('search-results');
    if (!container) return;
    container.innerHTML = '';

    if (!searchResults?.data?.length) {
        container.innerHTML = '<p class="no-results">No Matching results found.</p>';
        status.searching = false;
        hideLoader();
        return;
    }

    const infoHeader = document.createElement('h2');
    infoHeader.className = 'search-results-info';
    infoHeader.textContent = `Found ${searchResults.pagination.items.total} anime in database`;
    container.appendChild(infoHeader);

    const grid = document.createElement('div');
    grid.className = 'gridGallery';
    grid.innerHTML = searchResults.data.map(anime => createFlashcard(anime, 'top-rated')).join('');
    container.appendChild(grid);

    const pagination = document.createElement('div');
    pagination.className = 'pagination-controls';
    container.appendChild(pagination);

    initFlashcardHover();
    loadPagination(searchResults.pagination, pagination);
}

export async function initSearch() {
    const params = getSafeParams();
    console.log(`Current params on init: ${params.toString()}`);
    for (const key in activeFilters) delete activeFilters[key];
    for (const [key, value] of params.entries()) {
        if (key === 'genres' || key === 'type' || key === 'rating') {
            activeFilters[key] = value.split(',');
        } else {
            activeFilters[key] = value;
        }
    }

    applyFilters();

    const searchBtn = document.getElementById('search-button');
    if (searchBtn) searchBtn.addEventListener('click', () => {
        delete activeFilters['page'];
        constructURL(true);
    });

    const searchIn = document.getElementById('search-input');
    let suggestionTimer;

    searchIn.addEventListener('input', () => {
        const query = searchIn.value.trim();
        activeFilters.q = query;
        clearTimeout(suggestionTimer);

        suggestionTimer = setTimeout(() => {
            showSearchSuggestions(query);
        }, 300);
    });
    searchIn.addEventListener('focus', () => {
        const query = searchIn.value.trim();

        clearTimeout(suggestionTimer);

        suggestionTimer = setTimeout(() => {
            showSearchSuggestions(query);
        }, 100);
    });
    searchIn.addEventListener('blur', () => {
        const suggestionsContainer = document.getElementById('search-suggestions');
        setTimeout(() => {
            if (suggestionsContainer && !searchIn.matches(':focus')) {
                suggestionsContainer.style.display = 'none';
            }
        }, 200);
    });
    searchIn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            delete activeFilters['page'];
            constructURL(true);
        }
    });

    if (params.toString()) handleSearch(false);
}

let suggestionReq = 0;
async function showSearchSuggestions(query) {
    const id = ++suggestionReq;
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer) return;
    if (!query) {
        suggestionsContainer.style.display = 'none'
        return
    };
    const searchURL = await constructURL(false);
    if (!searchURL) {
        suggestionsContainer.style.display = 'none'
        return;
    }

    try {
        const results = await searchAnime(searchURL);
        if (suggestionReq !== id) {
            return
        }
        if (!results?.data?.length) {
            suggestionsContainer.innerHTML = `
            <div class='no-suggestion'>
                No matching results
            </div>
            `
            suggestionsContainer.style.display = 'block';
            return;
        }

        suggestionsContainer.innerHTML = `${results.data.slice(0, 5).map(anime => `
        <a href="#/details-${anime.mal_id}" class="search-suggestion">
            <img src="${anime.images?.webp?.image_url || anime.images?.jpg?.image_url || 'placeholder.png'}" alt="${anime.title}">

            <div class="search-suggestion-info">

                <div class="search-suggestion-title-row">
                    <div class="search-suggestion-rank">
                        <span style="font-weight: bold; color: gold"># ${anime.rank}</span>
                    </div>

                    <div class="search-suggestion-title">
                        ${anime.title}
                    </div>
                </div>

                <div class="search-suggestion-meta">

                    <div>
                        <i class="fas fa-video"></i>
                        ${anime.type}
                    </div>

                    <div>
                        <i class="fas fa-user-group"></i>
                        ${anime.members?.toLocaleString()}
                    </div>

                    <div>
                        <i class="fas fa-star"></i>
                        ${anime.score}
                    </div>

                    <div>
                        <i class="fas fa-shield-alt"></i>
                        ${anime.rating}
                    </div>

                </div>
            </div>
        </a>
        `).join('')}`;
        suggestionsContainer.style.display = 'block';
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
    }
};

async function handleSearch(updateURL = true) {
    const url = await constructURL(updateURL);
    const container = document.getElementById('search-results');
    if (!container) return;
    container.innerHTML = `<div class="loader" style="display: flex; justify-content: center; align-items: center; width:100%;">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                         </div>`;
    if (url) {
        const results = await searchAnime(url);
        displaySearchResults(results);
    }
}

export async function constructURL(updateURL = false) {
    const baseURL = `${BASE_URL}/anime`;
    const params = new URLSearchParams();

    for (const filter in activeFilters) {
        let value = activeFilters[filter];
        if (filter === 'q') {
            value = value.replace(/[^\p{L}\p{N}\s\-_.:'"|#]/gu, '').slice(0, 100);
        }
        if (Array.isArray(value)) params.append(filter, value.join(','));
        else params.append(filter, value);
    }

    if (!params.toString()) return null;

    const targetApiURL = `${baseURL}?${params.toString()}`;
    if (updateURL) {
        window.location.hash = `#/search?${params.toString()}`;
    }
    return targetApiURL;
}

export function applyFilters() {
    document.querySelectorAll('[class*="active"]').forEach(el => el.classList.remove('active'));

    const IdFilters = ['order_by', 'sort', 'min_score', 'max_score'];

    for (const key in activeFilters) {
        const value = activeFilters[key];
        if (key === 'q') {
            const input = document.getElementById('search-input');
            if (input) input.value = value;
        } else if (key === 'genres' || key === 'type' || key === 'rating') {
            value.forEach(v => {
                const btn = document.querySelector(`[data-filter='${key}'][data-value='${v}']`);
                if (btn) btn.classList.add('active');
            });
        } else if (key === 'page') {
            // No UI element to update for page number
        } else if (key === 'sfw') {
            const checkbox = document.getElementById('sfw-checkbox');
            if (checkbox) checkbox.checked = false;
        } else if (IdFilters.includes(key)) {
            const elem = document.getElementById(key);
            if (elem) elem.value = value;
        } else {
            const elem = document.querySelector(`[data-filter='${key}'][data-value='${value}']`);
            if (elem) elem.classList.add('active');
        }
    }
}

export function initFilters() {
    const filterButton = document.querySelector('.filter-button');
    const filterOptions = document.querySelector('.filter-options');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterInputs = document.querySelectorAll('.filter-input');
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');

    filterButton.addEventListener('click', () => {
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'grid' : 'none';
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            const value = btn.dataset.value;
            const singleSelectGroups = ["season", "status"];

            if (singleSelectGroups.includes(filter)) {
                document.querySelectorAll(`.filter-btn[data-filter="${filter}"]`).forEach(b => b.classList.remove('active'));
                if (activeFilters[filter] !== value) {
                    activeFilters[filter] = value;
                    btn.classList.add('active');
                } else {
                    delete activeFilters[filter];
                }
            } else {
                if (activeFilters[filter] && activeFilters[filter].includes(value)) {
                    activeFilters[filter] = activeFilters[filter].filter(v => v !== value);
                    if (!activeFilters[filter].length) delete activeFilters[filter];
                    btn.classList.remove('active');
                } else {
                    if (!activeFilters[filter]) activeFilters[filter] = [];
                    activeFilters[filter].push(value);
                    btn.classList.add('active');
                }
            }
        });
    });

    filterInputs.forEach(input => {
        input.addEventListener('input', () => {
            const filter = input.id;
            const value = input.value;
            if (value) activeFilters[filter] = value;
            else delete activeFilters[filter];
        });
    });

    filterDropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', () => {
            const filter = dropdown.id;
            const value = dropdown.value;
            if (value) activeFilters[filter] = value;
            else delete activeFilters[filter];
        });
    });
    const sfw = document.getElementById('sfw-checkbox');
    sfw.addEventListener('change', () => {
        if (!sfw.checked || !activeFilters.sfw) {
            activeFilters.sfw = 'true';
            sfw.checked = false;
        } else {
            delete activeFilters.sfw
            sfw.checked = true;
        }
    });
}

export async function renderGenres() {
    if (JSON.stringify(genres) === '{}') await getGenres();

    const content = Object.entries(genres).map(([key, value]) => `
        <button class="genre-btn" data-filter="genres" data-value="${key}">${value}</button>
    `).join('');

    const genresDiv = document.getElementById('genresDiv');
    genresDiv.innerHTML += content;

    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            const value = btn.dataset.value;

            if (activeFilters[filter] && activeFilters[filter].includes(value)) {
                activeFilters[filter] = activeFilters[filter].filter(v => v !== value);
                if (!activeFilters[filter].length) delete activeFilters[filter];
                btn.classList.remove('active');
            } else {
                if (!activeFilters[filter]) activeFilters[filter] = [];
                activeFilters[filter].push(value);
                btn.classList.add('active');
            }
        });
    });
    applyFilters();
};

const allowed_filters = new Set([
    'q', 'page', 'genres', 'min_score', 'max_score',
    'status', 'season', 'type', 'rating', 'order_by', 'sort', 'sfw'
]);

const ENUMS = {
    status: new Set(['airing', 'complete', 'upcoming']),
    season: new Set(['winter', 'spring', 'summer', 'fall']),
    type: new Set(['tv', 'movie', 'ova', 'special', 'ona', 'music', 'cm', 'pv', 'tv_special']),
    rating: new Set(['g', 'pg', 'pg13', 'r', 'r17', 'rx']),
    order_by: new Set(['title', 'score', 'popularity', 'favorites', 'members', 'episodes']),
    sort: new Set(['asc', 'desc'])
};

export function getSafeParams() {
    const raw = new URLSearchParams(window.location.hash.split('?')[1] || '');
    console.log(`raw : ${raw}`)
    const safe = new URLSearchParams();

    for (const [key, value] of raw.entries()) {
        if (!allowed_filters.has(key)) continue;
        if (key === 'q') {
            const cleanQ = value.replace(/[^\p{L}\p{N}\s\-_.:'"|#]/gu, '').slice(0, 100);
            safe.set('q', cleanQ);
        } else if (['min_score', 'max_score'].includes(key)) {
            const n = parseFloat(value, 10);
            if (Number.isFinite(n) && n >= 0 && n <= 10) safe.set(key, String(n));
        } else if (key === 'page') {
            const n = parseInt(value, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 1000) safe.set(key, String(n));
        } else if (key === 'genres') {
            const ids = value.split(',')
                .map(v => parseInt(v, 10))
                .filter(n => Number.isFinite(n) && n > 0);
            if (ids.length) safe.set(`${key}`, ids.join(','));
        } else if (key === 'type' || key === 'rating') {
            const vals = value
                .split(',')
                .map(v => v.toLowerCase())
                .filter(v => ENUMS[key].has(v));

            if (vals.length) {
                safe.set(key, vals.join(','));
            }
        } else if (key === 'sfw') {
            safe.set('sfw', value);
        } else if (ENUMS[key]) {
            const norm = value.toLowerCase();
            if (ENUMS[key].has(norm)) safe.set(key, norm);
        }
    }
    console.log(`safe : ${safe}`)
    return safe;
};