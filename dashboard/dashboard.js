/**
 * Organizer Dashboard Logic
 * Event: AI Powered Development · Review Telemetry & CSV Download
 */

let reviews = [];
let activeStarFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';

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
  }, 3500);
}

function formatTime(dateString) {
  if (!dateString) return 'Recent';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'Recent';
  }
}

function getInitials(name) {
  if (!name) return 'AI';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function updateTelemetry(stats) {
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

  const progressCircle = document.getElementById('scoreCircleProgress');
  if (progressCircle) {
    const circumference = 2 * Math.PI * 58;
    const scoreFrac = stats.numericAverage / 5;
    const offset = circumference - (circumference * scoreFrac);
    progressCircle.style.strokeDashoffset = offset;
  }

  for (let s = 1; s <= 5; s++) {
    const fillBar = document.getElementById(`distBar${s}`);
    const countBadge = document.getElementById(`distCount${s}`);
    if (fillBar) fillBar.style.width = `${stats.percentages[s] || 0}%`;
    if (countBadge) countBadge.textContent = `${stats.counts[s] || 0} (${stats.percentages[s] || 0}%)`;
  }
}

function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  const countBadge = document.getElementById('countBadge');
  if (!grid) return;

  let filtered = reviews.filter(r => {
    if (activeStarFilter !== 'all') {
      const star = parseInt(activeStarFilter, 10);
      if (Math.round(r.rating) !== star) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchComment) return false;
    }

    return true;
  });

  if (currentSort === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (currentSort === 'highest') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentSort === 'lowest') {
    filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }

  if (countBadge) {
    countBadge.textContent = `Displaying ${filtered.length} of ${reviews.length} attendee reviews`;
  }

  if (filtered.length === 0) {
    if (reviews.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛰️</div>
          <h3 style="font-family:var(--font-cyber); margin-bottom:0.5rem; color:#fff;">No Reviews Recorded Yet</h3>
          <p style="color:var(--text-dim); max-width:480px; margin:0 auto 1.5rem;">
            Awaiting attendees to submit reviews from the review portal. Real-time sync is active.
          </p>
          <a href="https://ai-powered-development-reviews.vercel.app/review" target="_blank" rel="noopener" class="cyber-btn cyber-btn-primary cyber-btn-sm">
            🔗 Open Review Portal ↗
          </a>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3 style="font-family:var(--font-cyber); margin-bottom:0.5rem; color:#fff;">No Matching Reviews</h3>
          <p style="color:var(--text-dim); max-width:400px; margin:0 auto 1.5rem;">
            No attendee reviews match your current search or star filter criteria.
          </p>
          <button class="cyber-btn cyber-btn-outline cyber-btn-sm" onclick="resetFilters()">
            ↺ Reset Filters
          </button>
        </div>
      `;
    }
    return;
  }

  grid.innerHTML = filtered.map(r => {
    const initials = getInitials(r.name);
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const timeFormatted = formatTime(r.created_at);

    return `
      <div class="opinion-card">
        <div>
          <div class="opinion-header">
            <div class="user-meta-wrap">
              <div class="cyber-avatar">${initials}</div>
              <div class="user-info-text">
                <span class="user-name">${escapeHtml(r.name)}</span>
                <span class="user-email-pill" style="color:var(--cyan);">
                  ✉️ ${escapeHtml(r.email)}
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
          <span>🕒 ${timeFormatted}</span>
          <div class="opinion-actions">
            <button class="copy-btn" onclick="copyReview('${escapeForAttr(r.name)}', '${escapeForAttr(r.comment)}')" title="Copy Review Quote">
              📋
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  activeStarFilter = 'all';
  searchQuery = '';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';

  document.querySelectorAll('.filter-chip').forEach(c => {
    if (c.getAttribute('data-star') === 'all') c.classList.add('active');
    else c.classList.remove('active');
  });

  renderReviews();
  showToast('Filters reset', '↺');
}

function copyReview(name, comment) {
  const text = `"${comment}" — ${name}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', '📋');
  });
}

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

async function loadData() {
  try {
    const data = await window.SupabaseReviews.fetchReviews();
    reviews = data;
    const stats = window.SupabaseReviews.calculateStats(reviews);
    updateTelemetry(stats);
    renderReviews();
  } catch (err) {
    console.error('Failed to load reviews:', err);
    showToast('Error syncing reviews from database', '❌');
  }
}

// Download as CSV File
function downloadCSV() {
  if (!reviews || reviews.length === 0) {
    showToast('No reviews to export yet. Awaiting first submission!', 'ℹ️');
    return;
  }

  const headers = ['ID', 'Event Name', 'Attendee Name', 'Attendee Email', 'Rating', 'Comment', 'Submitted At'];
  const rows = reviews.map(r => [
    `"${(r.id || '').replace(/"/g, '""')}"`,
    `"${(r.event_name || 'AI powered development').replace(/"/g, '""')}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    Number(r.rating) || 5,
    `"${(r.comment || '').replace(/"/g, '""')}"`,
    `"${(r.created_at || new Date().toISOString()).replace(/"/g, '""')}"`
  ]);

  const csvString = [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `ai-powered-development-reviews-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Downloaded ${reviews.length} reviews as CSV file!`, '📥');
  if (window.cyberAudio) window.cyberAudio.successChime();
}

// Staged records for CSV import
let stagedImportReviews = [];

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentField.trim());
      if (row.some(f => f.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || row.length > 0) {
    row.push(currentField.trim());
    if (row.some(f => f.length > 0)) lines.push(row);
  }

  if (lines.length === 0) return [];

  const firstRow = lines[0].map(c => c.toLowerCase());
  let nameIdx = -1, emailIdx = -1, ratingIdx = -1, commentIdx = -1, eventIdx = -1;

  firstRow.forEach((col, idx) => {
    if (col.includes('name') && !col.includes('event')) nameIdx = idx;
    else if (col.includes('mail')) emailIdx = idx;
    else if (col.includes('rating') || col.includes('score') || col.includes('star')) ratingIdx = idx;
    else if (col.includes('comment') || col.includes('feedback') || col.includes('opinion') || col.includes('experience')) commentIdx = idx;
    else if (col.includes('event')) eventIdx = idx;
  });

  const hasHeader = (nameIdx !== -1 || ratingIdx !== -1 || commentIdx !== -1);
  const dataRows = hasHeader ? lines.slice(1) : lines;

  if (!hasHeader) {
    if (lines[0].length >= 4) {
      nameIdx = 0; emailIdx = 1; ratingIdx = 2; commentIdx = 3;
    } else if (lines[0].length === 3) {
      nameIdx = 0; ratingIdx = 1; commentIdx = 2;
    } else {
      nameIdx = 0; commentIdx = 1; ratingIdx = -1;
    }
  }

  return dataRows
    .map(cols => {
      if (!cols || cols.length === 0 || !cols.some(c => c.length > 0)) return null;
      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : 'Attendee';
      const email = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : '';
      let rating = 5;
      if (ratingIdx !== -1 && cols[ratingIdx]) {
        const parsed = parseInt(cols[ratingIdx], 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) rating = parsed;
      }
      const comment = commentIdx !== -1 && cols[commentIdx] ? cols[commentIdx] : 'Attended workshop session.';
      const event_name = eventIdx !== -1 && cols[eventIdx] ? cols[eventIdx] : 'AI powered development';

      return { name, email, rating, comment, event_name };
    })
    .filter(Boolean);
}

// Modal Handlers
function openResetModal() {
  const modal = document.getElementById('resetModal');
  const input = document.getElementById('resetPasswordInput');
  const errMsg = document.getElementById('resetErrorMsg');
  if (modal) {
    if (input) {
      input.value = '';
      input.classList.remove('shake-animation');
    }
    if (errMsg) errMsg.style.display = 'none';
    modal.classList.add('active');
    setTimeout(() => { if (input) input.focus(); }, 150);
  }
}

function closeResetModal() {
  const modal = document.getElementById('resetModal');
  if (modal) modal.classList.remove('active');
}

function openImportModal() {
  const modal = document.getElementById('importModal');
  const previewArea = document.getElementById('csvPreviewArea');
  const confirmBtn = document.getElementById('confirmImportBtn');
  stagedImportReviews = [];
  if (previewArea) previewArea.style.display = 'none';
  if (confirmBtn) confirmBtn.style.display = 'none';
  if (modal) modal.classList.add('active');
}

function closeImportModal() {
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.remove('active');
  stagedImportReviews = [];
}

async function handleResetData() {
  const input = document.getElementById('resetPasswordInput');
  const errMsg = document.getElementById('resetErrorMsg');
  const confirmBtn = document.getElementById('confirmResetBtn');
  const pwd = input ? input.value.trim() : '';

  if (!pwd) {
    if (errMsg) {
      errMsg.textContent = 'Please enter the authorization password.';
      errMsg.style.display = 'block';
    }
    if (input) {
      input.classList.add('shake-animation');
      setTimeout(() => input.classList.remove('shake-animation'), 400);
    }
    return;
  }

  if (pwd !== 'Black1') {
    if (errMsg) {
      errMsg.textContent = 'Access Denied: Incorrect authorization password.';
      errMsg.style.display = 'block';
    }
    if (input) {
      input.classList.add('shake-animation');
      setTimeout(() => input.classList.remove('shake-animation'), 400);
    }
    if (window.cyberAudio) window.cyberAudio.errorBeep();
    return;
  }

  // Password is Black1 - proceed with reset
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Purging Database...';
  }

  try {
    const result = await window.SupabaseReviews.resetReviews('Black1');
    if (result && result.success) {
      reviews = [];
      const stats = window.SupabaseReviews.calculateStats([]);
      updateTelemetry(stats);
      renderReviews();
      closeResetModal();
      showToast('Database reset successfully! All reviews purged.', '🗑️');
      if (window.cyberAudio) window.cyberAudio.successChime();
    } else {
      if (errMsg) {
        errMsg.textContent = (result && result.message) ? result.message : 'Reset failed. Please verify credentials.';
        errMsg.style.display = 'block';
      }
    }
  } catch (err) {
    console.error('Reset error:', err);
    if (errMsg) {
      errMsg.textContent = err.message || 'Error executing database reset.';
      errMsg.style.display = 'block';
    }
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '🔥 Confirm Purge & Reset';
    }
  }
}

function handleCSVFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv')) {
    showToast('Please select a valid .csv file', '⚠️');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const parsed = parseCSV(content);

    if (parsed.length === 0) {
      showToast('No valid review rows found in the CSV file.', '⚠️');
      return;
    }

    stagedImportReviews = parsed;

    // Render Preview
    const previewArea = document.getElementById('csvPreviewArea');
    const previewBody = document.getElementById('csvPreviewBody');
    const fileLabel = document.getElementById('csvFileLabel');
    const countBadge = document.getElementById('csvRowCountBadge');
    const confirmBtn = document.getElementById('confirmImportBtn');

    if (fileLabel) fileLabel.textContent = `File: ${file.name}`;
    if (countBadge) countBadge.textContent = `${parsed.length} records ready`;

    if (previewBody) {
      const previewRows = parsed.slice(0, 5).map(r => `
        <tr>
          <td><strong style="color:#fff;">${escapeHtml(r.name)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(r.email)}</small></td>
          <td style="color:#ffd700; white-space:nowrap;">${'★'.repeat(r.rating)}</td>
          <td><div style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(r.comment)}</div></td>
        </tr>
      `).join('');
      previewBody.innerHTML = previewRows;
    }

    if (previewArea) previewArea.style.display = 'block';
    if (confirmBtn) {
      confirmBtn.style.display = 'inline-flex';
      confirmBtn.textContent = `⚡ Import ${parsed.length} Reviews to Supabase`;
    }

    showToast(`Parsed ${parsed.length} reviews from ${file.name}!`, '📄');
    if (window.cyberAudio) window.cyberAudio.buttonClick();
  };

  reader.onerror = () => {
    showToast('Failed to read CSV file.', '❌');
  };

  reader.readAsText(file);
}

async function handleConfirmImport() {
  if (!stagedImportReviews || stagedImportReviews.length === 0) {
    showToast('No staged reviews to import.', '⚠️');
    return;
  }

  const confirmBtn = document.getElementById('confirmImportBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = `Ingesting ${stagedImportReviews.length} Reviews...`;
  }

  try {
    const res = await window.SupabaseReviews.importReviews(stagedImportReviews);
    await loadData();
    closeImportModal();
    showToast(`Successfully imported ${res.count || stagedImportReviews.length} reviews!`, '✅');
    if (window.cyberAudio) window.cyberAudio.successChime();
  } catch (err) {
    console.error('Import error:', err);
    showToast(`Import error: ${err.message}`, '❌');
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = `⚡ Confirm & Ingest Reviews`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Sound toggle
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    const initial = localStorage.getItem('cyber_audio_muted') !== 'true';
    soundBtn.innerHTML = initial ? '🔊 Sound: ON' : '🔇 Sound: MUTED';
    soundBtn.addEventListener('click', () => {
      if (window.cyberAudio) {
        const state = window.cyberAudio.toggle();
        soundBtn.innerHTML = state ? '🔊 Sound: ON' : '🔇 Sound: MUTED';
        showToast(state ? 'Sound enabled' : 'Sound muted', state ? '🔊' : '🔇');
      }
    });
  }

  // Filter chips
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStarFilter = chip.getAttribute('data-star') || 'all';
      renderReviews();
    });
  });

  // Sort selector
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderReviews();
    });
  }

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderReviews();
    });
  }

  // Bind CSV download buttons
  const csvButtons = [
    document.getElementById('heroDownloadCsvBtn'),
    document.getElementById('toolbarExportBtn'),
    document.getElementById('exportBtn')
  ];
  csvButtons.forEach(btn => {
    if (btn) btn.addEventListener('click', downloadCSV);
  });

  // Bind Reset Data buttons
  const resetButtons = [
    document.getElementById('heroResetBtn'),
    document.getElementById('toolbarResetBtn'),
    document.getElementById('navResetDataBtn')
  ];
  resetButtons.forEach(btn => {
    if (btn) btn.addEventListener('click', openResetModal);
  });

  // Bind Import CSV buttons
  const importButtons = [
    document.getElementById('heroImportCsvBtn'),
    document.getElementById('toolbarImportBtn'),
    document.getElementById('navImportCsvBtn')
  ];
  importButtons.forEach(btn => {
    if (btn) btn.addEventListener('click', openImportModal);
  });

  // Reset Modal buttons
  const closeResetBtn = document.getElementById('closeResetModalBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');
  const toggleResetPwdBtn = document.getElementById('toggleResetPwdBtn');
  const resetPasswordInput = document.getElementById('resetPasswordInput');

  if (closeResetBtn) closeResetBtn.addEventListener('click', closeResetModal);
  if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeResetModal);
  if (confirmResetBtn) confirmResetBtn.addEventListener('click', handleResetData);

  if (resetPasswordInput) {
    resetPasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleResetData();
      else if (e.key === 'Escape') closeResetModal();
    });
  }

  if (toggleResetPwdBtn && resetPasswordInput) {
    toggleResetPwdBtn.addEventListener('click', () => {
      const isPwd = resetPasswordInput.type === 'password';
      resetPasswordInput.type = isPwd ? 'text' : 'password';
      toggleResetPwdBtn.textContent = isPwd ? '🙈' : '👁️';
    });
  }

  // Import Modal buttons & Drag-and-drop
  const closeImportBtn = document.getElementById('closeImportModalBtn');
  const cancelImportBtn = document.getElementById('cancelImportBtn');
  const confirmImportBtn = document.getElementById('confirmImportBtn');
  const browseCsvBtn = document.getElementById('browseCsvBtn');
  const csvFileInput = document.getElementById('csvFileInput');
  const csvDropzone = document.getElementById('csvDropzone');

  if (closeImportBtn) closeImportBtn.addEventListener('click', closeImportModal);
  if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImportModal);
  if (confirmImportBtn) confirmImportBtn.addEventListener('click', handleConfirmImport);

  if (browseCsvBtn && csvFileInput) {
    browseCsvBtn.addEventListener('click', () => csvFileInput.click());
  }

  if (csvDropzone && csvFileInput) {
    csvDropzone.addEventListener('click', (e) => {
      if (e.target !== browseCsvBtn) csvFileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      csvDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        csvDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      csvDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        csvDropzone.classList.remove('dragover');
      });
    });

    csvDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt ? dt.files : null;
      if (files && files.length > 0) {
        handleCSVFile(files[0]);
      }
    });
  }

  if (csvFileInput) {
    csvFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleCSVFile(e.target.files[0]);
      }
    });
  }

  // Close modals on overlay backdrop click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('cyber-modal-overlay')) {
      closeResetModal();
      closeImportModal();
    }
  });

  // Refresh button
  const refreshButtons = [
    document.getElementById('heroRefreshBtn'),
    document.getElementById('refreshBtn')
  ];
  refreshButtons.forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      loadData();
      showToast('Data refreshed', '🔄');
    });
  });

  // Initial load
  loadData();

  // Realtime subscription
  if (window.SupabaseReviews) {
    window.SupabaseReviews.subscribeToReviews((newRow) => {
      if (!reviews.some(r => r.id === newRow.id)) {
        reviews.unshift(newRow);
        const stats = window.SupabaseReviews.calculateStats(reviews);
        updateTelemetry(stats);
        renderReviews();
        if (window.cyberAudio) window.cyberAudio.successChime();
        showToast(`New review received from ${newRow.name} (${newRow.rating}★)!`, '🔔');
      }
    });
  }
});
