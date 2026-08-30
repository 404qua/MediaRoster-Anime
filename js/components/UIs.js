export function createFlashcard(anime, cardType) {
    const imageUrl = anime.images?.webp?.image_url || anime.images?.jpg?.image_url || 'placeholder.png';
    const title = anime.title_english || anime.title;
    const synopsis = escapeHTML(anime.synopsis || anime.background || 'No synopsis available.');
    const detailsUrl = `#/details-${anime.mal_id}`;
    let studios = anime.studios?.map(s => s.name).join(', ') || 'Unknown'
    studios = studios.length < 20 ? studios : studios.slice(0, 20) + '...';
    const genres = anime.genres?.map(g => g.name).join(', ') || 'Unknown';

    let overlayDetails = '';
    let badges = '';

    switch (cardType) {
        case 'top-rated':
            overlayDetails = `
              <div class="flashcard-episodes"><i class="fas fa-play-circle"></i> ${anime.episodes || 'N/A'} episodes</div>
              <div class="flashcard-status"><i class="fas fa-tv"></i> ${anime.status || 'Unknown'}</div>
          `;
            badges = `
              <div class="flashcard-rank">#${anime.rank || ''}</div>
              <div class="flashcard-rating"><i class="fas fa-star"></i> ${anime.score || 'N/A'}</div>
              <div class="flashcard-type"><i class="fas fa-video"></i> ${anime.type || 'N/A'}</div>
          `;
            break;
        case 'most-popular':
            overlayDetails = `
              <div class="flashcard-episodes"><i class="fas fa-play-circle"></i> ${anime.episodes || 'N/A'} episodes</div>
              <div class="flashcard-status"><i class="fas fa-tv"></i> ${anime.status || 'Unknown'}</div>
          `;
            badges = `
              <div class="flashcard-rank">#${anime.popularity || ''}</div>
              <div class="flashcard-rating"><i class="fa-solid fa-user-group"></i>${anime.members?.toLocaleString() || 'N/A'}</div>
              <div class="flashcard-type"><i class="fas fa-video"></i> ${anime.type || 'N/A'}</div>
          `;
            break;
        case 'airing':
            overlayDetails = `
              <div class="flashcard-studio"><i class="fa-solid fa-clapperboard"></i>${studios}</div>
              <div class="flashcard-status"><i class="fas fa-calendar-days"></i> ${anime.broadcast?.string || 'Unscheduled'}</div>
          `;
            badges = `
              <div class="flashcard-rank">#${anime.rank || ''}</div>
              <div class="flashcard-rating"><i class="fas fa-star"></i> ${anime.score || 'N/A'}</div>
              <div class="flashcard-type"><i class="fas fa-video"></i> ${anime.type || 'N/A'}</div>
          `;
            break;
        case 'seasonal':
            overlayDetails = `
              <div class="flashcard-episodes"><i class="fas fa-play-circle"></i> ${anime.episodes || 'N/A'} episodes</div>
              <div class="flashcard-studio"><i class="fa-solid fa-clapperboard"></i>${studios}</div>
          `;
            badges = `
              <div class="flashcard-rank">#${anime.rank || ''}</div>
              <div class="flashcard-rating"><i class="fas fa-star"></i> ${anime.score || 'N/A'}</div>
              <div class="flashcard-type"><i class="fas fa-video"></i> ${anime.type || 'N/A'}</div>
          `;
            break;
    }

    return `
      <a href="./${detailsUrl}" class="flashcard-link" data-synopsis="${synopsis}" data-type="${anime.type}" data-title="${title}" data-popularity="${anime.popularity}" data-rank="${anime.rank}" data-score="${anime.score}" data-status="${anime.status}" data-genres="${genres}" data-episodes="${anime.episodes}" data-studios="${studios}" data-rating="${anime.rating}">
          <div class="flashcard">
              <img src="${imageUrl}" loading="lazy" alt="${title}" class="flashcard-image" width="225" height="320">
              <div class="flashcard-overlay">
                  <div class="flashcard-title">${title}</div>
                  ${overlayDetails}
              </div>
              ${badges}
          </div>
      </a>
  `;
}

export async function createSection({ title, apiFunction, cardType, containerClass, titleClass, galleryClass }) {
    try {
        const animeList = await apiFunction();
        if (!animeList || animeList.length === 0) {
            return `<div class="${containerClass}"><h2 class="${titleClass}">${title}</h2><p>No anime found for this category.</p></div>`;
        }
        const galleryHTML = animeList.map(anime => createFlashcard(anime, cardType)).join('');

        return galleryClass === 'horizontal-gallery'
            ? `
            <div class="${containerClass}">
                <h2 class="${titleClass} floating-header">${title}</h2>
                <div class="gallery-prev">&lt;</div>
                <div class="${galleryClass}">
                    ${galleryHTML}
                </div>
                <div class="gallery-next">&gt;</div>
            </div>
        ` : `
            <div class="${containerClass}">
                <h2 class="${titleClass} floating-header">${cardType === 'seasonal' ? `${title} (${animeList[0].season}, ${animeList[0].year})` : title}</h2>
                <div class="${galleryClass}">
                    ${galleryHTML}
                </div>
            </div>
        `;
    } catch (error) {
        console.error(`Failed to load ${title}:`, error);
        return `<div class="error">Failed to load ${title}. Please try again later.</div>`;
    }
}
export function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'`=\/]/g, m => {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            case '`': return '&#096;';
            case '=': return '&#x3D;';
            case '/': return '&#x2F;';
            default: return m;
        }
    });
}