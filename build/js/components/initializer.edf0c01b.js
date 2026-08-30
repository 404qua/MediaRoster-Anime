export const status = {"searching":false, "popupInit":false}

export function initSlideshow() {
  let slideIndex = 0;
  const slides = document.querySelectorAll('.slide');
  const prev = document.querySelector('.prev');
  const next = document.querySelector('.next');
  let interval;

  function showSlides() {
    slides.forEach(slide => slide.classList.remove('active'));
    if (slideIndex >= slides.length) slideIndex = 0;
    if (slideIndex < 0) slideIndex = slides.length - 1;
    if (slides[slideIndex]) {
      slides[slideIndex].classList.add('active');
    }
  }

  function resetInterval() {
    clearInterval(interval);
    interval = setInterval(() => {
      slideIndex++;
      showSlides();
    }, 7000);
  }

  if (prev && next) {
    prev.addEventListener('click', (e) => {
      e.preventDefault();
      slideIndex--;
      showSlides();
      resetInterval();
    });

    next.addEventListener('click', (e) => {
      e.preventDefault();
      slideIndex++;
      showSlides();
      resetInterval();
    });
  }

  // Swipe functionality with threshold check to avoid interfering with vertical scroll
  const slideshowContainer = document.querySelector('.slideshow-container');
  if (slideshowContainer) {
    let touchstartX = 0;
    let touchstartY = 0;
    let touchendX = 0;
    let touchendY = 0;
    let lastSwipeAt = 0;

    function handleGesture() {
      const deltaX = touchendX - touchstartX;
      const deltaY = touchendY - touchstartY;

      // Ensure it's a deliberate horizontal swipe (at least 45px, and more horizontal than vertical)
      if (Date.now() - lastSwipeAt < 1200) return;
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        lastSwipeAt = Date.now();
        if (deltaX < 0) {
          slideIndex++;
          showSlides();
          resetInterval();
        } else {
          slideIndex--;
          showSlides();
          resetInterval();
        }
      }
    }

    slideshowContainer.addEventListener('touchstart', e => {
      touchstartX = e.changedTouches[0].clientX;
      touchstartY = e.changedTouches[0].clientY;
    }, { passive: true });

    slideshowContainer.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].clientX;
      touchendY = e.changedTouches[0].clientY;
      handleGesture();
    }, { passive: true });
  }

  showSlides();
  resetInterval();
}

export function initFlashcardHover() {
    const isMobile = window.innerWidth <= 768 || (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    if (isMobile) {
      const popup = document.getElementById('flash-popup');
      if (popup) popup.hidden = true;
      return;
    }

    const flashcards = document.querySelectorAll('.flashcard-link:not([data-popup-init])');
    const popup = document.getElementById('flash-popup');
    if (!popup) return;

    let onCard = false;
    let onPopup = false;
    let activeCard = null;
    let popupHide = null;
  
    if (!status.popupInit) {
      let resizeRaf = null;
      window.addEventListener('resize', () => {
        if (resizeRaf) return;
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = null;
          if (!popup.hidden && activeCard) positionPopup(activeCard);
        });
      });
  
      let scrollRaf = null;
      window.addEventListener('scroll', () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = null;
          if (!popup.hidden && activeCard) positionPopup(activeCard);
        });
      }, { passive: true });
      
      popup.addEventListener('mouseenter', () => {
        onPopup = true;
        if (popupHide) clearTimeout(popupHide);
      });
  
      popup.addEventListener('mouseleave', (e) => {
        onPopup = false;
        if (e.relatedTarget && e.relatedTarget.closest('.flashcard-link')) return;
        if (activeCard && activeCard.contains(e.relatedTarget)) return;
        popupHide = setTimeout(tryHide, 80);
      });
  
      document.addEventListener('click', (e) => {
        if (activeCard && !activeCard.contains(e.target) && !popup.contains(e.target)) {
          hidePopup();
        }
      });

      window.addEventListener('hashchange', () => {
        onCard = false;
        onPopup = false;
        activeCard = null;
        hidePopup();
      });
      status.popupInit = true;
    }
  
    function positionPopup(card) {
        const pos = card.getBoundingClientRect();
        const popupWidth = Math.min(320, window.innerWidth - 30);
        const margin = 12;

        let left = pos.right + margin;
        if (left + popupWidth > window.innerWidth - margin) {
            left = pos.left - popupWidth - margin;
            if (left < margin) {
                left = Math.max(margin, (window.innerWidth - popupWidth) / 2);
            }
        }

        let top = pos.top;
        if (top + 280 > window.innerHeight) {
            top = Math.max(margin + 60, window.innerHeight - 300);
        }

        popup.style.left = `${Math.round(left)}px`;
        popup.style.top = `${Math.round(top)}px`;
        popup.style.width = `${popupWidth}px`;
        popup.hidden = false;
        popup.style.zIndex = '1000';
    }
  
    function addPopup(card) {
      const d = card.dataset;
      const title = d.title || 'Anime';
      const synopsis = d.synopsis || 'No synopsis available.';
      const genres = d.genres || 'Unknown';
      const studios = d.studios || 'Unknown';
      const statusText = d.status ? ` • ${d.status}` : '';

      popup.innerHTML = `
        <div class="flash-popup-header">
          <div id="flash-popup-title">${title}</div>
          <div id="flash-popup-status">${statusText}</div>
        </div>
        <p id="flash-popup-synopsis">${synopsis}</p>
        <div class="flash-popup-meta-footer">
          <p id="flash-popup-genres"><span>Genres: </span>${genres}</p>
          <p id="flash-popup-studios"><span>Studios: </span>${studios}</p>
        </div>
      `;
      positionPopup(card);
    }
  
    flashcards.forEach(card => {
      if (card.dataset.popupInit === 'true') return;
      card.dataset.popupInit = 'true';
  
      card.addEventListener('mouseenter', () => {
        if (popupHide) clearTimeout(popupHide);
        onCard = true;
        activeCard = card;
        addPopup(card);
      });
  
      card.addEventListener('mouseleave', (e) => {
        onCard = false;
        if (popup.contains(e.relatedTarget)) return; 
        popupHide = setTimeout(tryHide, 80);
      });
    });
  
    function tryHide() {
      if (!onCard && !onPopup) hidePopup();
    }
  
    function hidePopup() {
      activeCard = null;
      popup.hidden = true;
      popup.innerHTML = '';
      popup.style.left = '';
      popup.style.top = '';
      popup.style.zIndex = '-10';
    }
  }

export function initGalleryControls() {
  const prevButtons = document.querySelectorAll('.gallery-prev');
  const nextButtons = document.querySelectorAll('.gallery-next');

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gallery = btn.closest('.reviews-container, .top-rated-container, .airing-container, .seasonal-container')?.querySelector('.horizontal-gallery');
      if (gallery) {
        gallery.scrollBy({
          left: -400,
          behavior: 'smooth'
        });
      }
    });
  });

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gallery = btn.closest('.reviews-container, .top-rated-container, .airing-container, .seasonal-container')?.querySelector('.horizontal-gallery');
      if (gallery) {
        gallery.scrollBy({
          left: 400,
          behavior: 'smooth'
        });
      }
    });
  });
}

// random
export function randomAnime() {
  const randomButton = document.getElementById('random-anime-button');
  if (!randomButton || randomButton.dataset.randomInit === 'true') return;
  randomButton.dataset.randomInit = 'true';
  randomButton.addEventListener('click', () => {
    const chance = Math.floor(Math.random() * 100);
    if (chance < 1) {
      triggerJumpscare();
    } else {
      window.location.hash = '#/details-random'
    }
  });
}

function triggerJumpscare() {
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  const loader = document.getElementById('loader');

  if (header) header.style.display = 'none';
  if (main) main.style.display = 'none';
  if (footer) footer.style.display = 'none';
  if (loader) loader.style.display = 'none';

  const jumpscareContainer = document.createElement('div');
  jumpscareContainer.id = 'jumpscare-container';

  const jumpscareImage = document.createElement('img');
  jumpscareImage.src = './media/jumpscare.jpg';
  jumpscareImage.id = 'jumpscare-image';

  const jumpscareAudio = new Audio('./media/jumpscare.mp3');

  jumpscareContainer.appendChild(jumpscareImage);
  document.body.appendChild(jumpscareContainer);

  if (jumpscareContainer.requestFullscreen) {
    jumpscareContainer.requestFullscreen();
  }

  jumpscareAudio.play().catch(e => console.error("Couldn't play jumpscare audio, maybe it's missing?"));

  setTimeout(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    jumpscareContainer.remove();
    window.location.href = './';
  }, 3000);
}