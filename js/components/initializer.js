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
    slides[slideIndex].classList.add('active');
  }

  function resetInterval() {
    clearInterval(interval);
    interval = setInterval(() => {
      slideIndex++;
      showSlides();
    }, 5000);
  }

  if (prev && next) {
    prev.addEventListener('click', () => {
      slideIndex--;
      showSlides();
      resetInterval();
    });

    next.addEventListener('click', () => {
      slideIndex++;
      showSlides();
      resetInterval();
    });
  }

  // Swipe functionality
  const slideshowContainer = document.querySelector('.slideshow-container');
  let touchstartX = 0;
  let touchendX = 0;

  function handleGesture() {
    if (touchendX < touchstartX) {
      slideIndex++;
      showSlides();
      resetInterval();
    }
    if (touchendX > touchstartX) {
      slideIndex--;
      showSlides();
      resetInterval();
    }
  }

  slideshowContainer.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  });

  slideshowContainer.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleGesture();
  });
  showSlides();
  resetInterval();
}

export function initFlashcardHover() { // following is a functinal chaos. If you wish to work on it, please take responsibility yourself
    const flashcards = document.querySelectorAll('.flashcard-link:not([data-popup-init])');
    const popup = document.getElementById('flash-popup');
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
      }, true);
  
      popup.addEventListener('touchstart', e => e.stopPropagation());
      
      popup.addEventListener('mouseenter', () => {
        onPopup = true;
        if (popupHide) clearTimeout(popupHide);
      });
  
      popup.addEventListener('mouseleave', (e) => {
        onPopup = false;
        // prevent flickering and wrong hides
        if (e.relatedTarget && e.relatedTarget.closest('.flashcard-link')) return;
        if (activeCard && activeCard.contains(e.relatedTarget)) return;
        popupHide = setTimeout(tryHide, 50);
      });
  
      document.addEventListener('touchstart', hidePopup);
      document.addEventListener('click', (e) => {
        if (activeCard && !activeCard.contains(e.target) && !popup.contains(e.target)) {
          hidePopup();
        }
      });
      window.addEventListener('hashchange', () => {
        onCard = false;
        onPopup = false;
        resizeRaf = null;
        scrollRaf = null;
        popupHide = null;
        activeCard = null;
        hidePopup();
      });
      status.popupInit = true;
    }
  
    function getPopupWidth() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const res = [];
  
      if (w < 300) res.push(w * 0.9);
      else if (w < 600) res.push(w * 0.7);
      else if (w < 800) res.push(w * 0.5);
      else res.push(w * 0.3);
  
      if (h < 300) res.push(h * 0.7);
      else if (h < 500) res.push(h * 0.55);
      else if (h < 700) res.push(h * 0.4);
      else res.push(h * 0.25);
  
      return res;
    }
  
    function positionPopup(card) {
        const pos = card.getBoundingClientRect();
        const [popupWidth, popupHeight] = getPopupWidth();
        const overlap = pos.width * 0.2;
        const extraHeight = pos.height * 0.1;

        if (window.innerWidth - pos.right > popupWidth) {
            popup.style.left = (pos.right - overlap) + "px";
        } else if (pos.left > popupWidth) {
            popup.style.left = (pos.left - popupWidth + overlap * 2) + "px";
        } else {
            popup.style.left = (window.innerWidth - popupWidth) + "px";
        };

        if (pos.top > extraHeight) {
            popup.style.top = (pos.top - extraHeight) + "px";
        } else if (window.innerHeight - pos.bottom > extraHeight) {
            popup.style.top = (pos.bottom - extraHeight) + "px";
        } else {
            popup.style.top = (pos.top + window.innerHeight * 0.7)
        };

        popup.hidden = false;
        popup.style.zIndex = '10';
    }
  
    function addPopup(card) {
      const d = card.dataset;
      const shortTitle = (d.title || '').length > 20 ? d.title.slice(0, 20) + '...' : (d.title || '');
  
      popup.innerHTML = `
        <span id="flash-popup-rank">#${d.rank || 'N/A'}</span>
        <span id="flash-popup-title">${shortTitle}</span>
        <span class="flash-popup-status">- ${d.status || 'Unknown'}</span>
        <div id="flash-popup-meta">
          <div><i class="fas fa-star"></i> ${d.score || 'N/A'}</div>
          <div><i class="fas fa-video"></i> ${d.type || 'N/A'}</div>
          <div><i class="fa-solid fa-user-group"></i> ${d.popularity || 'N/A'}</div>
        </div>
        <p id="flash-popup-synopsis">${d.synopsis || ''}</p>
        <p id="flash-popup-genres"><span>Genres: </span>${d.genres || 'N/A'}</p>
        <p id="flash-popup-episodes">${d.episodes ? "<span>Episodes: </span>" + d.episodes : ""}</p>
        <p id="flash-popup-studios"><span>Studios: </span>${d.studios || 'Unknown'}</p>
        <p id="flash-popup-rating"><span>Rating: </span>${d.rating || "N/A"}</p>
      `;
      positionPopup(card);
    }
  
    flashcards.forEach(card => {
      if (card.dataset.popupInit == 'true') return;
      card.dataset.popupInit = 'true';
  
      card.addEventListener('mouseenter', () => {
        if (popupHide) clearTimeout(popupHide);
        onCard = true;
        activeCard = card;
        addPopup(card);
      });
  
      card.addEventListener('mouseleave', (e) => {
        onCard = false;
        // prevent flickering
        if (popup.contains(e.relatedTarget)) return; 
        popupHide = setTimeout(tryHide, 50);
      });2
  
      card.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        addPopup(card);
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
      const gallery = btn.parentElement.querySelector('.horizontal-gallery');
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
      const gallery = btn.parentElement.querySelector('.horizontal-gallery');
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