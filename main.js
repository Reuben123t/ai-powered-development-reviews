/**
 * Main Application Logic
 * Event: "AI powered development" · VJCET Showcase
 */

// Global State
let currentReviews = [];
let activeStarFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';

// Helper: Toast Notifications
function showToast(message, icon = '⚡') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'cyber-toast';
  toast.innerHTML = `<span style="font-size:1.1rem; color:var(--cyan);">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  if (window.cyberAudio) {
    window.cyberAudio.blip(750, 'sine', 0.06);
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

// Format Relative Time
function formatRelativeTime(dateString) {
  if (!dateString) return 'Recent';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
}

// Get User Initials
function getInitials(name) {
  if (!name) return 'AI';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Mask Email for Privacy
function maskEmail(email) {
  if (!email || !email.includes('@')) return 'verified-attendee';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

// Rating Levels Metadata
const RATING_LEVELS = {
  1: { badge: '🔴 LEVEL 1 // CRITICAL REFACTOR', color: '#ef4444' },
  2: { badge: '🟠 LEVEL 2 // MODERATE POTENTIAL', color: '#f97316' },
  3: { badge: '🟡 LEVEL 3 // SOLID CAPABILITY', color: '#eab308' },
  4: { badge: '🟢 LEVEL 4 // HIGH IMPACT & INSPIRING', color: '#10b981' },
  5: { badge: '💎 LEVEL 5 // GROUNDBREAKING NEXT-GEN AI', color: '#00f0ff' }
};

// Initialize Rating Bar System
function initRatingBar(containerId = 'ratingBarContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const slider = container.querySelector('.cyber-slider');
  const levelBadge = container.querySelector('.rating-level-badge');
  const scoreNum = container.querySelector('.numeric-score-value');
  const starNodes = container.querySelectorAll('.star-node');

  function updateRatingUI(val) {
    const rating = Math.max(1, Math.min(5, parseInt(val, 10) || 5));
    if (slider) slider.value = rating;

    // Update level badge
    if (levelBadge && RATING_LEVELS[rating]) {
      levelBadge.textContent = RATING_LEVELS[rating].badge;
      levelBadge.style.borderColor = RATING_LEVELS[rating].color;
      levelBadge.style.color = RATING_LEVELS[rating].color;
      levelBadge.style.boxShadow = `0 0 14px ${RATING_LEVELS[rating].color}55`;
    }

    // Update numeric text
    if (scoreNum) {
      scoreNum.textContent = rating;
    }

    // Update star nodes
    starNodes.forEach(node => {
      const nodeVal = parseInt(node.getAttribute('data-value'), 10);
      if (nodeVal <= rating) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    if (window.cyberAudio) {
      window.cyberAudio.ratingTick(rating);
    }
  }

  if (slider) {
    slider.addEventListener('input', (e) => updateRatingUI(e.target.value));
  }

  starNodes.forEach(node => {
    node.addEventListener('click', () => {
      const val = node.getAttribute('data-value');
      updateRatingUI(val);
    });
  });

  // Default to 5
  updateRatingUI(5);
}

// Global Omnibox Search Bar Behavior
function initSearchOmnibox() {
  const searchInput = document.getElementById('navSearchInput');
  const routeBadge = document.getElementById('navRouteBadge');

  if (!searchInput) return;

  // Keyboard shortcut '/'
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  function handleSearchRoute(query) {
    const trimmed = query.trim().toLowerCase();
    if (trimmed === '/review' || trimmed === '/reviews' || trimmed === 'review' || trimmed === 'reviews') {
      window.location.href = '/review';
      return;
    }

    // If on review page, filter opinions
    if (window.location.pathname.includes('review') || document.getElementById('reviewGalleryGrid')) {
      searchQuery = trimmed;
      renderReviewsGrid();
    } else {
      // If on home page and hits enter with text, route to review with query
      if (trimmed.length > 0) {
        window.location.href = `/review?q=${encodeURIComponent(trimmed)}`;
      }
    }
  }

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchRoute(searchInput.value);
    }
  });

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (routeBadge) {
      if (val === '/review' || val === '/reviews' || val === 'review') {
        routeBadge.style.display = 'inline-block';
        routeBadge.textContent = '⚡ Go to /review';
      } else if (val.length > 0 && !window.location.pathname.includes('review')) {
        routeBadge.style.display = 'inline-block';
        routeBadge.textContent = '↵ Search in /review';
      } else {
        routeBadge.style.display = 'none';
      }
    }

    // Live search on review page
    if (document.getElementById('reviewGalleryGrid')) {
      searchQuery = val;
      renderReviewsGrid();
    }
  });

  if (routeBadge) {
    routeBadge.addEventListener('click', () => {
      handleSearchRoute(searchInput.value || '/review');
    });
  }
}

// Sound Toggle Handler
function initSoundToggle() {
  const btn = document.getElementById('soundToggleBtn');
  if (!btn) return;

  function updateBtnUI(enabled) {
    btn.innerHTML = enabled ? '🔊 Sound: ON' : '🔇 Sound: MUTED';
    btn.style.color = enabled ? 'var(--cyan)' : 'var(--text-muted)';
    btn.style.borderColor = enabled ? 'var(--cyan)' : 'var(--border-subtle)';
  }

  const initialEnabled = localStorage.getItem('cyber_audio_muted') !== 'true';
  updateBtnUI(initialEnabled);

  btn.addEventListener('click', () => {
    if (window.cyberAudio) {
      const state = window.cyberAudio.toggle();
      updateBtnUI(state);
      showToast(state ? 'Cyber audio enabled' : 'Cyber audio muted', state ? '🔊' : '🔇');
    }
  });
}

// Prompt Inspiration Chips Helper
function initPromptChips(textareaId = 'commentInput') {
  const chips = document.querySelectorAll('.prompt-chip');
  const textarea = document.getElementById(textareaId);
  const charCounter = document.getElementById('charCount');

  if (textarea && charCounter) {
    textarea.addEventListener('input', () => {
      charCounter.textContent = `${textarea.value.length} / 500`;
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (!textarea) return;
      const textToAppend = chip.getAttribute('data-append') || chip.textContent.trim();
      if (textarea.value.trim().length > 0) {
        textarea.value += ' ' + textToAppend;
      } else {
        textarea.value = textToAppend;
      }
      textarea.focus();
      if (charCounter) charCounter.textContent = `${textarea.value.length} / 500`;
      if (window.cyberAudio) window.cyberAudio.blip(520, 'sine', 0.04);
    });
  });
}

// Render Telemetry Analytics HUD
function updateTelemetryDisplay(stats) {
  // Update general stat badges
  const avgElements = document.querySelectorAll('.dyn-avg-rating');
  const totalElements = document.querySelectorAll('.dyn-total-reviews');
  const posElements = document.querySelectorAll('.dyn-positive-rate');

  avgElements.forEach(el => el.textContent = stats.average);
  totalElements.forEach(el => el.textContent = stats.total);
  posElements.forEach(el => el.textContent = `${stats.positiveRate}%`);

  const starsElements = document.querySelectorAll('.dyn-stars-glyph');
  const rounded = Math.round(Number(stats.numericAverage) || 0);
  const starsGlyph = stats.total > 0 ? ('★'.repeat(rounded) + '☆'.repeat(5 - rounded)) : '★★★★★';
  starsElements.forEach(el => el.textContent = starsGlyph);

  // Update SVG radial circle if present
  const progressCircle = document.getElementById('scoreCircleProgress');
  if (progressCircle) {
    const circumference = 2 * Math.PI * 58; // r=58 -> ~364.42
    const scoreFrac = stats.numericAverage / 5;
    const offset = circumference - (circumference * scoreFrac);
    progressCircle.style.strokeDashoffset = offset;
  }

  // Update star breakdown distribution bars
  for (let s = 1; s <= 5; s++) {
    const fillBar = document.getElementById(`distBar${s}`);
    const countBadge = document.getElementById(`distCount${s}`);
    if (fillBar) {
      fillBar.style.width = `${stats.percentages[s] || 0}%`;
    }
    if (countBadge) {
      countBadge.textContent = `${stats.counts[s] || 0} (${stats.percentages[s] || 0}%)`;
    }
  }
}

// Render Review Opinion Cards Grid
function renderReviewsGrid() {
  const container = document.getElementById('reviewGalleryGrid');
  if (!container) return;

  const countBadge = document.getElementById('opinionsCountBadge');

  let filtered = currentReviews.filter(r => {
    // Star filter
    if (activeStarFilter !== 'all') {
      const targetStar = parseInt(activeStarFilter, 10);
      if (Math.round(r.rating) !== targetStar) return false;
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      if (!matchName && !matchComment && !matchEmail) return false;
    }

    return true;
  });

  // Sort
  if (currentSort === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (currentSort === 'highest') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentSort === 'lowest') {
    filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }

  if (countBadge) {
    countBadge.textContent = `Showing ${filtered.length} of ${currentReviews.length} participant opinions`;
  }

  if (filtered.length === 0) {
    if (currentReviews.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛰️</div>
          <h3 style="font-family:var(--font-cyber); margin-bottom:0.5rem; color:#fff;">No Reviews Yet</h3>
          <p style="color:var(--text-dim); max-width:460px; margin:0 auto 1.5rem;">
            No attendee ratings have been submitted yet. Be the first to share your experience with the <strong>AI Powered Development</strong> showcase!
          </p>
          <a href="#submitReviewForm" class="cyber-btn cyber-btn-primary cyber-btn-sm" onclick="if(document.getElementById('userNameInput')) document.getElementById('userNameInput').focus();">
            ⚡ Transmit First Review
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3 style="font-family:var(--font-cyber); margin-bottom:0.5rem; color:#fff;">No Matching Reviews</h3>
          <p style="color:var(--text-dim); max-width:400px; margin:0 auto 1.5rem;">
            No opinions match your current search or star filter criteria.
          </p>
          <button class="cyber-btn cyber-btn-outline cyber-btn-sm" onclick="resetFilters()">
            ↺ Reset Filters
          </button>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = filtered.map(r => {
    const initials = getInitials(r.name);
    const masked = maskEmail(r.email);
    const timeAgo = formatRelativeTime(r.created_at);
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const likedKey = `liked_review_${r.id}`;
    const isLiked = localStorage.getItem(likedKey) === 'true';

    return `
      <div class="opinion-card" id="card-${r.id}">
        <div>
          <div class="opinion-header">
            <div class="user-meta-wrap">
              <div class="cyber-avatar">${initials}</div>
              <div class="user-info-text">
                <span class="user-name">${escapeHtml(r.name)}</span>
                <span class="user-email-pill">
                  <span class="verified-icon">✔</span> ${escapeHtml(masked)}
                </span>
              </div>
            </div>
            <div class="opinion-rating-badge">
              <span>${stars}</span>
              <strong>${r.rating}.0</strong>
            </div>
          </div>
          <div class="opinion-quote-glyph">“</div>
          <div class="opinion-body">
            ${escapeHtml(r.comment)}
          </div>
        </div>
        <div class="opinion-footer">
          <span>🕒 ${timeAgo}</span>
          <div class="opinion-actions">
            <button class="helpful-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${r.id}', this)" title="Mark as insightful feedback">
              <span>${isLiked ? '💖' : '🤍'}</span> Helpful
            </button>
            <button class="copy-btn" onclick="copyReviewOpinion('${escapeForAttr(r.name)}', '${escapeForAttr(r.comment)}')" title="Copy Opinion Quote">
              📋
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Reset Filters
function resetFilters() {
  activeStarFilter = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('navSearchInput');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.filter-chip').forEach(c => {
    if (c.getAttribute('data-star') === 'all') c.classList.add('active');
    else c.classList.remove('active');
  });

  renderReviewsGrid();
  showToast('Filters reset to default', '↺');
}

// Like / Helpful Toggle
function toggleLike(reviewId, btn) {
  const key = `liked_review_${reviewId}`;
  const isLiked = localStorage.getItem(key) === 'true';

  if (isLiked) {
    localStorage.removeItem(key);
    btn.classList.remove('liked');
    btn.querySelector('span').textContent = '🤍';
    showToast('Feedback unbookmarked', '🤍');
  } else {
    localStorage.setItem(key, 'true');
    btn.classList.add('liked');
    btn.querySelector('span').textContent = '💖';
    if (window.cyberAudio) window.cyberAudio.blip(800, 'triangle', 0.08);
    showToast('Marked as helpful feedback!', '💖');
  }
}

// Copy Review Quote
function copyReviewOpinion(name, comment) {
  const text = `"${comment}" — ${name} (AI Powered Development Review)`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Review quote copied to clipboard!', '📋');
  });
}

// Escape HTML utility
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeForAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Load and Sync Reviews
async function loadReviewsData() {
  try {
    const list = await window.SupabaseReviews.fetchReviews();
    currentReviews = list;
    const stats = window.SupabaseReviews.calculateStats(currentReviews);

    updateTelemetryDisplay(stats);

    // If on review page, render grid
    if (document.getElementById('reviewGalleryGrid')) {
      renderReviewsGrid();
    }

    // If on index page, render recent preview
    renderRecentPreviewTicker();

  } catch (err) {
    console.error('Error loading reviews:', err);
    showToast('Failed to sync reviews from Supabase', '⚠️');
  }
}

// Render Recent Opinions Carousel / Ticker on Home Page
function renderRecentPreviewTicker() {
  const container = document.getElementById('recentReviewsCarousel');
  if (!container) return;

  if (currentReviews.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:1rem;">Awaiting first verified attendee review...</div>`;
    return;
  }

  const latestThree = currentReviews.slice(0, 3);
  container.innerHTML = latestThree.map(r => `
    <div class="opinion-card" style="min-width:280px; flex:1;">
      <div class="opinion-header">
        <div class="user-meta-wrap">
          <div class="cyber-avatar">${getInitials(r.name)}</div>
          <div class="user-info-text">
            <span class="user-name">${escapeHtml(r.name)}</span>
            <span class="user-email-pill"><span class="verified-icon">✔</span> ${escapeHtml(maskEmail(r.email))}</span>
          </div>
        </div>
        <div class="opinion-rating-badge">
          ★ ${r.rating}.0
        </div>
      </div>
      <p class="opinion-body" style="font-size:0.88rem; line-height:1.5;">“${escapeHtml(r.comment)}”</p>
      <div class="opinion-footer">
        <span>🕒 ${formatRelativeTime(r.created_at)}</span>
      </div>
    </div>
  `).join('');
}

// Submit Form Handler
function initReviewForm(formId = 'reviewForm') {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const slider = form.querySelector('.cyber-slider');
    const commentInput = form.querySelector('[name="comment"]');
    const submitBtn = form.querySelector('.submit-cyber-btn');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const rating = slider ? parseInt(slider.value, 10) : 5;
    const comment = commentInput ? commentInput.value.trim() : '';

    // Validation
    if (name.length < 2) {
      showToast('Please enter your full name', '⚠️');
      if (nameInput) nameInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', '⚠️');
      if (emailInput) emailInput.focus();
      return;
    }

    if (comment.length < 10) {
      showToast('Please share at least 10 characters describing your experience', '⚠️');
      if (commentInput) commentInput.focus();
      return;
    }

    // Submit Action
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <div class="cyber-spinner" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></div>
          Broadcasting to Supabase...
        `;
      }

      const newRecord = await window.SupabaseReviews.submitReview({
        name,
        email,
        rating,
        comment
      });

      if (window.cyberAudio) {
        window.cyberAudio.successChime();
      }

      // Add to local state & recalculate
      currentReviews.unshift(newRecord);
      const stats = window.SupabaseReviews.calculateStats(currentReviews);
      updateTelemetryDisplay(stats);

      if (document.getElementById('reviewGalleryGrid')) {
        renderReviewsGrid();
      }
      renderRecentPreviewTicker();

      // Show success modal or toast
      showSuccessModal(name, rating, comment);
      form.reset();

      // Re-initialize rating bar to default
      initRatingBar('ratingBarContainer');
      const charCounter = document.getElementById('charCount');
      if (charCounter) charCounter.textContent = '0 / 500';

    } catch (err) {
      console.error('Submission failed:', err);
      showToast(err.message || 'Error saving review. Please try again.', '❌');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `⚡ TRANSMIT REVIEW PROTOCOL`;
      }
    }
  });
}

// Success Modal
function showSuccessModal(name, rating, comment) {
  const modal = document.getElementById('successModal');
  if (!modal) {
    showToast('Your review has been broadcast successfully!', '✨');
    return;
  }

  const modalName = document.getElementById('modalSubmittedName');
  const modalScore = document.getElementById('modalSubmittedScore');

  if (modalName) modalName.textContent = name;
  if (modalScore) modalScore.textContent = `${rating} / 5 Stars`;

  modal.classList.add('open');
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('open');
}

// Init Filter Toolbar on /review page
function initFilterToolbar() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStarFilter = chip.getAttribute('data-star') || 'all';
      renderReviewsGrid();
    });
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderReviewsGrid();
    });
  }

  // Check URL query parameters for search (?q=)
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  if (qParam) {
    searchQuery = qParam;
    const searchInput = document.getElementById('navSearchInput');
    if (searchInput) searchInput.value = qParam;
  }
}

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initRatingBar('ratingBarContainer');
  initRatingBar('modalRatingBarContainer');
  initSearchOmnibox();
  initSoundToggle();
  initPromptChips('commentInput');
  initPromptChips('modalCommentInput');
  initReviewForm('reviewForm');
  initReviewForm('modalReviewForm');
  initFilterToolbar();

  // Load reviews data
  loadReviewsData();

  // Subscribe to realtime updates
  if (window.SupabaseReviews) {
    window.SupabaseReviews.subscribeToReviews((newRow) => {
      // Check if already in currentReviews
      if (!currentReviews.some(r => r.id === newRow.id)) {
        currentReviews.unshift(newRow);
        const stats = window.SupabaseReviews.calculateStats(currentReviews);
        updateTelemetryDisplay(stats);
        if (document.getElementById('reviewGalleryGrid')) {
          renderReviewsGrid();
        }
        renderRecentPreviewTicker();
        showToast(`New live review received from ${newRow.name}!`, '🌟');
      }
    });
  }
});
