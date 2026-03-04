# App Analysis & SEO Optimization Plan

## Overview
Comprehensive analysis of the DriverMind application followed by an SEO overhaul to improve visibility and indexing. The app currently lacks essential SEO primitives like sitemaps, robots.txt, and rich social metadata.

## Project Type
**WEB** (Next.js Application)

## Success Criteria
- [ ] `robots.txt` exists and is valid.
- [ ] `sitemap.xml` is generated automatically.
- [ ] Pages have full Open Graph and Twitter Card metadata.
- [ ] JSON-LD Structured Data (SoftwareApplication) is implemented.
- [ ] Lighthouse SEO score improves (target 90+).

## Tech Stack
-   **Next.js 14+**: Using the App Router metadata API.
-   **React**: For structured data components.

## Analysis Findings
1.  **Metadata**: Currently minimal (Title, Description, Manifest). Missing OG, Twitter, Keywords.
2.  **Indexing**: No `robots.txt` or `sitemap.xml`.
3.  **Semantic Structure**: `DriverMindApp.tsx` handles multiple "views" in a single page. This impacts SEO as content is dynamic.
    -   *Risk*: Single Page Apps (SPA) behind Auth are hard to index.
    -   *Mitigation*: Ensure the Landing Page (unauthenticated state) has rich SEO content.

## Task Breakdown

### Phase 1: Core SEO Primitives
#### [ ] Create `robots.ts`
-   **Agent**: Frontend Specialist
-   **Input**: `src/app/robots.ts`
-   **Output**: Dynamically generated robots.txt
-   **Verify**: Visit `/robots.txt`

#### [ ] Create `sitemap.ts`
-   **Agent**: Frontend Specialist
-   **Input**: `src/app/sitemap.ts`
-   **Output**: XML sitemap listing public routes (/, /login, /signup).
-   **Verify**: Visit `/sitemap.xml`

### Phase 2: Rich Metadata (Head)
#### [ ] Enhance `RootLayout` Metadata
-   **Agent**: Frontend Specialist
-   **Input**: `src/app/layout.tsx`
-   **Output**: Added `openGraph`, `twitter`, `keywords`, `authors`, `metadataBase`.
-   **Verify**: Use checking tool or inspect `<head>`.

### Phase 3: Structured Data & Semantics
#### [ ] Add JSON-LD Schema
-   **Agent**: Frontend Specialist
-   **Input**: `src/components/JsonLd.tsx` (New Component)
-   **Output**: `SoftwareApplication` schema injected into the Landing Page.
-   **Verify**: Google Rich Results Test.

#### [ ] Audit Landing Page Semantics
-   **Agent**: Frontend Specialist
-   **Input**: `src/components/LandingView.tsx` (or AuthView)
-   **Output**: Ensure `<h1>`, `<section>`, and `alt` tags are optimal.

## Phase X: Verification
- [ ] Run `npm run build` to ensure type safety.
- [ ] Run Lighthouse Audit on the Landing Page.
