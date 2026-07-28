import { loadPageContent, load404, hideLoader } from './pages.js';
import { loadDetailsPage } from './components/details.js';

const routes = {
  '/': 'home',
  '/search': 'search'
};

export const handleRoute = () => {
  setTimeout(() => {
    window.scrollTo(0,0);
  }, 10);
  hideLoader();
  const path = window.location.hash.substring(1) || '/';
  const [pathName] = path.split('?');
  const routeName = routes[pathName];

  if (routeName) {
    console.log(`Navigating to: ${routeName}`);
    loadPageContent(routeName);
  } else if (path.startsWith('/details-')) {
    const animeId = path.split('-')[1];
    console.log(`Navigating to details for: ${animeId}`);
    loadDetailsPage(animeId)
  } else {
    load404(path);
  }
};

// Listen for hash changes
window.addEventListener('hashchange', handleRoute);

// Initial route handling on page load
window.addEventListener('load', handleRoute);

let lastScroll = 0;
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  // the number '10' was provided by chatGPT
  if (currentScroll > lastScroll && currentScroll > 10) {
    header.style.padding = '0.2rem 0.1rem';
  } else if (currentScroll < lastScroll) {
    if (currentScroll <= 10) {
      header.style.padding = '0.5rem 0.1rem';
    }
  }
  lastScroll = currentScroll;
});