import { supabase } from '../supabase.js';
import { loadCSS, hideLoader } from '../pages.js';
import { escapeHTML } from './UIs.js';

export async function loadProfilePage() {
    document.title = 'Profile - MediaRoster';
    loadCSS('./css/auth.css');
    hideLoader();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.hash = '#/signin';
        return;
    }

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

    if (!profile) {
        window.location.hash = '#/profile-setup';
        return;
    }

    const content = document.getElementById('content');
    if (!content) return;

    const joinedDate = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';
    const profileInitial = escapeHTML(String(profile.username || '?').charAt(0).toUpperCase());

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
                        <h1 class="profile-username">${escapeHTML(profile.username)}</h1>
                        <p class="profile-joined"><span>Member since</span> ${escapeHTML(joinedDate)}</p>
                    </div>
                </div>
                <div class="profile-about-side">
                    <div class="profile-top-bar">
                        <button id="logout-btn" class="logout-btn">
                            <i class="fas fa-sign-out-alt"></i><span>Logout</span>
                        </button>
                    </div>
                    <div class="profile-about-heading">
                        <h3 class="profile-about-title">About me</h3>
                        <button id="edit-bio-btn" class="profile-icon-btn" type="button" aria-label="Edit about me" title="Edit about me">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                    <div id="profile-bio-box" class="profile-bio-box">
                        ${profile.bio ? escapeHTML(profile.bio) : '<em>No bio provided yet.</em>'}
                    </div>
                </div>
            </div>

            <div class="profile-watchlist-section">
                <div class="watchlist-empty-state">
                    <i class="fas fa-book" aria-hidden="true"></i>
                    <div>
                        <h2>Watchlist</h2>
                        <p>Your saved anime will appear here.</p>
                    </div>
                    <a href="#/search" class="watchlist-browse-link"><i class="fas fa-search"></i> Browse anime</a>
                </div>
            </div>
        </div>
    `;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.hash = '#/';
        });
    }

    const editBioBtn = document.getElementById('edit-bio-btn');
    const bioBox = document.getElementById('profile-bio-box');
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

                const { error } = await supabase
                    .from('users')
                    .update({ bio })
                    .eq('id', session.user.id);

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
