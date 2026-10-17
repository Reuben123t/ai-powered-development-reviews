/**
 * Supabase Client Integration for Dashboard
 * Event: "AI powered development"
 */

const SUPABASE_URL = "https://wdaoabaggskldgrprxga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYW9hYmFnZ3NrbGRncnByeGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDIxNzcsImV4cCI6MjEwNzQ3ODE3N30.t8I-zaP3CXjxM3MdPvlhKEjYjb4v40pVqbs2vuwhXkk";

const EVENT_NAME = "AI powered development";

let db = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  window.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
      db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  });
}

async function fetchReviews() {
  if (!db && window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!db) throw new Error("Supabase client is not initialized.");

  const { data, error } = await db
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }

  return data || [];
}

function calculateStats(reviewsList) {
  const reviews = Array.isArray(reviewsList) ? reviewsList : [];
  const total = reviews.length;

  if (total === 0) {
    return {
      average: "0.0",
      numericAverage: 0,
      total: 0,
      counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      positiveRate: 0
    };
  }

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let positiveCount = 0;

  reviews.forEach(r => {
    const score = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    counts[score] = (counts[score] || 0) + 1;
    sum += score;
    if (score >= 4) positiveCount++;
  });

  const numericAverage = sum / total;
  const average = numericAverage.toFixed(1);
  const positiveRate = Math.round((positiveCount / total) * 100);

  const percentages = {};
  for (let s = 1; s <= 5; s++) {
    percentages[s] = Math.round(((counts[s] || 0) / total) * 100);
  }

  return {
    average,
    numericAverage,
    total,
    counts,
    percentages,
    positiveRate
  };
}

function subscribeToReviews(onNewReview) {
  if (!db && window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!db) return null;

  try {
    const channel = db
      .channel('public:reviews:dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        (payload) => {
          if (typeof onNewReview === 'function') {
            onNewReview(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.warn("Realtime subscription warning:", err);
    return null;
  }
}

/**
 * Reset all reviews using Master Password (e.g. "Black1")
 * Calls the secure Supabase Postgres RPC function reset_reviews_data
 */
async function resetReviews(passCode) {
  if (!db && window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  
  if (db && typeof db.rpc === 'function') {
    const { data, error } = await db.rpc('reset_reviews_data', { pass_code: passCode });
    if (error) {
      console.error("RPC error resetting reviews:", error);
      throw error;
    }
    return data;
  }

  // REST Fallback
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reset_reviews_data`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pass_code: passCode })
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to reset: ${errText}`);
  }
  return await res.json();
}

/**
 * Batch import reviews into Supabase
 */
async function importReviews(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("No review records provided for import.");
  }

  const cleaned = records.map(r => ({
    event_name: r.event_name || EVENT_NAME,
    name: (r.name || 'Attendee').trim(),
    email: (r.email || '').trim(),
    rating: Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))),
    comment: (r.comment || '').trim() || 'Attended workshop.',
    created_at: r.created_at || new Date().toISOString()
  }));

  if (!db && window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  if (db) {
    const chunkSize = 50;
    let total = 0;
    for (let i = 0; i < cleaned.length; i += chunkSize) {
      const chunk = cleaned.slice(i, i + chunkSize);
      const { data, error } = await db.from('reviews').insert(chunk).select();
      if (error) throw error;
      total += (data ? data.length : chunk.length);
    }
    return { success: true, count: total };
  }

  // Direct REST Fallback
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(cleaned)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to import reviews: ${errText}`);
  }
  const data = await res.json();
  return { success: true, count: data.length };
}

window.SupabaseReviews = {
  fetchReviews,
  calculateStats,
  subscribeToReviews,
  resetReviews,
  importReviews,
  EVENT_NAME
};
