import { supabase } from '../supabase.js';
import { loadCSS, hideLoader, updateMetaTags } from '../pages.js';
import { escapeHTML } from './UIs.js';

const HCAPTCHA_SITEKEY = '7ce26f50-dea8-474e-ac1a-98c4fe44eff0';

export async function initAuthUI() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const navsignin = document.getElementById('navsignin');
        const navsigninMenu = document.getElementById('navsignin-menu');
        const navregisterMenu = document.getElementById('navregister-menu');
        const navuserTopItem = document.getElementById('navuser-top-item');
        const navuserMenu = document.getElementById('navuser-menu');

        if (session?.user) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profile) {
                if (navsignin) {
                    navsignin.href = '#/profile';
                    navsignin.className = 'nav-user-btn';
                    navsignin.innerHTML = `<i class="fas fa-user-circle"></i><span class="nav-text-desktop"> ${escapeHTML(profile.username)}</span>`;
                }
                if (navsigninMenu) {
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
                if (navsigninMenu) {
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
                const currentHash = window.location.hash;
                if (!currentHash.startsWith('#/profile-setup') && !currentHash.startsWith('#/verify-email')) {
                    window.location.hash = '#/profile-setup';
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
    } catch (e) {
        console.error('Error updating auth UI:', e);
    }
}

// Listen for auth state changes globally
supabase.auth.onAuthStateChange(() => {
    initAuthUI();
});

function renderCaptcha(containerId) {
    let attempts = 0;

    const tryRender = () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (container.dataset.widgetId) return;
        if (!window.hcaptcha || typeof window.hcaptcha.render !== 'function') {
            if (attempts++ < 50) setTimeout(tryRender, 200);
            return;
        }

        const renderWidget = () => {
            if (!document.getElementById(containerId) || container.dataset.widgetId) return;

            try {
                const widgetId = window.hcaptcha.render(containerId, {
                    sitekey: HCAPTCHA_SITEKEY,
                    theme: 'dark'
                });
                container.dataset.widgetId = String(widgetId);
            } catch (e) {
                if (attempts++ < 50) {
                    setTimeout(tryRender, 200);
                } else {
                    console.error('hCaptcha failed to render:', e);
                }
            }
        };

        if (typeof window.hcaptcha.ready === 'function') {
            window.hcaptcha.ready(renderWidget);
        } else {
            renderWidget();
        }
    };

    setTimeout(tryRender, 0);
}

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
                            <form id="signin-form" class="auth-form" autocomplete="on">
                                <div class="form-group">
                                    <label for="signin-email">Email Address</label>
                                    <div class="input-wrapper">
                                        <i class="fas fa-envelope input-icon"></i>
                                        <input
                                            type="email"
                                            id="signin-email"
                                            class="auth-input"
                                            placeholder="Enter your email"
                                            required
                                            autocomplete="email"
                                        >
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="signin-password">Password</label>
                                    <div class="input-wrapper">
                                        <i class="fas fa-lock input-icon"></i>
                                        <input
                                            type="password"
                                            id="signin-password"
                                            class="auth-input"
                                            placeholder="Enter password"
                                            required
                                            autocomplete="current-password"
                                        >
                                        <i class="fas fa-eye toggle-password" data-target="signin-password" title="Toggle password visibility"></i>
                                    </div>
                                </div>

                                <div class="form-extra">
                                    <a href="javascript:void(0)" id="forgot-password-link" class="forgot-link">Forgot Password?</a>
                                </div>

                                <div id="signin-hcaptcha" class="h-captcha-container"></div>

                                <button type="submit" id="signin-btn" class="auth-btn">Sign In</button>
                            </form>

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

    setupPasswordToggles();
    setupSignInForm();
    renderCaptcha('signin-hcaptcha');
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
                            <form id="register-form" class="auth-form" autocomplete="on">
                                <div class="form-group">
                                    <label for="register-email">Email Address</label>
                                    <div class="input-wrapper">
                                        <i class="fas fa-envelope input-icon"></i>
                                        <input
                                            type="email"
                                            id="register-email"
                                            class="auth-input"
                                            placeholder="Enter your email"
                                            required
                                            autocomplete="email"
                                        >
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="register-password">Password</label>
                                    <div class="input-wrapper">
                                        <i class="fas fa-lock input-icon"></i>
                                        <input
                                            type="password"
                                            id="register-password"
                                            class="auth-input"
                                            placeholder="Create password"
                                            required
                                            autocomplete="new-password"
                                        >
                                        <i class="fas fa-eye toggle-password" data-target="register-password" title="Toggle password visibility"></i>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="register-confirm-password">Confirm Password</label>
                                    <div class="input-wrapper">
                                        <i class="fas fa-lock input-icon"></i>
                                        <input
                                            type="password"
                                            id="register-confirm-password"
                                            class="auth-input"
                                            placeholder="Confirm password"
                                            required
                                            autocomplete="new-password"
                                        >
                                        <i class="fas fa-eye toggle-password" data-target="register-confirm-password" title="Toggle password visibility"></i>
                                    </div>
                                </div>

                                <div class="form-extra" style="justify-content: flex-start; margin-bottom: 0.5rem;">
                                    <span style="font-size: 0.8rem; color: var(--warning-color); font-style: italic;">
                                        Note: Password reset functionality is not available yet. Please remember your password carefully.
                                    </span>
                                </div>

                                <div id="register-hcaptcha" class="h-captcha-container"></div>

                                <button type="submit" id="register-btn" class="auth-btn">Register</button>
                            </form>

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

    setupPasswordToggles();
    setupRegisterForm();
    renderCaptcha('register-hcaptcha');
}

export function loadVerifyEmailPage() {
    document.title = 'Verify Email - MediaRoster';
    loadCSS('./css/auth.css');
    hideLoader();

    const content = document.getElementById('content');
    if (!content) return;

    const email = sessionStorage.getItem('registeredEmail') || 'your email address';

    content.innerHTML = `
        <div class="auth-container">
            <div class="auth-bg-icons verify-bg-icons">
                <i class="fas fa-envelope bg-icon icon-v1"></i>
                <i class="fas fa-envelope-open-text bg-icon icon-v2"></i>
                <i class="fas fa-tv bg-icon icon-v3"></i>
                <i class="fas fa-play bg-icon icon-v4"></i>
                <i class="fas fa-film bg-icon icon-v5"></i>
                <i class="fas fa-video bg-icon icon-v6"></i>
            </div>
            <div class="auth-form-card" style="max-width: 550px; text-align: center; padding: 3rem 2rem;">
                <i class="fas fa-envelope-open-text" style="font-size: 3.5rem; color: var(--primary-accent); margin-bottom: 1.5rem;"></i>
                <h1 class="auth-title" style="margin-bottom: 1rem;">Check your email</h1>
                <p style="font-size: 1.05rem; color: var(--text-color); line-height: 1.6; margin-bottom: 1.5rem;">
                    We sent a confirmation link to <strong style="color: var(--lighter-accent);">${escapeHTML(email)}</strong>.
                    Please check your inbox and click the verification link to activate your account.
                </p>
                <div style="background: rgba(221, 171, 91, 0.15); border: 1px solid var(--warning-color); color: var(--warning-color); padding: 0.85rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-info-circle"></i> Note: You may need to refresh the page after confirming your email.
                </div>
                <div class="auth-footer" style="margin-top: 1rem;">
                    Made a mistake? <a href="#/register">Go back to registration</a>
                </div>
            </div>
        </div>
    `;
}

export async function loadProfileSetupPage() {
    document.title = 'Complete Profile Setup - MediaRoster';
    loadCSS('./css/auth.css');
    hideLoader();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.hash = '#/signin';
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

function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', () => {
            const targetId = toggleBtn.dataset.target;
            const passwordInput = document.getElementById(targetId);
            if (!passwordInput) return;

            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';

            if (isPassword) {
                toggleBtn.classList.remove('fa-eye');
                toggleBtn.classList.add('fa-eye-slash');
            } else {
                toggleBtn.classList.remove('fa-eye-slash');
                toggleBtn.classList.add('fa-eye');
            }
        });
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    return hasUpper && hasLower && hasDigit;
}

function setupSignInForm() {
    const form = document.getElementById('signin-form');
    const messageEl = document.getElementById('auth-message');
    const forgotLink = document.getElementById('forgot-password-link');
    const submitBtn = document.getElementById('signin-btn');

    if (forgotLink) {
        forgotLink.addEventListener('click', () => {
            if (messageEl) {
                messageEl.className = 'auth-message error';
                messageEl.textContent = 'Password reset functionality is not available yet. Please try remembering your password.';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email')?.value.trim();
            const password = document.getElementById('signin-password')?.value;

            if (!email || !password) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Please enter both email and password.';
                }
                return;
            }

            if (!isValidEmail(email)) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Invalid email format. Please enter a valid email address.';
                }
                return;
            }

            const captchaContainer = document.getElementById('signin-hcaptcha');
            const widgetId = captchaContainer ? captchaContainer.dataset.widgetId : null;
            let captchaToken = '';

            if (window.hcaptcha && widgetId !== null && widgetId !== undefined) {
                try {
                    captchaToken = window.hcaptcha.getResponse(widgetId);
                } catch (e) {
                    console.warn('Error fetching hcaptcha response:', e);
                }
            }

            if (!captchaToken) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Please complete the hCaptcha verification.';
                }
                return;
            }

            try {
                if (submitBtn) submitBtn.disabled = true;
                if (messageEl) {
                    messageEl.className = 'auth-message success';
                    messageEl.textContent = 'Signing in...';
                }

                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                    options: {
                        captchaToken
                    }
                });

                if (error) {
                    if (messageEl) {
                        messageEl.className = 'auth-message error';
                        messageEl.textContent = error.message || 'Failed to sign in. Please check your credentials.';
                    }
                    if (submitBtn) submitBtn.disabled = false;
                    if (window.hcaptcha && widgetId !== null && widgetId !== undefined) {
                        try { window.hcaptcha.reset(widgetId); } catch (resetErr) { }
                    }
                    return;
                }

                await initAuthUI();
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profile) {
                    window.location.hash = '#/';
                } else {
                    window.location.hash = '#/profile-setup';
                }
            } catch (err) {
                console.error('Sign in error:', err);
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'An unexpected error occurred. Please try again.';
                }
                if (submitBtn) submitBtn.disabled = false;
                if (window.hcaptcha && widgetId !== null && widgetId !== undefined) {
                    try { window.hcaptcha.reset(widgetId); } catch (resetErr) { }
                }
            }
        });
    }
}

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    const messageEl = document.getElementById('auth-message');
    const submitBtn = document.getElementById('register-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email')?.value.trim();
            const password = document.getElementById('register-password')?.value;
            const confirmPassword = document.getElementById('register-confirm-password')?.value;

            if (!email || !password || !confirmPassword) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Please fill out all required fields.';
                }
                return;
            }

            if (!isValidEmail(email)) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Invalid email format. Please enter a valid email address.';
                }
                return;
            }

            if (!isValidPassword(password)) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Password must be at least 8 characters long and include uppercase, lowercase, and numeric characters.';
                }
                return;
            }

            if (password !== confirmPassword) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Passwords do not match. Please try again.';
                }
                return;
            }

            const captchaContainer = document.getElementById('register-hcaptcha');
            const widgetId = captchaContainer ? captchaContainer.dataset.widgetId : null;
            let captchaToken = '';

            if (window.hcaptcha && widgetId !== null && widgetId !== undefined) {
                try {
                    captchaToken = window.hcaptcha.getResponse(widgetId);
                } catch (e) {
                    console.warn('Error fetching hcaptcha response:', e);
                }
            }

            if (!captchaToken) {
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'Please complete the hCaptcha verification.';
                }
                return;
            }

            try {
                if (submitBtn) submitBtn.disabled = true;
                if (messageEl) {
                    messageEl.className = 'auth-message success';
                    messageEl.textContent = 'Creating your account...';
                }

                const redirectTo = window.location.href.split('#')[0];

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        captchaToken,
                        emailRedirectTo: redirectTo
                    }
                });

                if (error) {
                    if (messageEl) {
                        messageEl.className = 'auth-message error';
                        messageEl.textContent = error.message || 'Failed to create account.';
                    }
                    if (submitBtn) submitBtn.disabled = false;
                    if (window.hcaptcha && widgetId !== null && widgetId !== undefined) {
                        try { window.hcaptcha.reset(widgetId); } catch (resetErr) { }
                    }
                    return;
                }

                sessionStorage.setItem('registeredEmail', email);
                window.location.hash = '#/verify-email';

            } catch (err) {
                console.error('Registration error:', err);
                if (messageEl) {
                    messageEl.className = 'auth-message error';
                    messageEl.textContent = 'An unexpected error occurred. Please try again.';
                }
                if (submitBtn) submitBtn.disabled = false;
                if (window.hcaptcha && widgetId !== null && widgetId !== undefined) {
                    try { window.hcaptcha.reset(widgetId); } catch (resetErr) { }
                }
            }
        });
    }
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

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
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
