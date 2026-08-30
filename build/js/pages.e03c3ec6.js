import { initSlideshow, initFlashcardHover, randomAnime,  initGalleryControls } from './components/initializer.edf0c01b.js';
import { searchAnime, getTopRatedAnime, getMostPopularAnime, getAiringAnime, getSeasonalAnime, getGenres, genres, getAnimeInfo } from './api.07c15c0a.js';
import { createSection, escapeHTML } from './components/UIs.a924b895.js';
import { loadSearchPage } from './components/search.84ae8e0e.js';
import { loadSignInPage, loadRegisterPage, loadProfileSetupPage } from './components/auth.032ed004.js';
import { loadProfilePage } from './components/profile.25c14d97.js';
import { reccomendedData} from './components/data.30e2bffd.js'

// ====== PAGE ROUTING ======
export function loadPageContent(pageName, authData = null) {
  const navhome = document.getElementById('navhome');
  const navsearch = document.getElementById('navsearch');
  const navsignin = document.getElementById('navsignin');
  if (navhome) navhome.style.color = '#ddd';
  if (navsearch) navsearch.style.color = '#ddd';
  if (navsignin && !navsignin.classList.contains('nav-user-btn')) navsignin.style.color = '#ddd';

  const randomDiv = document.getElementById('randomDiv');
  const isAuthPage = pageName === 'signin' || pageName === 'register' || pageName === 'profile-setup' || pageName === 'profile';
  if (randomDiv) {
    if (isAuthPage) {
      randomDiv.style.display = 'none';
    } else {
      randomDiv.style.display = 'block';
      randomAnime();
    }
  }

  if (pageName === 'home') loadHomePage();
  else if (pageName === 'search') loadSearchPage();
  else if (pageName === 'signin') {
    if (navsignin && !navsignin.classList.contains('nav-user-btn')) navsignin.style.color = '#8960ff';
    loadSignInPage();
  }
  else if (pageName === 'register') loadRegisterPage();
  else if (pageName === 'profile-setup') loadProfileSetupPage(authData);
  else if (pageName === 'profile') loadProfilePage(authData);
  else load404();
}

export function updateMetaTags(description, keywords) {
  let descriptionTag = document.querySelector('meta[name="description"]');
  if (!descriptionTag) {
    descriptionTag = document.createElement('meta');
    descriptionTag.name = 'description';
    document.head.appendChild(descriptionTag);
  }
  descriptionTag.content = description;

  let keywordsTag = document.querySelector('meta[name="keywords"]');
  if (!keywordsTag) {
    keywordsTag = document.createElement('meta');
    keywordsTag.name = 'keywords';
    document.head.appendChild(keywordsTag);
  }
  keywordsTag.content = keywords.join(', ');
}

// ====== LOADER ======
let loaderTimeout;
export function showLoader() {
  const loaderContainer = document.getElementById('loader');
  if (loaderContainer) {
    clearTimeout(loaderTimeout);
    loaderContainer.innerHTML = `
      <div class="loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    loaderContainer.style.display = 'flex';
    loaderTimeout = setTimeout(() => {
      loaderContainer.innerHTML += `<div class="loader-text">Looks like our servers are facing high traffic, please have patience.</div>`;
    }, 10000);
  }
}
export function hideLoader() {
  const loaderContainer = document.getElementById('loader');
  if (loaderContainer) {
    clearTimeout(loaderTimeout);
    loaderContainer.innerHTML = '';
    loaderContainer.style.display = 'none';
  }
}
export function loadCSS(filename) {
  const existingLink = document.querySelector(`link[href="${filename}"]`);
  if (!existingLink) {
    const link = document.createElement('link');
    link.href = filename;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
}
// ====== HOME PAGE ======
export async function loadHomePage() {
  document.title = 'MediaRoster - Discover Your Next Favorite Anime';
  updateMetaTags(
    'Discover your next favorite anime with MediaRoster, your go-to hub for anime discovery. Browse, search, and get details on a vast collection of anime series and movies.',
    ['mediaroster', 'anime', 'anime list', 'AnimeList', 'Anime keywords', 'list', 'roster', 'home', 'media', 'anim']
  );
  const currentHash = window.location.hash;
  console.log('Loading Home Page');
  document.getElementById('navhome').style.color = '#8960ff';
  document.getElementById('navsearch').style.color = '#ddd';
  const content = document.getElementById('content');

  showLoader();
  const slideshowHTML = `
  <div class="slideshow-container">
    ${reccomendedData.map((anime, i) => `
      <div class="slide ${i === 0 ? 'active' : ''}" id="rec-${anime.mal_id}" data-mal-id="${anime.mal_id}">
        <picture>
          <source media="(min-width: 601px)" srcset="${anime.images.PC_image}">
          <img class="hero-background" src="${anime.images.large_image}" alt="${anime.title} background">
        </picture>
        <div class="slide-fade"></div> 
        <div class="slide-content">
          <h2 class="slide-title">${anime.title}</h2>
          <p class="slide-description">${anime.synopsis.substring(0, 250)}...</p>
          <div class="slide-details">
            <span data-type="episodes"><i class="fas fa-play-circle"></i> ${anime.episodes} Episodes</span>
            <span data-type="score"><i class="fas fa-star"></i> ${anime.score}</span>
            <span data-type="members"><i class="fas fa-users"></i> ${anime.members.toLocaleString()}</span>
            <span data-type="rank"><i class="fas fa-trophy"></i> Rank: #${anime.rank}</span>
          </div>
          <div class="slide-actions">
            <a href="./#/details-${anime.mal_id}" class="slide-button"><i class="fas fa-info-circle"></i> View Details</a>
            <a href="${anime.images.source}" target="_blank" rel="noopener noreferrer" class="slide-source"><i class="fas fa-external-link-alt"></i> Original Image</a>
          </div>
        </div>
      </div>
    `).join('')}
    <button type="button" class="prev" aria-label="Previous Slide"><i class="fas fa-chevron-left"></i></button>
    <button type="button" class="next" aria-label="Next Slide"><i class="fas fa-chevron-right"></i></button>
  </div>
`;
  if (currentHash !== '' && currentHash !== '#/') return;
  content.innerHTML = slideshowHTML;

  const sections = [
    { title: 'Top Rated Anime', apiFunction: getTopRatedAnime, cardType: 'top-rated', containerClass: 'top-rated-container', titleClass: 'top-rated-title', galleryClass: 'horizontal-gallery' },
    { title: 'Most Popular Anime', apiFunction: getMostPopularAnime, cardType: 'most-popular', containerClass: 'top-rated-container', titleClass: 'top-rated-title', galleryClass: 'horizontal-gallery' },
    { title: 'Currently Airing Anime', apiFunction: getAiringAnime, cardType: 'airing', containerClass: 'airing-container', titleClass: 'airing-title', galleryClass: 'gridGallery' },
    { title: 'Anime This Season', apiFunction: getSeasonalAnime, cardType: 'seasonal', containerClass: 'airing-container', titleClass: 'airing-title', galleryClass: 'gridGallery' }
  ];
  for (const section of sections) {
    if (window.location.hash !== '' && window.location.hash !== '#/') return;
      const sectionHTML = await createSection(section);
    if (window.location.hash === '' || window.location.hash === '#/') {
      content.insertAdjacentHTML('beforeend', sectionHTML);
    }
  }

  if (window.location.hash === '' || window.location.hash === '#/') {
    const randomDiv = document.getElementById('randomDiv');
    randomDiv.style.display = 'block';
    updateSlides();
    hideLoader();
    initSlideshow();
    initFlashcardHover();
    initGalleryControls();
    randomAnime();
    getGenres();
    console.log('Home page loaded');
  }
}

async function updateSlides() {
  const slides = document.querySelectorAll('.slide[data-mal-id]');
  for (const slide of slides) {
    if (window.location.hash !== '' && window.location.hash !== '#/') break;

    const mal_id = slide.dataset.malId;
    try {
      const res = await getAnimeInfo(mal_id);
      const data = res?.data;
      if (!data) continue;
      if (window.location.hash !== '' && window.location.hash !== '#/') break;

      const episodes = data.episodes || 'N/A';
      const score = data.score || 'N/A';
      const members = (data.members || 0).toLocaleString();
      const rank = data.rank || 'N/A';

      const newEpisodesHTML = `<i class="fas fa-play-circle"></i> ${episodes} Episodes`;
      const newScoreHTML = `<i class="fas fa-star"></i> ${score}`;
      const newMembersHTML = `<i class="fas fa-users"></i> ${members}`;
      const newRankHTML = `<i class="fas fa-trophy"></i> Rank: #${rank}`;

      const episodesElem = slide.querySelector('[data-type="episodes"]');
      const scoreElem = slide.querySelector('[data-type="score"]');
      const membersElem = slide.querySelector('[data-type="members"]');
      const rankElem = slide.querySelector('[data-type="rank"]');

      if (episodesElem && episodesElem.innerHTML.trim() !== newEpisodesHTML.trim()) {
        episodesElem.innerHTML = newEpisodesHTML;
      }
      if (scoreElem && scoreElem.innerHTML.trim() !== newScoreHTML.trim()) {
        scoreElem.innerHTML = newScoreHTML;
      }
      if (membersElem && membersElem.innerHTML.trim() !== newMembersHTML.trim()) {
        membersElem.innerHTML = newMembersHTML;
      }
      if (rankElem && rankElem.innerHTML.trim() !== newRankHTML.trim()) {
        rankElem.innerHTML = newRankHTML;
      }
    } catch (e) {
      console.warn('Failed to update slide details:', e);
    }
  }
}

// WARNING!!! : this one was AI:
export function load404(path) {
  const currentHash = window.location.hash;
  if (currentHash.substring(1) !== path) return;
  console.log('Loading 404 Page');
  document.getElementById('navhome').style.color = '#ddd';
  document.getElementById('navsearch').style.color = '#ddd';
  const content = document.getElementById('content');
  hideLoader();

  content.innerHTML = `
    <div class="not-found-container">
      <div class="not-found-text">404</div>
      <h2>Oops! Page Not Found</h2>
      <p>The page you're looking for at <code>${path}</code> doesn't exist.</p>
      <p>Redirecting to homepage in <span id="countdown">5</span> seconds...</p>
      <a href="./#/" class="btn-home">Back to Home</a>
    </div>
  `;

  let countdown = 5;
  const countdownElement = document.getElementById('countdown');
  const interval = setInterval(() => {
    countdown--;
    if (countdownElement) countdownElement.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(interval);
      window.location.href = './#/';
    }
  }, 1000);
  window.addEventListener('hashchange', () => clearInterval(interval), { once: true });
}
