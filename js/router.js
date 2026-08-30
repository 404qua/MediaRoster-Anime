import { loadPageContent, load404, hideLoader } from './pages.js';
import { loadDetailsPage } from './components/details.js';
import { initAuthUI } from './components/auth.js';
import { loadProfilePage } from './components/profile.js';

const routes = {
  '/': 'home',
  '/search': 'search',
  '/signin': 'signin',
  '/signIn': 'signin',
  '/register': 'register',
  '/profile-setup': 'profile-setup',
  '/profileSetup': 'profile-setup',
  '/profile': 'profile'
};

export const handleRoute = async () => {
  if (typeof window.closeNavMenu === 'function') {
    window.closeNavMenu();
  }
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10);
  hideLoader();

  const popup = document.getElementById('popup');
  if (popup) {
    popup.style.display = 'none';
  }

  const authData = await initAuthUI();
  const { user, profile } = authData;

  const path = window.location.hash.substring(1) || '/';
  const [pathName] = path.split('?');
  const routeName = routes[pathName];

  // Route protection and redirection
  if (routeName === 'signin' || routeName === 'register') {
    if (user) {
      window.location.hash = profile ? '#/profile' : '#/profile-setup';
      return;
    }
  } else if (routeName === 'profile-setup') {
    if (!user) {
      window.location.hash = '#/signin';
      return;
    }
    if (profile) {
      window.location.hash = '#/profile';
      return;
    }
  } else if (routeName === 'profile') {
    if (!user) {
      window.location.hash = '#/signin';
      return;
    }
    if (!profile) {
      window.location.hash = '#/profile-setup';
      return;
    }
  }

  if (routeName) {
    console.log(`Navigating to: ${routeName}`);
    loadPageContent(routeName, authData);
  } else if (path.startsWith('/details-')) {
    const animeId = path.split('-')[1];
    console.log(`Navigating to details for: ${animeId}`);
    loadDetailsPage(animeId);
  } else if (path.startsWith('/profile/')) {
    let targetUsername = '';
    try {
      targetUsername = path.slice('/profile/'.length);
    } catch (error) {
      console.error('Error occurred while parsing profile URL:', error);
    }
    targetUsername = decodeURIComponent(targetUsername);
    if (targetUsername) {
      console.log(`Navigating to profile for: ${targetUsername}`);
      loadProfilePage(authData, targetUsername);
    } else {
      load404(path);
    }
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
  if (!currentScroll) {
    header.style.padding = '0.5rem 0.1rem';
  }
  if (currentScroll > lastScroll && currentScroll > 10) {
    header.style.padding = '0.2rem 0.1rem';
  } else if (currentScroll < lastScroll) {
    if (currentScroll <= 10) {
      header.style.padding = '0.5rem 0.1rem';
    }
  }
  lastScroll = currentScroll;
});