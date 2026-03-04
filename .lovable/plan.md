
# NobotCAPTCHA — Full SaaS Implementation Plan

## Phase 1: Landing Page & Core Widget

### Homepage (`/`)
- **Dark mode design**: `slate-950` background with indigo gradient accents
- **Hero section**: Title "比機器人更聰明，對人類更友善" with a live interactive widget demo
- **CAPTCHA Widget component** (300×74px):
  - Left: checkbox that triggers 1.5s spinner animation → green checkmark
  - Right: Nobot logo/branding
  - Mouse path tracking: captures mouse movements, analyzes for human-like curves vs. bot straight lines
  - Behavior analysis: checks movement count, reaction time, path linearity
- **Pricing section**: Large card "Community Plan - $0 Forever" with unlimited verifications & open-source support
- **Navigation bar** with links to Docs, Login, Signup

## Phase 2: Auth & Dashboard

### Lovable Cloud Setup
- **Database tables**:
  - `profiles` (id, user_id, display_name, avatar_url, created_at)
  - `user_roles` (id, user_id, role enum)
  - `sites` (id, user_id, domain, site_key, secret_key, created_at)
  - `verification_logs` (id, site_id, timestamp, is_human, score, ip_address)
- **Auth pages**: `/login` and `/signup` with email/password
- **Password reset flow** with `/reset-password` page

### Dashboard (`/dashboard`) — Protected route
- **Sidebar navigation**: Overview, Settings, API Keys
- **Overview page**: Recharts line chart showing last 7 days of "Human Verifications" vs "Bots Blocked" from real `verification_logs` data
- **API Keys page**: Display Site Key & Secret Key per registered domain, with one-click copy buttons
- **Settings page**: Manage registered domains, profile settings

## Phase 3: Developer Docs

### Docs Page (`/docs`)
- **Stripe-style dual-column layout**: text on left, code blocks on right
- **Syntax-highlighted code blocks** with copy buttons
- **Sections**:
  1. Installation — `<script>` tag embed
  2. Deployment — `<div class="nobot-captcha">` placement
  3. Server Verification — Node.js POST to `/api/siteverify` example
  4. Mouse Path Detection explanation

## Phase 4: Backend Edge Functions

### `siteverify` Edge Function
- Accepts `secret` and `token` in POST body
- Validates the secret against the `sites` table
- Decodes token and checks:
  - Token expiry (2-minute window)
  - Rate limiting: same IP high frequency → `{ success: false, score: 0.1 }`
  - Behavior score from the token payload
- Returns `{ success, challenge_ts, hostname, score }` on success
- Logs each verification attempt to `verification_logs` table for dashboard analytics

### Widget Token Generation (Client-side)
- On successful checkbox verification, generates a Base64 token containing siteKey, timestamp, score, and mouse behavior data
- Token is placed in a hidden form field for server-side validation
