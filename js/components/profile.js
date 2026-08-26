import { supabase } from '../supabase.js';
import { loadCSS, hideLoader, showLoader, load404, updateMetaTags } from '../pages.js';
import { escapeHTML } from './UIs.js';
import { initAuthUI } from './auth.js';
import { getAnimeDetails } from '../api.js';

function renderUserNotFound(targetUsername) {
    document.title = 'User Not Found - MediaRoster';
    updateMetaTags(
        'The requested user profile was not found on MediaRoster.',
        ['mediaroster', 'profile', 'not found']
    );

    const content = document.getElementById('content');
    if (!content) return;

    const safeUsername = escapeHTML(String(targetUsername || 'User').trim());

    content.innerHTML = `
        <div class="profile-container">
            <div class="auth-bg-icons profile-bg-icons">
                <i class="fas fa-user-circle bg-icon icon-p1"></i>
                <i class="fas fa-clapperboard bg-icon icon-p2"></i>
                <i class="fas fa-tv bg-icon icon-p3"></i>
                <i class="fas fa-film bg-icon icon-p4"></i>
                <i class="fas fa-play bg-icon icon-p5"></i>
                <i class="fas fa-video bg-icon icon-p6"></i>
            </div>
            <div class="profile-card profile-not-found-card">
                <div class="profile-not-found-content">
                    <div class="profile-not-found-icon">
                        <i class="fas fa-user-slash"></i>
                    </div>
                    <h1 class="profile-not-found-title">User Not Found</h1>
                    <p class="profile-not-found-message">
                        The user profile for <strong>@${safeUsername}</strong> does not exist or may have been removed.
                    </p>
                    <div class="profile-not-found-actions">
                        <a href="#/" class="profile-btn profile-btn-primary">
                            <i class="fas fa-home"></i> Back to Home
                        </a>
                        <a href="#/search" class="profile-btn profile-btn-secondary">
                            <i class="fas fa-search"></i> Browse Anime
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function loadProfilePage(cachedAuth = null, targetUsername = null) {
    loadCSS('./css/profile.css');

    let authData = cachedAuth;
    if (!authData) {
        authData = await initAuthUI();
    }
    const { user: currentUser, profile: currentProfile } = authData;

    let profile = null;
    let isOwnProfile = false;

    if (!targetUsername) {
        // Own profile route: #/profile
        if (!currentUser) {
            window.location.hash = '#/signin';
            return;
        }

        if (!currentProfile) {
            window.location.hash = '#/profile-setup';
            return;
        }

        profile = currentProfile;
        isOwnProfile = true;
    } else {
        // Target profile route: e.g. #/profile-username or #/user-username
        if (currentProfile && currentProfile.username.toLowerCase() === targetUsername.toLowerCase()) {
            profile = currentProfile;
            isOwnProfile = true;
        } else {
            showLoader();
            try {
                const { data: targetProfile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', String(targetUsername).trim())
                    .maybeSingle();

                if (error || !targetProfile) {
                    hideLoader();
                    renderUserNotFound(targetUsername);
                    return;
                }

                profile = targetProfile;
                isOwnProfile = Boolean(currentUser && currentUser.id === targetProfile.id);
            } catch (err) {
                console.error('Failed to load profile:', err);
                hideLoader();
                renderUserNotFound(targetUsername);
                return;
            }
        }
    }

    document.title = `${escapeHTML(profile.username)}'s Profile - MediaRoster`;
    updateMetaTags(
        `${profile.username}'s profile on MediaRoster. Discover and share your favorite anime.`,
        ['mediaroster', 'anime', 'profile', profile.username]
    );
    hideLoader();

    const content = document.getElementById('content');
    if (!content) return;

    const joinedDate = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';
    const profileInitial = escapeHTML(String(profile.username || '?').charAt(0).toUpperCase());

    const editUsernameHTML = isOwnProfile ? `
        <button id="edit-username-btn" class="profile-icon-btn" type="button" aria-label="Edit username" title="Edit username">
            <i class="fas fa-pen"></i>
        </button>
    ` : '';

    const topBarHTML = `
        <div class="profile-top-bar">
            <button id="share-profile-btn" class="share-btn" type="button" aria-label="Share profile" title="Share profile">
                <i class="fas fa-share-nodes"></i><span>Share</span>
            </button>
            ${isOwnProfile ? `
                <button id="logout-btn" class="logout-btn" type="button" aria-label="Logout" title="Logout">
                    <i class="fas fa-sign-out-alt"></i><span>Logout</span>
                </button>
            ` : ''}
        </div>
    `;

    const editBioHTML = isOwnProfile ? `
        <button id="edit-bio-btn" class="profile-icon-btn" type="button" aria-label="Edit about me" title="Edit about me">
            <i class="fas fa-pen"></i>
        </button>
    ` : '';

    const visibilityToggleHTML = isOwnProfile ? `
        <div class="watchlist-visibility-wrapper">
            <label class="watchlist-switch" title="Toggle public or private watchlist">
                <input type="checkbox" id="watchlist-visibility-checkbox" ${profile.watchlist_public ? 'checked' : ''}>
                <span class="watchlist-slider round"></span>
            </label>
            <span id="watchlist-visibility-label" class="watchlist-visibility-text">
                ${profile.watchlist_public ? '<i class="fas fa-globe"></i> Public' : '<i class="fas fa-lock"></i> Private'}
            </span>
        </div>
    ` : '';

    content.innerHTML = `
        <div class="profile-container">
            <div class="auth-bg-icons profile-bg-icons">
                <i class="fas fa-user-circle bg-icon icon-p1"></i>
                <i class="fas fa-clapperboard bg-icon icon-p2"></i>
                <i class="fas fa-tv bg-icon icon-p3"></i>
                <i class="fas fa-film bg-icon icon-p4"></i>
                <i class="fas fa-play bg-icon icon-p5"></i>
                <i class="fas fa-video bg-icon icon-p6"></i>
            </div>
            <div class="profile-card">
                <div class="profile-info-side">
                    <div class="profile-identity-mark" aria-hidden="true">${profileInitial}</div>
                    <div class="profile-identity-details">
                        <div class="profile-username-row">
                            <h1 id="profile-username" class="profile-username">${escapeHTML(profile.username)}</h1>
                            ${editUsernameHTML}
                        </div>
                        <p class="profile-joined"><span>Member since</span> ${escapeHTML(joinedDate)}</p>
                    </div>
                </div>
                <div class="profile-about-side">
                    ${topBarHTML}
                    <div class="profile-about-heading">
                        <h3 class="profile-about-title">About me</h3>
                        ${editBioHTML}
                    </div>
                    <div id="profile-bio-box" class="profile-bio-box">
                        ${profile.bio ? escapeHTML(profile.bio) : '<em>No bio provided yet.</em>'}
                    </div>
                </div>
            </div>

            <div class="profile-watchlist-section">
                <div class="watchlist-header">
                    <div class="watchlist-title-wrapper">
                        <h2 class="watchlist-main-title">
                            ${isOwnProfile ? 'Your watchlist' : `${escapeHTML(profile.username)}'s watchlist`}
                        </h2>
                        ${visibilityToggleHTML}
                    </div>
                    <a href="#/search" class="watchlist-browse-link"><i class="fas fa-search"></i> Browse anime</a>
                </div>

                ${(!isOwnProfile && !profile.watchlist_public) ? `
                    <div class="watchlist-private-card">
                        <i class="fas fa-lock watchlist-private-icon"></i>
                        <h3>${escapeHTML(profile.username)}'s watchlist is private</h3>
                        <p>This user has chosen to keep their watchlist private.</p>
                    </div>
                ` : `
                    <div class="watchlist-search-container">
                        <div class="watchlist-search-wrapper">
                            <i class="fas fa-search watchlist-search-icon"></i>
                            <input
                                type="search"
                                id="watchlist-search-input"
                                class="watchlist-search-input"
                                placeholder="Search watchlist..."
                                autocomplete="off"
                                autocorrect="off"
                                spellcheck="false"
                            >
                        </div>
                        <div id="watchlist-search-suggestions" class="watchlist-suggestions-box"></div>
                    </div>

                    <div id="watchlist-content-container">
                        <div class="watchlist-loading-skeleton">
                            <div class="loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;

    // Initialize watchlist data & interactions
    initWatchlist(profile, isOwnProfile, currentUser);

    // Share button listener (for all profiles)
    const shareBtn = document.getElementById('share-profile-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const profileUrl = `${window.location.origin}${window.location.pathname}#/profile/${encodeURIComponent(profile.username)}`;
            const shareData = {
                title: `${profile.username}'s Profile - MediaRoster`,
                text: `Check out ${profile.username}'s profile on MediaRoster!`,
                url: profileUrl
            };

            let shared = false;
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    shared = true;
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.warn('Native share failed, falling back to clipboard:', err);
                    } else {
                        return;
                    }
                }
            }

            if (!shared) {
                try {
                    await navigator.clipboard.writeText(profileUrl);
                } catch (err) {
                    const tempInput = document.createElement('input');
                    tempInput.value = profileUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                }
            }

            const originalHTML = shareBtn.innerHTML;
            shareBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
            shareBtn.classList.add('copied');
            setTimeout(() => {
                shareBtn.innerHTML = originalHTML;
                shareBtn.classList.remove('copied');
            }, 2000);
        });
    }

    if (!isOwnProfile) return;

    // Attach listeners for own profile
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            await initAuthUI();
            window.location.hash = '#/';
        });
    }

    const editBioBtn = document.getElementById('edit-bio-btn');
    const bioBox = document.getElementById('profile-bio-box');
    const editUsernameBtn = document.getElementById('edit-username-btn');
    const usernameHeading = document.getElementById('profile-username');

    if (editUsernameBtn && usernameHeading) {
        editUsernameBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.className = 'profile-username-input';
            input.type = 'text';
            input.maxLength = 100;
            input.value = profile.username;
            input.setAttribute('aria-label', 'Username');

            const actions = document.createElement('div');
            actions.className = 'profile-username-actions';
            actions.innerHTML = '<button type="button" class="profile-username-cancel">Cancel</button><button type="button" class="profile-username-save">Save</button>';

            const usernameRow = usernameHeading.parentElement;
            usernameRow.replaceChildren(input, actions);
            input.focus();
            input.select();
            editUsernameBtn.hidden = true;

            actions.querySelector('.profile-username-cancel').addEventListener('click', () => {
                usernameRow.replaceChildren(usernameHeading, editUsernameBtn);
                editUsernameBtn.hidden = false;
            });

            actions.querySelector('.profile-username-save').addEventListener('click', async () => {
                const username = input.value.trim();
                const saveBtn = actions.querySelector('.profile-username-save');
                const usernameRegex = /^[A-Za-z0-9_]{1,100}$/;
                if (!usernameRegex.test(username)) {
                    input.setCustomValidity('Username must be 1-100 characters long and contain only letters, numbers, and underscores.');
                    input.reportValidity();
                    return;
                }
                input.setCustomValidity('');
                saveBtn.disabled = true;

                if (username === profile.username) {
                    usernameRow.replaceChildren(usernameHeading, editUsernameBtn);
                    editUsernameBtn.hidden = false;
                    saveBtn.disabled = false;
                    return;
                }

                const { data: duplicate, error: duplicateError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .maybeSingle();

                if (duplicateError) {
                    saveBtn.disabled = false;
                    return;
                }
                if (duplicate && duplicate.id !== currentUser.id) {
                    input.setCustomValidity('That username is already taken. Please choose another.');
                    input.reportValidity();
                    saveBtn.disabled = false;
                    return;
                }

                const { error } = await supabase
                    .from('users')
                    .update({ username })
                    .eq('id', currentUser.id);

                if (error) {
                    input.setCustomValidity(error.message.includes('unique') ? 'That username is already taken. Please choose another.' : error.message);
                    input.reportValidity();
                    saveBtn.disabled = false;
                    return;
                }

                profile.username = username;
                usernameHeading.textContent = username;
                usernameRow.replaceChildren(usernameHeading, editUsernameBtn);
                editUsernameBtn.hidden = false;
                await initAuthUI();
            });
        });
    }

    if (editBioBtn && bioBox) {
        editBioBtn.addEventListener('click', () => {
            const textarea = document.createElement('textarea');
            textarea.className = 'profile-bio-input';
            textarea.maxLength = 500;
            textarea.value = profile.bio || '';
            textarea.setAttribute('aria-label', 'About me');

            const actions = document.createElement('div');
            actions.className = 'profile-bio-actions';
            actions.innerHTML = '<div id="bio-word-count" class="bio-word-count"></div><div class="profile-bio-action-buttons"><button type="button" class="profile-bio-cancel">Cancel</button><button type="button" class="profile-bio-save">Save</button></div>';

            bioBox.replaceChildren(textarea, actions);
            const wordCount = actions.querySelector('#bio-word-count');
            const updateWordCount = () => {
                wordCount.textContent = `${textarea.value.length}/500 characters`;
            };
            textarea.addEventListener('input', updateWordCount);
            updateWordCount();
            textarea.focus();
            editBioBtn.hidden = true;

            actions.querySelector('.profile-bio-cancel').addEventListener('click', () => {
                bioBox.innerHTML = profile.bio ? escapeHTML(profile.bio) : '<em>No bio provided yet.</em>';
                editBioBtn.hidden = false;
            });

            actions.querySelector('.profile-bio-save').addEventListener('click', async () => {
                const bio = textarea.value.trim() || null;
                const saveBtn = actions.querySelector('.profile-bio-save');
                saveBtn.disabled = true;

                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    await supabase.auth.signOut({ scope: 'local' });
                    window.location.hash = '#/signin';
                    return;
                }

                const { error } = await supabase
                    .from('users')
                    .update({ bio })
                    .eq('id', user.id);

                if (error) {
                    saveBtn.disabled = false;
                    return;
                }

                profile.bio = bio;
                bioBox.innerHTML = bio ? escapeHTML(bio) : '<em>No bio provided yet.</em>';
                editBioBtn.hidden = false;
            });
        });
    }
}

async function initWatchlist(profile, isOwnProfile, currentUser) {
    // Visibility toggle listener for owner
    if (isOwnProfile) {
        const toggleCheckbox = document.getElementById('watchlist-visibility-checkbox');
        const toggleLabel = document.getElementById('watchlist-visibility-label');
        if (toggleCheckbox && toggleLabel) {
            toggleCheckbox.addEventListener('change', async () => {
                const isPublic = toggleCheckbox.checked;
                toggleLabel.innerHTML = isPublic
                    ? '<i class="fas fa-globe"></i> Public'
                    : '<i class="fas fa-lock"></i> Private';
                try {
                    const { error } = await supabase
                        .from('users')
                        .update({ watchlist_public: isPublic })
                        .eq('id', currentUser.id);
                    if (error) throw error;
                    profile.watchlist_public = isPublic;
                } catch (err) {
                    console.error('Failed to update watchlist visibility:', err);
                    toggleCheckbox.checked = !isPublic;
                    toggleLabel.innerHTML = !isPublic
                        ? '<i class="fas fa-globe"></i> Public'
                        : '<i class="fas fa-lock"></i> Private';
                    alert('Could not update watchlist visibility. Please try again.');
                }
            });
        }
    }

    // If viewing someone else's profile and it's private, no need to fetch items
    if (!isOwnProfile && !profile.watchlist_public) {
        return;
    }

    const container = document.getElementById('watchlist-content-container');
    if (!container) return;

    try {
        const { data: entries, error } = await supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', profile.id)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Error fetching watchlist:', error);
            container.innerHTML = `<div class="watchlist-empty-card"><p>Failed to load watchlist: ${escapeHTML(error.message)}</p></div>`;
            return;
        }

        if (!entries || entries.length === 0) {
            container.innerHTML = `
                <div class="watchlist-empty-card">
                    <i class="fas fa-folder-open watchlist-empty-icon"></i>
                    <h3>No items in watchlist</h3>
                    <p>${isOwnProfile ? 'Your saved anime will appear here.' : `${escapeHTML(profile.username)} has no items in their watchlist yet.`}</p>
                </div>
            `;
            return;
        }

        // Fetch anime details for each entry in parallel
        const enrichedPromises = entries.map(async (entry) => {
            if (entry.type === 'anime') {
                try {
                    const details = await getAnimeDetails(entry.id);
                    return { ...entry, anime: details };
                } catch (err) {
                    console.warn(`Could not fetch details for anime ID ${entry.id}:`, err);
                    return { ...entry, anime: null };
                }
            }
            return { ...entry, anime: null };
        });

        const enrichedItems = await Promise.all(enrichedPromises);

        // Group by media type
        const groups = {};
        enrichedItems.forEach(item => {
            const type = item.type || 'anime';
            if (!groups[type]) groups[type] = [];
            groups[type].push(item);
        });

        const typeMeta = {
            anime: { title: 'Anime', icon: 'fa-tv' },
            manga: { title: 'Manga', icon: 'fa-book-open' },
            movie: { title: 'Movies', icon: 'fa-film' },
            tv_show: { title: 'TV Shows', icon: 'fa-tv' },
            web_series: { title: 'Web Series', icon: 'fa-video' },
            book: { title: 'Books', icon: 'fa-book' },
            music: { title: 'Music', icon: 'fa-music' },
            game: { title: 'Games', icon: 'fa-gamepad' },
            podcast: { title: 'Podcasts', icon: 'fa-podcast' },
            audiobook: { title: 'Audiobooks', icon: 'fa-headphones' }
        };

        let groupsHTML = '';
        for (const [typeKey, items] of Object.entries(groups)) {
            const meta = typeMeta[typeKey] || { title: typeKey, icon: 'fa-layer-group' };
            const itemsHTML = items.map(item => renderWatchlistItem(item, isOwnProfile)).join('');

            groupsHTML += `
                <div class="watchlist-group" data-media-type="${escapeHTML(typeKey)}">
                    <div class="watchlist-group-header">
                        <h3 class="watchlist-group-title">
                            <i class="fas ${meta.icon}"></i> ${escapeHTML(meta.title)}
                        </h3>
                        <span class="watchlist-group-count">${items.length} ${items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div class="watchlist-group-items">
                        ${itemsHTML}
                    </div>
                </div>
            `;
        }

        container.innerHTML = groupsHTML;

        // Setup whole card click navigation to details (excluding status container)
        setupWatchlistCardClicks();

        // Setup status dropdown changes for owner
        if (isOwnProfile) {
            setupStatusChangeListeners(currentUser);
        }

        // Setup searchbar filtering & suggestions
        setupWatchlistSearch(enrichedItems);

    } catch (err) {
        console.error('Watchlist initialization failed:', err);
        container.innerHTML = `<div class="watchlist-empty-card"><p>Failed to load watchlist.</p></div>`;
    }
}

function setupWatchlistCardClicks() {
    document.querySelectorAll('.watchlist-item-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.watchlist-item-status-wrapper')) {
                return;
            }
            const id = card.dataset.id;
            if (id) {
                window.location.hash = `#/details-${id}`;
            }
        });
    });
}

function renderWatchlistItem(item, isOwnProfile) {
    const anime = item.anime;
    const title = anime?.title_english || anime?.title || `Media #${item.id}`;
    const poster = anime?.images?.webp?.large_image_url || anime?.images?.webp?.image_url || anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url || './media/logo.webp';
    const genres = anime?.genres?.map(g => `<span class="watchlist-tag">${escapeHTML(g.name)}</span>`).join('') || '';
    const scoreTag = anime?.score ? `<span class="watchlist-tag tag-score"><i class="fas fa-star" style="color: #ffc107;"></i> ${anime.score}</span>` : '';
    const epTag = anime?.episodes ? `<span class="watchlist-tag tag-ep">${anime.episodes} eps</span>` : '';
    const typeTag = anime?.type ? `<span class="watchlist-tag tag-type">${anime.type}</span>` : '';
    const yearTag = anime?.year ? `<span class="watchlist-tag tag-year">${anime.year}</span>` : '';

    const addedDate = item.added_at ? new Date(item.added_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }) : 'Recently';

    const statusOptions = [
        { value: 'watching', label: 'Watching' },
        { value: 'completed', label: 'Completed' },
        { value: 'plan_to_watch', label: 'Plan to Watch' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'dropped', label: 'Dropped' }
    ];

    const currentStatus = item.status || 'watching';
    const currentLabel = statusOptions.find(o => o.value === currentStatus)?.label || currentStatus;

    const statusControlHTML = isOwnProfile ? `
        <div class="watchlist-status-control">
            <span class="watchlist-status-label">Status:</span>
            <select class="watchlist-status-select" data-type="${escapeHTML(item.type)}" data-id="${item.id}" data-current-status="${escapeHTML(currentStatus)}">
                ${statusOptions.map(opt => `<option value="${opt.value}" ${opt.value === currentStatus ? 'selected' : ''}>${opt.label}</option>`).join('')}
                <option value="remove" class="status-option-remove">Remove</option>
            </select>
        </div>
    ` : `
        <div class="watchlist-status-control">
            <span class="watchlist-status-label">Status:</span>
            <span class="watchlist-status-badge status-${escapeHTML(currentStatus)}">${escapeHTML(currentLabel)}</span>
        </div>
    `;

    return `
        <div class="watchlist-item-card" data-id="${item.id}" data-type="${escapeHTML(item.type)}" data-title="${escapeHTML(title.toLowerCase())}">
            <div class="watchlist-item-poster-wrapper">
                <img src="${poster}" alt="${escapeHTML(title)}" class="watchlist-item-poster" loading="lazy">
            </div>
            <div class="watchlist-item-content">
                <div class="watchlist-item-bg" style="background-image: url('${poster}');"></div>
                <div class="watchlist-item-details">
                    <div class="watchlist-title-row">
                        <div class="watchlist-item-title">${escapeHTML(title)}</div>
                    </div>
                    <div class="watchlist-tags-row">
                        ${genres}
                        ${scoreTag}
                        ${epTag}
                        ${typeTag}
                        ${yearTag}
                    </div>
                    <div class="watchlist-item-date">
                        <i class="far fa-clock"></i> Added at: ${escapeHTML(addedDate)}
                    </div>
                </div>
            </div>
            <div class="watchlist-item-status-wrapper">
                ${statusControlHTML}
            </div>
        </div>
    `;
}

function setupStatusChangeListeners(currentUser) {
    document.querySelectorAll('.watchlist-status-select').forEach(select => {
        select.addEventListener('change', async () => {
            const newStatus = select.value;
            const type = select.dataset.type;
            const id = parseInt(select.dataset.id, 10);
            const card = select.closest('.watchlist-item-card');
            const group = card?.closest('.watchlist-group');

            if (newStatus === 'remove') {
                if (!confirm('Are you sure you want to remove this item from your watchlist?')) {
                    select.value = select.dataset.currentStatus || 'watching';
                    return;
                }

                select.disabled = true;
                const { error } = await supabase
                    .from('watchlist')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('type', type)
                    .eq('id', id);

                if (error) {
                    console.error('Failed to delete item from watchlist:', error);
                    select.disabled = false;
                    select.value = select.dataset.currentStatus || 'watching';
                    alert('Could not remove item. Please try again.');
                    return;
                }

                if (card) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.remove();
                        if (group) {
                            const remainingCards = group.querySelectorAll('.watchlist-item-card');
                            const countEl = group.querySelector('.watchlist-group-count');
                            if (countEl) {
                                countEl.textContent = `${remainingCards.length} ${remainingCards.length === 1 ? 'item' : 'items'}`;
                            }
                            if (remainingCards.length === 0) {
                                group.remove();
                            }
                        }
                        const allCards = document.querySelectorAll('.watchlist-item-card');
                        if (allCards.length === 0) {
                            const container = document.getElementById('watchlist-content-container');
                            if (container) {
                                container.innerHTML = `
                                    <div class="watchlist-empty-card">
                                        <i class="fas fa-folder-open watchlist-empty-icon"></i>
                                        <h3>No items in watchlist</h3>
                                        <p>Your saved anime will appear here.</p>
                                    </div>
                                `;
                            }
                        }
                    }, 300);
                }
            } else {
                select.disabled = true;
                const { error } = await supabase
                    .from('watchlist')
                    .update({ status: newStatus })
                    .eq('user_id', currentUser.id)
                    .eq('type', type)
                    .eq('id', id);

                if (error) {
                    console.error('Failed to update watchlist status:', error);
                    select.disabled = false;
                    select.value = select.dataset.currentStatus || 'watching';
                    alert('Could not update status. Please try again.');
                    return;
                }

                select.dataset.currentStatus = newStatus;
                select.disabled = false;
            }
        });
    });
}

function setupWatchlistSearch(enrichedItems) {
    const searchInput = document.getElementById('watchlist-search-input');
    const suggestionsBox = document.getElementById('watchlist-search-suggestions');
    if (!searchInput || !suggestionsBox) return;

    let debounceTimer;

    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        const cards = document.querySelectorAll('.watchlist-item-card');
        const groups = document.querySelectorAll('.watchlist-group');

        if (!query) {
            cards.forEach(card => card.style.display = 'flex');
            groups.forEach(group => group.style.display = 'block');
            suggestionsBox.classList.remove('active');
            suggestionsBox.innerHTML = '';
            const noRes = document.getElementById('watchlist-no-results-msg');
            if (noRes) noRes.remove();
            return;
        }

        let totalVisible = 0;
        cards.forEach(card => {
            const title = card.dataset.title || '';
            const match = title.includes(query);
            card.style.display = match ? 'flex' : 'none';
            if (match) totalVisible++;
        });

        groups.forEach(group => {
            const visibleInGroup = group.querySelectorAll('.watchlist-item-card:not([style*="display: none"])').length;
            group.style.display = visibleInGroup > 0 ? 'block' : 'none';
        });

        const container = document.getElementById('watchlist-content-container');
        let noResMsg = document.getElementById('watchlist-no-results-msg');
        if (totalVisible === 0) {
            if (!noResMsg && container) {
                noResMsg = document.createElement('div');
                noResMsg.id = 'watchlist-no-results-msg';
                noResMsg.className = 'watchlist-no-search';
                noResMsg.innerHTML = '<p><i class="fas fa-search"></i> No matching items found in watchlist.</p>';
                container.appendChild(noResMsg);
            }
        } else {
            if (noResMsg) noResMsg.remove();
        }

        // Generate suggestions dropdown from watchlist items
        const matchingItems = enrichedItems.filter(item => {
            const anime = item.anime;
            const title = (anime?.title_english || anime?.title || '').toLowerCase();
            return title.includes(query);
        }).slice(0, 5);

        if (matchingItems.length > 0) {
            suggestionsBox.innerHTML = matchingItems.map(item => {
                const anime = item.anime;
                const title = anime?.title_english || anime?.title || `Media #${item.id}`;
                const poster = anime?.images?.webp?.image_url || anime?.images?.jpg?.image_url || './media/logo.webp';
                return `
                    <div class="watchlist-suggestion-item" data-id="${item.id}">
                        <img src="${poster}" alt="${escapeHTML(title)}" class="watchlist-suggestion-thumb">
                        <div class="watchlist-suggestion-info">
                            <div class="watchlist-suggestion-title">${escapeHTML(title)}</div>
                            <div class="watchlist-suggestion-meta">
                                <span><i class="fas fa-video"></i> ${item.type}</span>
                                <span><i class="fas fa-tag"></i> ${item.status || 'watching'}</span>
                                ${anime?.score ? `<span><i class="fas fa-star" style="color:#ffc107;"></i> ${anime.score}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            suggestionsBox.classList.add('active');

            suggestionsBox.querySelectorAll('.watchlist-suggestion-item').forEach(sug => {
                sug.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    const id = sug.dataset.id;
                    const targetCard = document.querySelector(`.watchlist-item-card[data-id="${id}"]`);
                    if (targetCard) {
                        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetCard.classList.remove('highlight-flash');
                        void targetCard.offsetWidth; // Trigger reflow
                        targetCard.classList.add('highlight-flash');
                    }
                    suggestionsBox.classList.remove('active');
                });
            });
        } else {
            suggestionsBox.classList.remove('active');
            suggestionsBox.innerHTML = '';
        }
    };

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 150);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim()) {
            performSearch();
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsBox.classList.remove('active');
        }, 200);
    });
}
