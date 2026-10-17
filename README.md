# ⬡ Nexus Reviews · AI Powered Development

Dual-portal architecture for the **AI Powered Development** showcase at [VJCET Website Showcase](https://vjcet-presentation-website.vercel.app/).

---

## 🌐 Live Deployed Applications

| Portal | Live URL | Purpose | Access |
| :--- | :--- | :--- | :--- |
| **Public Review Portal** | **[https://ai-powered-development-reviews.vercel.app/review](https://ai-powered-development-reviews.vercel.app/review)** | Attendees submit private ratings & opinions | Public (No other reviews exposed) |
| **Organizer Telemetry Dashboard** | **[https://ai-reviews-dashboard.vercel.app](https://ai-reviews-dashboard.vercel.app)** | View all incoming attendee reviews, average ratings & export CSV | Organizer / Presenter (**No authentication required**) |
| **Main Presentation Site** | **[https://vjcet-presentation-website.vercel.app/](https://vjcet-presentation-website.vercel.app/)** | Main VJCET showcase website | Public |

---

## 🔒 Privacy Architecture

1. **Website 1 (Public Submission Portal):**
   - Attendees provide: **Full Name**, **Email Address**, **Rating Bar (1 to 5 stars)**, and **Experience Comment Box**.
   - Review submissions are transmitted directly to the database.
   - **No public reviews or comments are exposed** on this website to maintain attendee privacy.
   - Upon submission, attendees receive a secure transmission confirmation.

2. **Website 2 (Organizer Telemetry Dashboard):**
   - Built specifically for the event organizer and review panel.
   - **Zero Authentication Required:** Open direct URL for viewing on phones, laptops, or presentation screens.
   - **Live Telemetry:**
     - SVG radial progress gauge of the **Average Rating** (out of 5.0).
     - 5-Star to 1-Star distribution breakdown bars with animated percentages and exact counts.
     - Total attendee ratings counter and positive satisfaction rate.
   - **Attendee Opinions Grid:**
     - Displays reviewer avatar, attendee name, attendee email, star rating, exact comment, and timestamp.
   - **Live Search & Star Filters:** Real-time search across comments, names, or emails, and star rating filters.
   - **CSV Export:** One-click download of all attendee feedback to `.csv` format.
   - **Supabase Realtime Sync:** As attendees submit reviews on Website 1, Website 2 updates automatically without page refreshes.

---

## 🛠️ Deploying from Terminal

### Deploy Public Portal:
```bash
# In project root: c:\Users\andre\Desktop\Review
npx vercel --prod --yes
```

### Deploy Dashboard:
```bash
# In dashboard directory: c:\Users\andre\Desktop\Review\dashboard
npx vercel --prod --yes
```
