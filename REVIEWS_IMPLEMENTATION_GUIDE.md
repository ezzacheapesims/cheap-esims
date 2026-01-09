# Reviews System Implementation Guide for Voyage

This guide contains all the files and instructions needed to implement the reviews system we built today.

## Overview

The reviews system includes:
- Real-time review submission from `/reviews` page and My eSIMs page
- Dynamic review count (real + mock reviews)
- "Trusted Worldwide" section showing latest medium/long reviews with diverse usernames
- Verified purchase labels (only for reviews from purchased plans)
- HTML entity decoding for proper text display
- Mock review generation with realistic distribution

---

## Files to Copy

### Backend Files

1. **`apps/backend/src/modules/reviews/reviews.controller.ts`**
   - Handles review creation, fetching, and stats
   - Includes `/reviews/count` endpoint for dynamic counts
   - Allows anonymous reviews

2. **`apps/backend/src/modules/reviews/reviews.service.ts`**
   - Core review business logic
   - Verified purchase checking (only if planId provided AND user purchased)
   - Removes verified from 40% of reviews without planId
   - Error handling and logging

3. **`apps/backend/src/modules/reviews/reviews.module.ts`**
   - NestJS module configuration

4. **`apps/backend/src/common/utils/sanitize.ts`**
   - Updated to NOT escape apostrophes (for better readability)
   - Still sanitizes other HTML entities

### Frontend Files

1. **`apps/web/app/reviews/page.tsx`**
   - Main reviews page with filters, pagination
   - Write review dialog
   - Merges real + mock reviews
   - Real-time updates every 30 seconds

2. **`apps/web/components/PlanTrustReviews.tsx`**
   - "Trusted Worldwide" section for plan detail pages
   - Shows only medium/long reviews
   - Randomized selection for diverse usernames
   - Updates every 30 seconds

3. **`apps/web/lib/mock-reviews.ts`**
   - Mock review generation with realistic distribution
   - 75% star-only, 15% short, 5% medium, 5% long
   - Diverse usernames (50% fake names, 30% usernames, 20% generic)
   - Only 40% verified
   - Multilingual support
   - `isMediumOrLongReview()` helper function

4. **`apps/web/lib/utils.ts`**
   - Added `decodeHtmlEntities()` function to decode HTML entities in review text

5. **`apps/web/app/my-esims/page.tsx`**
   - Added "Review" button for each eSIM plan
   - Review modal that passes planId for verified purchase

6. **`apps/web/components/HomeReviewsSection.tsx`**
   - Updated to use "Anonymous" instead of "Verified Customer"

### Database Schema

The `Review` model should already exist in your Prisma schema. Verify it has:
- `id`, `planId?`, `userId?`, `userName?`, `rating`, `comment?`, `language?`, `source?`, `verified`, `createdAt`

---

## Implementation Steps

### Step 1: Backend Setup

1. Copy the backend files to your Voyage project
2. Ensure the `Review` model exists in your Prisma schema
3. Make sure `sanitize.ts` is updated (no apostrophe escaping)
4. Register the `ReviewsModule` in your main `app.module.ts`

### Step 2: Frontend Setup

1. Copy all frontend files
2. Install any missing dependencies (check imports)
3. Ensure routes are public (add `/reviews(.*)` to public routes in middleware if needed)

### Step 3: My eSIMs Integration

1. Add the review button and modal to your My eSIMs page
2. Ensure the review modal passes `planId` when submitting

### Step 4: Plan Detail Pages

1. Add `<PlanTrustReviews planId={plan.id} />` to your plan detail pages
2. Place it after the plan specs, before the "Complete Order" button

---

## Key Features Explained

### Verified Purchase Logic

- **From `/reviews` page**: No `planId` → Never verified
- **From My eSIMs page**: Has `planId` → Checked if user purchased that plan → Verified if purchased
- **Backend**: Removes verified from 40% of reviews without `planId` (deterministic)

### Review Distribution

- **75%**: Star-only (no text)
- **15%**: Short text (5-12 words)
- **5%**: Medium text (50-150 chars)
- **5%**: Long text (150+ chars)
- **~7%**: Low ratings (1-2 stars)

### Dynamic Count

- Real reviews count from database
- Mock reviews: base 3242
- Total = Real + Mock
- Updates in real-time

### Trusted Worldwide Section

- Shows only medium/long reviews (50+ characters)
- Sorted by latest date
- Randomized selection from top 20 for diverse usernames
- Updates every 30 seconds
- Prioritizes real reviews

---

## API Endpoints

- `POST /api/reviews` - Create review (requires `x-user-email` header, optional)
- `GET /api/reviews/all` - Get all reviews
- `GET /api/reviews/count` - Get total review count
- `GET /api/reviews/plan/:planId` - Get reviews for specific plan
- `GET /api/reviews/stats` - Get review statistics

---

## Environment Variables

No new environment variables needed. Uses existing `NEXT_PUBLIC_API_URL`.

---

## Testing Checklist

- [ ] Submit review from `/reviews` page (should NOT have verified badge)
- [ ] Submit review from My eSIMs page (should HAVE verified badge if user purchased)
- [ ] Check that review count updates dynamically
- [ ] Verify "Trusted Worldwide" shows different names on refresh
- [ ] Check that HTML entities are decoded properly (apostrophes show correctly)
- [ ] Verify only 40% of reviews show verified badge
- [ ] Test with filters on reviews page

---

## Important Notes

1. **Mock reviews are deterministic** - They generate the same reviews each time, but selection is randomized
2. **Real reviews take priority** - Always shown first in merged lists
3. **Verified logic is strict** - Only verified if planId provided AND user purchased
4. **HTML entities** - Apostrophes are NOT escaped, but other entities are (and decoded on frontend)

---

## Troubleshooting

**Reviews not showing verified badge from My eSIMs:**
- Check backend logs for verification check
- Ensure `planId` is being passed in request body
- Verify user has a paid order for that planId

**Same names appearing:**
- The randomization should fix this, but if it persists, check that the shuffle is working

**HTML entities showing:**
- Ensure `decodeHtmlEntities()` is being called when displaying review text
- Check that `sanitize.ts` doesn't escape apostrophes

---

## Files Summary

**Backend (4 files):**
- `reviews.controller.ts`
- `reviews.service.ts`
- `reviews.module.ts`
- `common/utils/sanitize.ts` (update existing)

**Frontend (6 files):**
- `app/reviews/page.tsx`
- `components/PlanTrustReviews.tsx`
- `lib/mock-reviews.ts`
- `lib/utils.ts` (add function to existing)
- `app/my-esims/page.tsx` (add review button/modal)
- `components/HomeReviewsSection.tsx` (update existing)

**Total: 10 files to copy/update**


