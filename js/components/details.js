import { getAnimeDetails, getAnimeCharacters, getAnimeStaff, getAnimeInfo, getRandomAnime, getAnimeReviews } from '../api.js';
import { initFlashcardHover, initGalleryControls, randomAnime } from './initializer.js';
import { showLoader, hideLoader, loadCSS, load404, updateMetaTags } from '../pages.js';
import { createFlashcard, escapeHTML } from './UIs.js';
import { supabase } from '../supabase.js';

export async function loadDetailsPage(animeId = null) {
  console.log(`Loading Details for anime ID: ${animeId}`);
  loadCSS('./css/details.css');
  document.getElementById('navhome').style.color = '#ddd';
  document.getElementById('navsearch').style.color = '#ddd';
  const content = document.getElementById('content');
  content.innerHTML = '';
  const randomDiv = document.getElementById('randomDiv');
  if (randomDiv) randomDiv.style.display = 'block';
  randomAnime();
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = './media/details-bg.webp';
  link.as = 'image';
  link.type = 'image/webp';
  document.head.appendChild(link);

  showLoader();

  try {
    const isRandom = animeId === 'random';
    const anime = isRandom ? await getRandomAnime() : await getAnimeDetails(animeId);

    if (!anime || !anime.mal_id) {
      throw new Error('Anime data not found.');
    }

    animeId = anime.mal_id;
    document.title = anime.title_english || anime.title;
    const description = `Learn about ${anime.title_english || anime.title} on MediaRoster: ${(anime.synopsis || '').substring(0, 50)}...`;
    const keywords = [
      anime.title,
      anime.title_english,
      ...(anime.titles?.map(t => t.title) || []),
      ...(anime.genres?.map(g => g.name) || []),
      'mediaroster', 'anime', 'details'
    ].filter(Boolean);
    console.log(`set meta Keywords:${keywords}, Description: ${description}`)

    updateMetaTags(description, [...new Set(keywords)]);

    const currentHash = `#/details-${animeId}`;
    if (isRandom) {
      history.replaceState(null, null, currentHash);
    }

    const titlesHTML = [
      ...(anime.title_synonyms || []).map(s => `<li>${s}</li>`),
      ...(anime.titles || []).map(t => `<li>${t.type}: ${t.title}</li>`)
    ].join('');

    const genresHTML = (anime.genres && anime.genres.length > 0)
      ? `
        <div class="details-genres-inner">
            <h2 class="genres-header">Genres</h2>
            <div class="details-genres-list">
                ${anime.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
            </div>
        </div>
      `
      : '';

    const seasonHTML = anime.season
      ? `${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)}`
      : 'N/A';

    const yearHTML = anime.year || 'N/A';


    let embed;

    if (anime.trailer?.embed_url) {
      embed = anime.trailer.embed_url
        .replace('&autoplay=1', '')
        .replace('?autoplay=1', '') +
        '&modestbranding=1&showinfo=0&rel=0';
    }
    else if (Math.floor(Math.random() * 20) === 0) {
      embed = window.location.origin;
    }
    const isEgg = embed === window.location;
    const trailerHTML = embed
      ? `
    <div class="details-trailer">
        <h2>${isEgg ? 'Trailer (?)' : 'Trailer'}</h2>
        <div class="trailer-container ${isEgg ? 'trailer-egg' : ''}">
            <iframe
                loading="lazy"
                src="${embed}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
            </iframe>

            ${isEgg
        ? `
                <div class="egg-msg">
                    <p>No luck with the trailer.</p>
                    <p>Keep browsing instead.</p>
                </div>
                `
        : ''
      }
        </div>
    </div>
    `
      : `
    <div class="details-trailer">
        <h2>Trailer</h2>
        <div class="trailer-container">
            <div class="trailer-failure">
                No trailer available
            </div>
        </div>
    </div>
    `;
    const relationsHTML = `<div class="loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    const heroStatsHTML = `
        <div class="details-stats hero-stats">
            <div class="stat-box">
                <h3>Score</h3>
                <p class="stat-value-large">${anime.score ? `⭐ ${anime.score}` : 'N/A'}</p>
            </div>
            <div class="stat-box">
                <h3>Popularity</h3>
                <p class="stat-value-large">#${anime.popularity || 'N/A'}</p>
            </div>
            <div class="stat-box">
                <h3>Members</h3>
                <p class="stat-value-large">${anime.members?.toLocaleString() || 'N/A'}</p>
            </div>
            <div class="stat-box">
                <h3>Rank</h3>
                <p class="stat-value-large">#${anime.rank || 'N/A'}</p>
            </div>
        </div>
    `;

    const productionHTML = `
      <div class="details-genres-inner">
          <h2 class="genres-header">Producers</h2>
          <div class="details-genres-list">
              ${(anime.producers && anime.producers.length > 0) ? anime.producers.map(p => `<span class="genre-tag">${p.name}</span>`).join('') : '<span class="genre-tag is-na">N/A</span>'}
          </div>
      </div>
      <div class="details-genres-inner">
          <h2 class="genres-header">Licensors</h2>
          <div class="details-genres-list">
              ${(anime.licensors && anime.licensors.length > 0) ? anime.licensors.map(l => `<span class="genre-tag">${l.name}</span>`).join('') : '<span class="genre-tag is-na">N/A</span>'}
          </div>
      </div>
      <div class="details-genres-inner">
          <h2 class="genres-header">Studios</h2>
          <div class="details-genres-list">
              ${(anime.studios && anime.studios.length > 0) ? anime.studios.map(s => `<span class="genre-tag">${s.name}</span>`).join('') : '<span class="genre-tag is-na">N/A</span>'}
          </div>
      </div>
      <div class="themes-section">
          <h4>Opening Themes</h4>
          <ul>${(anime.theme?.openings && anime.theme.openings.length > 0) ? anime.theme.openings.map(op => `<li>${op}</li>`).join('') : '<li>No opening themes found.</li>'}</ul>
          <h4>Ending Themes</h4>
          <ul>${(anime.theme?.endings && anime.theme.endings.length > 0) ? anime.theme.endings.map(ed => `<li>${ed}</li>`).join('') : '<li>No ending themes found.</li>'}</ul>
      </div>
      <div class="links-section">
          <div class="external-links">
              <h4>External Links</h4>
              <div class="links-container">
                  ${(anime.external && anime.external.length > 0) ? anime.external.map(link => `<a href="${link.url}" target="_blank" class="link-button"><i class="fa-solid fa-arrow-up-right-from-square"></i>${link.name}</a>`).join('') : '<p>No external links available.</p>'}
              </div>
          </div>
          <div class="streaming-platforms">
              <h4>Streaming Platforms</h4>
              <div class="links-container">
                  ${(anime.streaming && anime.streaming.length > 0) ? anime.streaming.map(link => `<a href="${link.url}" target="_blank" class="link-button"><i class="fas fa-play-circle"></i>${link.name}</a>`).join('') : '<p>No streaming links available.</p>'}
              </div>
          </div>
      </div>
    `;
    const charactersHTML = `<div class="loader">
                              <div class="dot"></div>
                              <div class="dot"></div>
                              <div class="dot"></div>
                            </div>`;
    const staffHTML = charactersHTML;
    const reviewsHTML = `
      <div class="reviews-container">
        <h2 class="floating-header">What People Have to Say</h2>
        <div class="reviews-controls">
          <button type="button" class="gallery-prev" aria-label="Previous review">&lt;</button>
          <button type="button" class="gallery-next" aria-label="Next review">&gt;</button>
        </div>
        <div class="loader" id="reviews-loader">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
    const detailsHTML = `
      <div class="details-hero-wrapper">
        <div class="details-hero-top-bar">
          <div class="details-watchlist-wrapper">
            <button id="details-watchlist-btn" class="details-watchlist-btn" data-id="${anime.mal_id}" aria-label="Add to Watchlist">
              <i class="fa-solid fa-bookmark"></i>
              <span>Add to Watchlist</span>
            </button>
          </div>
          <h1 class="details-title">${anime.title_english || anime.title}</h1>
        </div>
        <div class="details-hero">
          <div class="details-poster-group">
            <div class="details-poster">
              <img src="${anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.imagea?.jpg?.large_image_url}" alt="${anime.title || 'No Title'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/>
              <div class="placeholder-icon" style="display: none;"><i class="fas fa-question-circle"></i></div>
            </div>
          </div>
          <div class="details-info">
            ${heroStatsHTML}
          </div>
          <div class="details-synopsis-wrapper">
            <h2 class="synopsis-header">Synopsis</h2>
            <p class="details-synopsis is-clamped" id="details-synopsis-text">${escapeHTML(anime.synopsis || 'No synopsis available.')}</p>
            <button type="button" class="synopsis-show-more" id="synopsis-show-more" hidden>Show more</button>
          </div>
        </div>
      </div>
      <div class="details-container">
        <div class="quick-facts-table">
            <div class="fact-item"><span class="fact-label">Type:</span><span class="fact-value">${anime.type || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Episodes:</span><span class="fact-value">${anime.episodes || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Status:</span><span class="fact-value">${anime.status || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Aired:</span><span class="fact-value">${anime.aired?.string || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Season:</span><span class="fact-value">${seasonHTML}</span></div>
            <div class="fact-item"><span class="fact-label">Year:</span><span class="fact-value">${yearHTML}</span></div>
            <div class="fact-item"><span class="fact-label">Rating:</span><span class="fact-value">${anime.rating || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Source:</span><span class="fact-value">${anime.source || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Scored By:</span><span class="fact-value">${anime.scored_by?.toLocaleString() || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Duration:</span><span class="fact-value">${anime.duration || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Favorites:</span><span class="fact-value">${anime.favorites?.toLocaleString() || 'N/A'}</span></div>
            <div class="fact-item"><span class="fact-label">Official Source:</span><span class="fact-value"><a href="${anime.url || '#'}" target="_blank" class="source-link">MyAnimeList</a></span></div>
        </div>

        <nav class="details-nav">
          <div class="details-nav-item active" data-target="overview">Overview</div>
          <div class="details-nav-item" data-target="relations">Relations</div>
          <div class="details-nav-item" data-target="production">Production</div>
          <div class="details-nav-item" data-target="characters">Characters</div>
          <div class="details-nav-item" data-target="staff">Staff</div>
        </nav>

        <div id="overview" class="details-section active">
            <div class="details-titles-box">
              <h2>Also Known As: </h2>
              <ul class="titles-list">${titlesHTML}</ul>
            </div>
            ${genresHTML}
            <h2 class="floating-header">Background</h2>
            <p>${anime.background || 'No background information available.'}</p>
        </div>

        <div id="relations" class="details-section">
          <div id="relations-container">
            ${relationsHTML}
          </div>
        </div>

        <div id="production" class="details-section">
          ${productionHTML}
        </div>

        <div id="characters" class="details-section">
          ${charactersHTML}
        </div>

        <div id="staff" class="details-section">
          ${staffHTML}
        </div>
        ${reviewsHTML}
        ${trailerHTML}
      </div>
    `;

    if (window.location.hash === currentHash) {
      content.innerHTML = detailsHTML;
      initDetailsNav();
      initWatchlistButton(animeId);
      initSynopsisToggle();
      loadReviews(animeId);
      loadCharecters(animeId);
      loadStaff(animeId);
      loadRelations(anime.relations, animeId);
    }
  } catch (error) {
    console.error('Failed to load anime details:', error);
    load404(`details-${animeId}`);
  } finally {
    if (window.location.hash === `#/details-${animeId}`) {
      hideLoader();
    }
  }
}

async function loadRelations(relations, animeId) {
  const container = document.getElementById('relations-container');
  if (!relations || relations.length === 0) {
    if (container) container.innerHTML = '<p>No related anime found.</p>';
    return;
  }
  const currentHash = `#/details-${animeId}`;

  if (window.location.hash === currentHash) {
    container.innerHTML = '';
    for (const relation of relations) {
      if (window.location.hash !== currentHash) return;

      const group = document.createElement('div');
      group.className = 'relation-group';

      const title = document.createElement('h2');
      title.className = 'floating-header';
      title.textContent = relation.relation;
      group.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'gridGallery';
      grid.style.justifyContent = 'none';
      group.appendChild(grid);
      container.appendChild(group);

      for (const entry of relation.entry) {
        let cardHTML = '';
        if (entry.type === 'anime') {
          try {
            if (window.location.hash !== currentHash) return;
            const animeInfo = await getAnimeInfo(entry.mal_id);
            if (animeInfo) {
              cardHTML = createFlashcard(animeInfo, 'top-rated');
            } else {
              console.log(`no info ${animeInfo}`)
              cardHTML = createFallbackCard(entry);
            }
          } catch (error) {
            console.error(`Failed to fetch info for anime ID: ${entry.mal_id}`, error);
            if (window.location.hash !== currentHash) return;
            cardHTML = createFallbackCard(entry);
          }
        } else {
          console.log('not anime')
          cardHTML = createFallbackCard(entry);
        }

        if (window.location.hash !== currentHash) return;
        grid.insertAdjacentHTML('beforeend', cardHTML);
      }
    }
  } else return;
  initFlashcardHover();
}

function createFallbackCard(entry) {
  return `
    <a href="${entry.url}" target="_blank" class="relation-card-fallback">
      <span class="relation-card-title">${entry.name}</span>
      <span class="relation-card-type">${entry.type}</span>
    </a>
  `;
}

function initDetailsNav() {
  const navItems = document.querySelectorAll('.details-nav-item');
  const sections = document.querySelectorAll('.details-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      sections.forEach(sec => sec.classList.remove('active'));

      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });
}

async function loadCharecters(animeId) {
  const currentHash = `#/details-${animeId}`;
  let charactersData = null;
  try {
    charactersData = await getAnimeCharacters(animeId);
  } catch (error) {
    console.error('Failed to load characters:', error);
  }
  console.log(charactersData)

  if (window.location.hash !== currentHash) return;

  const charContainer = document.getElementById('characters');
  if (charContainer) {
    charContainer.innerHTML = (charactersData && charactersData.length > 0)
      ? `<div class="character-grid">${charactersData.map(char => {
        const imgSrc = char.character.images.webp.image_url;
        const isPlaceholder = imgSrc.includes('questionmark');
        const imgHtml = isPlaceholder ? '<div class="placeholder-icon"><i class="fas fa-user"></i></div>' : '<img src="' + imgSrc + '" loading="lazy" alt="' + char.character.name + '">';
        const voiceHtml = char.voice_actors && char.voice_actors.length > 0 ? '<p class="voice-actor"><b>Voice Actor:</b> ' + char.voice_actors[0].person.name + ' (' + char.voice_actors[0].language + ')</p>' : '';
        return `
      <div class="character-card">
          ${imgHtml}
          <div class="character-info">
              <h5>${char.character.name}</h5>
              <p>${char.role}</p>
              ${voiceHtml}
          </div>
      </div>`
      }).join('')}</div>`
      : '<p>No character information available.</p>';
  } 1
}

async function loadStaff(animeId) {
  const currentHash = `#/details-${animeId}`;
  let staffData = null;
  try {
    staffData = await getAnimeStaff(animeId);
  } catch (error) {
    console.error('Failed to load staff:', error);
  }

  console.log(staffData)
  if (window.location.hash !== currentHash) return;

  const staffContainer = document.getElementById('staff');
  if (staffContainer) {
    staffContainer.innerHTML = (staffData && staffData.length > 0)
      ? `<div class="staff-grid">${staffData.map(staff => {
        const imgSrc = staff.person.images.jpg.image_url;
        const isPlaceholder = imgSrc.includes('questionmark');
        const imgHtml = isPlaceholder ? '<div class="placeholder-icon"><i class="fas fa-image"></i></div>' : '<img src="' + imgSrc + '" loading="lazy" alt="' + staff.person.name + '">';
        return `
       <div class="staff-card">
           ${imgHtml}
           <div class="staff-info">
               <h5>${staff.person.name}</h5>
               <p>${staff.positions.join(', ')}</p>
           </div>
       </div>`
      }).join('')}</div>`
      : '<p>No staff information available.</p>';
  }
}

async function loadReviews(animeId) {
  const currentHash = `#/details-${animeId}`;
  const container = document.querySelector('.reviews-container');
  const galleryContainer = document.createElement('div');
  const loader = document.getElementById('reviews-loader');
  galleryContainer.className = 'horizontal-gallery';
  galleryContainer.setAttribute('aria-label', 'Anime reviews');

  try {
    const reviewsData = await getAnimeReviews(animeId);
    if (window.location.hash !== currentHash) return;

    if (!reviewsData || reviewsData.length === 0) {
      if (loader) loader.remove();
      container.innerHTML += '<p style="text-align: center; color: var(--text-color); padding: 2rem;">No reviews available.</p>';
      return;
    }

    const reviewCardsHTML = reviewsData.map(review => createReviewCard(review)).join('');
    galleryContainer.innerHTML = reviewCardsHTML;
    container.appendChild(galleryContainer);
    initGalleryControls();
    initReviewsStuff();
  } catch (error) {
    console.error('Failed to load reviews:', error);
    if (window.location.hash !== currentHash) return;
    container.innerHTML += '<p style="text-align: center; color: var(--error-color); padding: 2rem;">Failed to load reviews.</p>';
  } finally {
    if (window.location.hash === currentHash && loader) {
      loader.remove();
    }
  }
}

function createReviewCard(review) {
  const score = review.score || 0;
  const username = review.user?.username || 'Anonymous';
  const malId = review.mal_id || 'N/A';
  const reviewText = review.review || 'Prolly nothing important';
  const truncatedText = reviewText.length < 300
    ? reviewText
    : reviewText.substring(0, 300) + '...';

  return `
    <div class="review-card" data-full-text="${escapeHTML(reviewText)}" data-score="${score}" data-username="${username}">
      <div class="review-quote-icon">
        <i class="fas fa-quote-left"></i>
      </div>
      <div class="review-content">
        <p class="review-text">${escapeHTML(truncatedText)}</p>
      </div>
      <div class="review-footer">
        <div class="review-user">
          <div class="review-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="review-user-info">
            <span class="review-username">${username}</span>
            <span class="review-mal-id">MyAnimeList ID: ${malId}</span>
          </div>
        </div>
        <div class="review-rating">
          <i class="fas fa-star"></i>
          <span class="review-score">${score}</span>
        </div>
      </div>
    </div>
  `;
};

function initReviewsStuff() {
  const reviewCards = document.querySelectorAll('.review-card');
  console.log(reviewCards)
  function showIcon(card) {
    console.log('showing icon')
    const iconOverlay = document.createElement('div')
    iconOverlay.className = "review-icon"
    iconOverlay.innerHTML = `
      <i class="fa-solid fa-book-open"></i>
      <p>Read More</p>
    `
    card.appendChild(iconOverlay);
  }

  function hideIcon(card) {
    console.log('removing icon')
    const icon = card.querySelector('.review-icon');
    if (icon) icon.remove();
  }

  function showReview(card) {
    console.log('showing review popup');

    const container = document.getElementById('popup');

    const review = card.dataset.fullText;
    const name = card.dataset.username;
    const score = card.dataset.score;

    container.hidden = false;
    container.style.display = 'flex';
    container.style.zIndex = '9999';
    container.innerHTML = '';

    const contentDiv = document.createElement('div');
    contentDiv.id = 'popup-content';

    contentDiv.innerHTML = `
      <div class="popup-top-bar">
        <h3 class="popup-reviewer-title">
          <span class="popup-reviewer-name">${escapeHTML(name)}</span>
          <span class="popup-reviewer-score"><i class="fas fa-star"></i> ${escapeHTML(score)}</span>
        </h3>
        <button id="popup-close" class="popup-close-btn" aria-label="Close popup">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="popup-body">
        <p>${escapeHTML(review)}</p>
      </div>
    `;

    container.addEventListener('scroll', (e) => {
      e.stopPropagation();
    });

    container.appendChild(contentDiv);

    const closePopup = () => {
      container.hidden = true;
      container.style.display = 'none';
      container.style.zIndex = '-10';
      container.innerHTML = '';
    };

    container.onclick = (e) => {
      if (e.target === container) {
        closePopup();
      }
    };

    const closeBtn = document.getElementById('popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePopup);
    }
  }

  reviewCards.forEach((card) => {
    card.addEventListener('mouseenter', () => { showIcon(card) });
    card.addEventListener('mouseleave', () => { hideIcon(card) });
    card.addEventListener('touchstart', () => { showIcon(card) });
    card.addEventListener('touchend', () => { hideIcon(card) });
    card.addEventListener('click', () => { showReview(card) })
  });
};

function initSynopsisToggle() {
  const text = document.getElementById('details-synopsis-text');
  const btn = document.getElementById('synopsis-show-more');
  if (!text || !btn) return;

  requestAnimationFrame(() => {
    const isOverflowing = text.scrollHeight > text.clientHeight + 1;
    if (!isOverflowing) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const expanded = text.classList.toggle('is-clamped') === false;
      btn.textContent = expanded ? 'Show less' : 'Show more';
    });
  });
}

async function initWatchlistButton(animeId) {
  const btn = document.getElementById('details-watchlist-btn');
  if (!btn) return;

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    btn.addEventListener('click', () => {
      window.location.hash = '#/signin';
    });
    return;
  }

  let currentEntry = null;
  try {
    const { data: entry } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'anime')
      .eq('id', animeId)
      .maybeSingle();

    currentEntry = entry;
    updateWatchlistButtonUI(btn, currentEntry);
  } catch (err) {
    console.warn('Error checking watchlist status:', err);
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      if (currentEntry) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'anime')
          .eq('id', animeId);

        if (error) throw error;
        currentEntry = null;
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            type: 'anime',
            id: animeId,
            status: 'plan_to_watch'
          });

        if (error) throw error;
        currentEntry = { status: 'plan_to_watch' };
      }
      updateWatchlistButtonUI(btn, currentEntry);
    } catch (err) {
      console.error('Failed to update watchlist:', err);
      alert('Could not update watchlist. Please try again.');
    } finally {
      btn.disabled = false;
    }
  });
}

function updateWatchlistButtonUI(btn, entry) {
  if (entry) {
    btn.className = 'details-watchlist-btn in-watchlist';
    btn.innerHTML = `
      <i class="fas fa-bookmark"></i>
      <span>In Watchlist</span>
    `;
    btn.title = `In your watchlist (${entry.status}). Click to remove.`;
  } else {
    btn.className = 'details-watchlist-btn';
    btn.innerHTML = `
      <i class="fa-solid fa-bookmark"></i>
      <span>Add to Watchlist</span>
    `;
  }
}