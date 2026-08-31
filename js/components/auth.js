import { supabase } from '../supabase.js';
import { loadCSS, hideLoader, updateMetaTags } from '../pages.js';
import { escapeHTML } from './UIs.js';

let activeOAuthAttempt = null;
let authPromise = null;

function finishOAuthAttempt(message, isError = false) {
    if (activeOAuthAttempt?.checkTimer) {
        clearInterval(activeOAuthAttempt.checkTimer);
    }
    if (activeOAuthAttempt?.popup && !activeOAuthAttempt.popup.closed) {
        activeOAuthAttempt.popup.close();
    }

    if (!isError) {
        window.location.hash = '#/profile';
        activeOAuthAttempt = null;
        return;
    }

    document.querySelectorAll('.oauth-btn').forEach(option => option.disabled = false);
    const messageEl = activeOAuthAttempt?.messageEl;
    if (messageEl && message) {
        messageEl.className = `auth-message ${isError ? 'error' : 'success'}`;
        messageEl.textContent = message;
    }
    activeOAuthAttempt = null;
}

function renderNavUI(user, profile) {
    const navsignin = document.getElementById('navsignin');
    const navsigninMenu = document.getElementById('navsignin-menu');
    const navregisterMenu = document.getElementById('navregister-menu');
    const navuserTopItem = document.getElementById('navuser-top-item');
    const navuserMenu = document.getElementById('navuser-menu');

    if (user) {
        if (profile) {
            if (navsignin) {
                navsignin.href = '#/profile';
                navsignin.className = 'nav-user-btn';
                navsignin.innerHTML = `<i class="fas fa-user-circle"></i><span class="nav-text-desktop"> ${escapeHTML(profile.username)}</span>`;
            }
            if (navsigninMenu && navsigninMenu.parentElement) {
                navsigninMenu.parentElement.style.display = 'none';
            }
            if (navuserTopItem && navuserMenu) {
                navuserTopItem.style.display = 'block';
                navuserMenu.href = '#/profile';
                navuserMenu.className = 'nav-user-menu-btn';
                navuserMenu.innerHTML = `<i class="fas fa-user-circle"></i><span>${escapeHTML(profile.username)}</span>`;
            }
            if (navregisterMenu && navregisterMenu.parentElement) {
                navregisterMenu.parentElement.style.display = 'none';
            }
        } else {
            if (navsignin) {
                navsignin.href = '#/profile-setup';
                navsignin.className = 'nav-user-btn';
                navsignin.innerHTML = `<i class="fas fa-user-edit"></i><span class="nav-text-desktop"> Finish Setup</span>`;
            }
            if (navsigninMenu && navsigninMenu.parentElement) {
                navsigninMenu.parentElement.style.display = 'none';
            }
            if (navuserTopItem && navuserMenu) {
                navuserTopItem.style.display = 'block';
                navuserMenu.href = '#/profile-setup';
                navuserMenu.className = 'nav-user-menu-btn';
                navuserMenu.innerHTML = '<i class="fas fa-user-edit"></i><span>Finish Setup</span>';
            }
            if (navregisterMenu && navregisterMenu.parentElement) {
                navregisterMenu.parentElement.style.display = 'none';
            }
        }
    } else {
        if (navsignin) {
            navsignin.href = '#/signin';
            navsignin.className = '';
            navsignin.innerHTML = `<i class="fas fa-sign-in-alt"></i><span class="nav-text-desktop"> Sign In</span>`;
        }
        if (navsigninMenu) {
            if (navsigninMenu.parentElement) navsigninMenu.parentElement.style.display = 'block';
            navsigninMenu.href = '#/signin';
            navsigninMenu.className = '';
            navsigninMenu.innerHTML = `<i class="fas fa-sign-in-alt"></i><span class="nav-text-desktop"> Sign In</span>`;
        }
        if (navuserTopItem) navuserTopItem.style.display = 'none';
        if (navregisterMenu && navregisterMenu.parentElement) {
            navregisterMenu.parentElement.style.display = 'block';
        }
    }
}

export async function initAuthUI() {
    // initialize existing session and cleanup any invalid sessions
    if (authPromise) return authPromise;

    authPromise = (async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                renderNavUI(null, null);
                return { user: null, profile: null };
            }

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.warn('Invalid/expired session detected, clearing local auth state.');
                try {
                    await supabase.auth.signOut({ scope: 'local' });
                } catch (signOutErr) {
                    console.warn('Error during local sign out:', signOutErr);
                }
                renderNavUI(null, null);
                return { user: null, profile: null };
            }

            let profile = null;
            try {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();
                profile = data;
            } catch (profileErr) {
                console.error('Error fetching profile:', profileErr);
            }

            renderNavUI(user, profile);
            return { user, profile };
        } catch (e) {
            console.error('Error updating auth UI:', e);
            renderNavUI(null, null);
            return { user: null, profile: null };
        } finally {
            authPromise = null;
        }
    })();

    return authPromise;
}

supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_OUT') {
        renderNavUI(null, null);
        return;
    }

    await initAuthUI();
    if (event === 'SIGNED_IN' && activeOAuthAttempt) {
        finishOAuthAttempt('Signed in successfully.');
    }
});

export function loadSignInPage() {
    document.title = 'Sign In - MediaRoster';
    updateMetaTags(
        'Sign in to your MediaRoster account to discover and manage your favorite anime.',
        ['mediaroster', 'anime', 'signin', 'login', 'account']
    );
    loadCSS('./css/auth.css');
    hideLoader();

    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
        <div class="auth-container">
            <div class="auth-bg-icons">
                <i class="fas fa-tv bg-icon icon-1"></i>
                <i class="fas fa-clapperboard bg-icon icon-2"></i>
                <i class="fas fa-play bg-icon icon-3"></i>
                <i class="fas fa-camera bg-icon icon-4"></i>
                <i class="fas fa-video bg-icon icon-5"></i>
                <i class="fas fa-film bg-icon icon-6"></i>
            </div>
            <div class="auth-box">
                <div class="auth-form-side">
                    <div class="auth-form-wrapper">
                        <div class="auth-form-card">
                            <div class="auth-header">
                                <h1 class="auth-title">Sign in to your account</h1>
                            </div>
                            <div id="auth-message" class="auth-message"></div>
                            <div class="oauth-options" data-auth-action="Sign in with">
                                <button type="button" class="oauth-btn" data-provider="google">
                                    <i class="fab fa-google"></i><span>Sign in with Google</span>
                                </button>
                                <button type="button" class="oauth-btn" data-provider="discord">
                                    <i class="fab fa-discord"></i><span>Sign in with Discord</span>
                                </button>
                                <button type="button" class="oauth-btn" data-provider="github">
                                    <i class="fab fa-github"></i><span>Sign in with GitHub</span>
                                </button>
                            </div>

                            <div class="auth-footer">
                                Don't have an account? <a href="#/register">Register</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="auth-decoration-side">
                    <div class="auth-decoration-text">
                        Join us in our journey to bring the world's media to one place
                    </div>
                </div>
            </div>
        </div>
    `;

    setupOAuthButtons();
}

export function loadRegisterPage() {
    document.title = 'Register - MediaRoster';
    updateMetaTags(
        'Create a new MediaRoster account to unlock personalized anime tracking and recommendations.',
        ['mediaroster', 'anime', 'register', 'signup', 'account']
    );
    loadCSS('./css/auth.css');
    hideLoader();

    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
        <div class="auth-container">
            <div class="auth-bg-icons">
                <i class="fas fa-tv bg-icon icon-1"></i>
                <i class="fas fa-clapperboard bg-icon icon-2"></i>
                <i class="fas fa-play bg-icon icon-3"></i>
                <i class="fas fa-camera bg-icon icon-4"></i>
                <i class="fas fa-video bg-icon icon-5"></i>
                <i class="fas fa-film bg-icon icon-6"></i>
            </div>
            <div class="auth-box">
                <div class="auth-form-side">
                    <div class="auth-form-wrapper">
                        <div class="auth-form-card">
                            <div class="auth-header">
                                <h1 class="auth-title">Register a new account</h1>
                            </div>
                            <div id="auth-message" class="auth-message"></div>
                            <div class="oauth-options" data-auth-action="Continue with">
                                <button type="button" class="oauth-btn" data-provider="google">
                                    <i class="fab fa-google"></i><span>Continue with Google</span>
                                </button>
                                <button type="button" class="oauth-btn" data-provider="discord">
                                    <i class="fab fa-discord"></i><span>Continue with Discord</span>
                                </button>
                                <button type="button" class="oauth-btn" data-provider="github">
                                    <i class="fab fa-github"></i><span>Continue with GitHub</span>
                                </button>
                            </div>

                            <div class="auth-footer">
                                Already have an account? <a href="#/signin">Sign In</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="auth-decoration-side">
                    <div class="auth-decoration-text">
                        Join us in our journey to bring the world's media to one place
                    </div>
                </div>
            </div>
        </div>
    `;

    setupOAuthButtons();
}

export async function loadProfileSetupPage(cachedAuth = null) {
    document.title = 'Complete Profile Setup - MediaRoster';
    loadCSS('./css/auth.css');
    hideLoader();

    let authData = cachedAuth;
    if (!authData?.user) {
        authData = await initAuthUI();
    }
    const { user, profile } = authData;

    if (!user) {
        window.location.hash = '#/signin';
        return;
    }

    if (profile) {
        window.location.hash = '#/profile';
        return;
    }

    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
        <div class="auth-container">
            <div class="auth-form-card" style="max-width: 550px; padding: 2.5rem;">
                <div class="auth-header">
                    <h1 class="auth-title">Complete Profile Setup</h1>
                    <p class="auth-subtitle" style="margin-top: 0.5rem;">Choose a username and bio to set up your MediaRoster profile.</p>
                </div>
                <div id="setup-message" class="auth-message"></div>
                <form id="profile-setup-form" class="auth-form">
                    <div class="form-group">
                        <label for="setup-username">Username</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user input-icon"></i>
                            <input
                                type="text"
                                id="setup-username"
                                class="auth-input"
                                placeholder="Username (letters, numbers, _)"
                                required
                                maxlength="100"
                            >
                        </div>
                        <span style="font-size: 0.75rem; color: var(--text-color); opacity: 0.7; margin-top: 2px;">
                            Only letters, numbers, and underscores allowed (1-100 chars).
                        </span>
                    </div>

                    <div class="form-group">
                        <label for="setup-bio">Bio (Optional)</label>
                        <textarea
                            id="setup-bio"
                            class="auth-textarea"
                            placeholder="Tell us a bit about your favorite anime or hobbies..."
                            maxlength="500"
                        ></textarea>
                    </div>

                    <button type="submit" id="setup-btn" class="auth-btn">Save & Continue</button>
                </form>
            </div>
        </div>
    `;

    setupProfileSetupForm();
}

function setupOAuthButtons() {
    const options = document.querySelector('.oauth-options');
    const action = options?.dataset.authAction || 'Continue with';
    const messageEl = document.getElementById('auth-message');

    document.querySelectorAll('.oauth-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const provider = button.dataset.provider;
            if (!provider) return;

            document.querySelectorAll('.oauth-btn').forEach(option => option.disabled = true);
            if (messageEl) {
                messageEl.className = 'auth-message success';
                messageEl.textContent = `${action} ${provider[0].toUpperCase()}${provider.slice(1)}...`;
            }

            const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

            if (isMobile) {
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider,
                        options: {
                            redirectTo: `${window.location.origin}${window.location.pathname}`,
                            skipBrowserRedirect: true
                        }
                    });
                    if (error) throw error;
                    if (!data?.url) throw new Error('Unable to open the selected sign-in provider.');
                    window.location.assign(data.url);
                } catch (error) {
                    if (messageEl) {
                        messageEl.className = 'auth-message error';
                        messageEl.textContent = error.message || 'Unable to connect to the selected provider. Please try again.';
                    }
                    document.querySelectorAll('.oauth-btn').forEach(option => option.disabled = false);
                }
                return;
            }

            let popup = null;
            try {
                popup = window.open('', 'mediaroster-oauth', 'popup,width=500,height=700,resizable=yes,scrollbars=yes');
            } catch (e) {
                popup = null;
            }

            if (!popup) {
                try {
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider,
                        options: {
                            redirectTo: window.location.href.split('#')[0]
                        }
                    });
                    if (error) throw error;
                } catch (error) {
                    if (messageEl) {
                        messageEl.className = 'auth-message error';
                        messageEl.textContent = error.message || 'Unable to connect to the selected provider. Please try again.';
                    }
                    document.querySelectorAll('.oauth-btn').forEach(option => option.disabled = false);
                }
                return;
            }

            activeOAuthAttempt = {
                popup,
                messageEl,
                checkTimer: setInterval(() => {
                    if (popup.closed) {
                        finishOAuthAttempt('The sign-in window was closed. Please try again.', true);
                    }
                }, 500)
            };

            try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo: window.location.href.split('#')[0],
                        skipBrowserRedirect: true
                    }
                });

                if (error) throw error;
                if (!data?.url) throw new Error('Unable to open the selected sign-in provider.');
                popup.location.href = data.url;
            } catch (error) {
                finishOAuthAttempt(error.message || 'Unable to connect to the selected provider. Please try again.', true);
            }
        });
    });
}

function setupProfileSetupForm() {
    const form = document.getElementById('profile-setup-form');
    const messageEl = document.getElementById('setup-message');
    const submitBtn = document.getElementById('setup-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('setup-username')?.value.trim();
            const bio = document.getElementById('setup-bio')?.value.trim() || null;

            if (!username) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Username is required.';
                }
                return;
            }

            const usernameRegex = /^[A-Za-z0-9_]{1,100}$/;
            if (!usernameRegex.test(username)) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Username must be 1-100 characters long and contain only letters, numbers, and underscores.';
                }
                return;
            }

            if (bio && bio.length > 500) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Bio must be 500 characters or fewer.';
                }
                return;
            }

            try {
                if (submitBtn) submitBtn.disabled = true;
                if (messageEl) {
                    messageEl.className = 'auth-message success';
                    messageEl.textContent = 'Saving profile...';
                }

                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    await supabase.auth.signOut({ scope: 'local' });
                    window.location.hash = '#/signin';
                    return;
                }

                const { error } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        username,
                        bio
                    });

                if (error) {
                    console.error('Insert profile error:', error);
                    if (messageEl) {
                        messageEl.className = 'auth-message error';
                        messageEl.textContent = error.message.includes('unique') ? 'That username is already taken. Please choose another.' : error.message;
                    }
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                }

                await initAuthUI();
                window.location.hash = '#/profile';

            } catch (err) {
                console.error('Profile setup error:', err);
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'An unexpected error occurred while saving profile.';
                }
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
}
