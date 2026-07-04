# 🛠️ TraceSpark v2 — Feature & Design Overhaul Brief

**Context for Antigravity:** This is v2 of TraceSpark, an AI civic grievance mapping platform (React/Vite + Leaflet frontend, Node/Express + Supabase backend, Groq Llama Vision for photo validation). v1 is functional but needs a design overhaul and several new features before hackathon judging. Below is the full spec — treat this as the source of truth for what to build.

---

## 1. New Feature: Floating AI Chatbot Widget

Replace the current embedded "AI Grievance Assistant" chat panel (the one sitting inline on the dashboard) with a **standard floating chat bubble**, like Intercom/Crisp-style widgets.

**Requirements:**
- Circular floating button, bottom-right corner, persistent across all pages (not just dashboard).
- On click, expands into a chat panel (bottom-right anchored, ~380px wide, slides/fades in — don't just hard-cut).
- Unread/idle state: small pulse or subtle bounce animation on the icon to draw attention without being annoying.
- On first open, show 3–4 tappable **"Try asking..."** suggestion chips above the input, e.g.:
  - "There's a pothole near my house"
  - "How do I check my report status?"
  - "What happens after 25 votes?"
  - "Report an open drain"
- Suggestion chips disappear after first message is sent (don't clutter an ongoing convo).
- Keep the Llama 3 text model backend as-is — this is a frontend/UX restructure, not a backend change.
- Remove the old inline chat card from the dashboard entirely once this is live.

---

## 2. New Feature: Councillor / Admin Portal

A separate login flow and view for ward councillors (not citizens).

**Auth:**
- Councillor accounts are pre-provisioned by us (not self-signup) using the phone number already mapped to each ward.
- Simple phone-number + password login (no OTP for now — keep it fast for demo purposes).
- Add a `role` field to distinguish citizen vs councillor at the `users` table level, or a separate `councillors` table:
```sql
CREATE TABLE councillors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    ward TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**Councillor Dashboard should show:**
- List of all escalated reports for their ward only, sorted by priority/age.
- Each report card: category, photo, severity score, votes, days-since-escalation.
- A **"Mark Resolved"** action per report that requires uploading an after/proof photo.
- Ward-level stats at the top: total escalated, resolved, pending, avg resolution time.

---

## 3. New Feature: Resolution Loop with Photo Proof

This closes the loop from "complaint sent" to "complaint fixed" — currently the system stops at the WhatsApp dispatch.

**Backend changes:**
- Add to `reports` table:
```sql
ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reports ADD COLUMN resolution_photo_url TEXT;
ALTER TABLE reports ADD COLUMN resolved_by UUID REFERENCES councillors(id);
```
- `status` enum extends to include `'resolved'`.
- New endpoint: `POST /reports/:id/resolve` (councillor-only) — accepts a photo upload, sets status to resolved, timestamps it.

**Frontend/map changes:**
- Resolved reports on the citizen-facing map switch to a **distinct color (e.g. green) and a checkmark icon** instead of being removed — this is important for the transparency angle (see Feature 6). Don't delete resolved pins from the map; showing "this got fixed" is a trust-building feature, not clutter.
- Citizen's "My Submissions" panel shows resolved reports with a before/after photo comparison (nice visual for the demo).

---

## 4. Feature: Severity-Weighted Priority Formula

Replace the current flat vote-count escalation trigger with a weighted score.

**New formula:**
```
priority_score = (vote_count × 1) + (ai_severity × severity_multiplier)
```
Where `severity_multiplier` is tunable (start with `3`). This means a single report with `ai_severity = 9` (e.g. exposed live wire, deep open manhole) can escalate faster than a low-severity report that needs the full 25 votes.

**Escalation logic:**
- Keep 25 as the escalation threshold, but it's now against the *weighted* score, not raw votes.
- Update backend trigger logic in the voting endpoint to recompute weighted score on every new vote and check against threshold.
- Surface this on the report card UI: show a small breakdown like `Priority: 18/25 (12 votes + severity boost)` so judges can see the mechanic working live, not just a black-boxed number.

---

## 5. Feature: Duplicate / Cluster Detection

When multiple citizens report the same real-world issue (e.g. same pothole from different pins nearby), currently votes/reports split and dilute priority.

**Logic:**
- On new report submission, check for existing **unresolved** reports of the same `category` within a small radius (start with ~30 meters, using lat/lng haversine distance) created within the last N days (e.g. 14).
- If a match is found: instead of creating a new independent report, prompt the citizen — *"Looks like this was already reported nearby. Add your vote to the existing report instead?"* — and if confirmed, register their vote on the existing report rather than creating a duplicate.
- Add a `cluster_id` or `duplicate_of` column to `reports` for tracking merged reports (optional, for internal analytics: "this issue was independently reported 4 times before resolution").

**UI:**
- On the map, don't show 4 overlapping pins for the same pothole — show one pin with a small badge indicating "(4 reports merged)".

---

## 6. Feature: SLA Countdown / Aging Indicator

Once a report escalates, track and surface how long it's been outstanding.

**Backend:**
- Use existing `created_at` and new `resolved_at` to compute age. No new schema needed beyond what's already added.

**Frontend:**
- On escalated reports (both citizen map view and councillor dashboard), show: *"Escalated 3 days ago"* with a color shift as it ages (green → yellow → red past some threshold, e.g. 7 days).
- Ward-level average resolution time shown as a stat on both the councillor dashboard and the transparency page (Feature 7).

---

## 7. Feature: Public Transparency Page

A public, no-login-required page per ward (or city-wide) showing aggregate accountability stats.

**Should show:**
- Total reports filed, resolved, pending (count + %).
- Average resolution time.
- A simple bar or donut chart by category (roads / drains / garbage / etc.).
- Optionally: a leaderboard-style "fastest responding wards" — but keep it constructive, not shaming, since we're not doing a full public leaderboard system elsewhere.
- No auth required — this page exists to build public trust and is a strong demo moment ("here's proof this isn't vaporware — anyone can check accountability").

---

## 8. Design & Layout Overhaul

Current design is a fairly generic SaaS-dashboard look (white cards, orange/red gradients, rounded stat tiles everywhere). Push it toward something with more "control room / civic urgency" character while **keeping the dashboard-first layout** (not map-first — confirmed this stays).

**Direction:**
- Keep dashboard as the landing view, but reduce visual noise: fewer competing gradient cards at once, tighten the stat-tile row into a cleaner strip.
- Introduce a more confident color system: reserve red/orange strictly for urgent/unresolved states, introduce a calmer primary (deep blue, teal, or ink-navy) for structural UI (nav, headers, containers) so red doesn't fight for attention everywhere.
- Map pins: differentiate by **category icon** (road, water, garbage, drainage, etc.) rather than uniform colored circles, and scale pin size by severity so the map is legible from a glance, not just decorative.
- Report submission modal: after photo upload, show the **AI's verdict inline before final submit** — e.g. a small result card: "✅ AI Detected: Pothole — Severity 7/10 — looks civic, ready to submit." This makes the AI validation step visible and demoable instead of a black box behind the submit button.
- Empty states (chat panel, "no reports yet" etc.) should never just be blank — always show a light illustration/placeholder or a clear next action.
- Ensure typography hierarchy is consistent: right now header sizes/weights are inconsistent across dashboard vs map vs modal. Standardize heading, subheading, and label styles across all views (dashboard, map, admin portal, transparency page, chatbot) so v2 reads as one coherent product, not five components stitched together (relevant since the team split work by component).

---

## Priority Order for Build (given hackathon time constraints)

1. Severity-weighted priority formula (backend logic change, high impact, low effort)
2. Resolution loop + photo proof (core to the "loop closes" narrative)
3. Councillor/admin portal (needed to demo #2)
4. Floating AI chatbot widget redesign
5. Design/visual overhaul pass across existing pages
6. Public transparency page
7. Duplicate/cluster detection
8. SLA countdown indicator

Items 1–4 are the highest-leverage for judging impact; 5 is what makes the demo look cohesive; 6–8 are strong differentiators if time allows.

---

## Explicitly Out of Scope for This Pass
- Multi-language support
- OTP-based phone verification
- Map-first landing page (dashboard-first stays)
