# Complete Testing & Verification Checklist

## 🧪 Phase 1 UI/UX Components Testing

### ✅ Toast Notifications
- [ ] Visit any page and check toast appears in bottom-right
- [ ] Verify success toast is green
- [ ] Verify error toast is red  
- [ ] Verify warning toast is yellow
- [ ] Verify info toast is blue
- [ ] Auto-dismiss after 3 seconds
- [ ] Manual dismiss button works
- [ ] Dark mode colors correct
- [ ] Mobile: Toast full-width at bottom
- [ ] Desktop: Toast fixed corner

**Test command:** Trigger toasts via `/components-showcase`

---

### ✅ Search Bar + Filters
- [ ] Home page has search bar visible
- [ ] Can type in search input
- [ ] Press Enter triggers search
- [ ] Click Search button works
- [ ] Filter icon opens advanced filters
- [ ] Category filter works
- [ ] Status filter works
- [ ] County filter works
- [ ] Sort dropdown changes results
- [ ] Clear filters button clears all
- [ ] Mobile: Search full-width
- [ ] Mobile: Filters collapse to drawer

**Test command:** Go to home page `http://localhost:3000/`

---

### ✅ Empty States
- [ ] No search results shows empty state
- [ ] Empty state has title + description
- [ ] CTA button navigates correctly
- [ ] Different empty states for different pages
- [ ] Dark mode styling correct
- [ ] Mobile layout responsive

**Test command:** Search for something that returns no results

---

### ✅ Breadcrumb Navigation
- [ ] Breadcrumbs show on detail pages
- [ ] Auto-generate from URL pathname
- [ ] Clickable breadcrumbs navigate
- [ ] Current page is not clickable
- [ ] Breadcrumb doesn't show on home page
- [ ] Keyboard navigation works (Tab)
- [ ] Focus indicators visible

**Test command:** Navigate to petition detail page

---

### ✅ Skeleton Loaders
- [ ] Skeleton shows while data loading
- [ ] Pulse animation runs smoothly
- [ ] Skeleton matches content height
- [ ] Multiple skeletons work
- [ ] Grid variant displays correctly
- [ ] Mobile layout responsive

**Test command:** Slow down network in DevTools, load page

---

### ✅ Loading Button
- [ ] Button shows normal state by default
- [ ] Clicking button triggers loading
- [ ] Spinner appears while loading
- [ ] Button is disabled while loading
- [ ] Loading text displays
- [ ] Different variants render correctly
- [ ] Different sizes render correctly
- [ ] Mobile display responsive

**Test command:** Go to `/components-showcase`, click "Test Loading State"

---

### ✅ Bottom Navigation Polish
- [ ] Bottom nav reduced from 64px to 48px height
- [ ] Focus indicators visible on nav items
- [ ] Touch targets still >= 44x44 pixels
- [ ] Mobile layout not cramped
- [ ] Content padding adjusted (pb-16 instead of pb-20)
- [ ] Create button still centered with icon

**Test command:** Open `/components-showcase` on mobile device

---

## 🔔 Phase 2 Notification System Testing

### ✅ API Endpoints

#### GET /api/v1/notifications
- [ ] Returns user's notifications
- [ ] Pagination works (limit/offset)
- [ ] Filter by status (UNREAD/READ/ARCHIVED)
- [ ] Filter by type
- [ ] Returns unread count
- [ ] Requires authentication (JWT)
- [ ] Returns 401 if not authenticated

**Test command:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/notifications?limit=10
```

---

#### GET /api/v1/notifications/unread-count
- [ ] Returns unread count
- [ ] Count decreases when marked as read
- [ ] Returns 0 when all read
- [ ] Updates correctly

**Test command:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/notifications/unread-count
```

---

#### PATCH /api/v1/notifications/:id/read
- [ ] Marks notification as read
- [ ] Returns updated notification
- [ ] Status changes to READ
- [ ] readAt timestamp set

**Test command:**
```bash
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/notifications/NOTIFICATION_ID/read
```

---

#### POST /api/v1/notifications/mark-all-read
- [ ] Marks all unread as read
- [ ] Returns count of updated
- [ ] Works with 0 unread

**Test command:**
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/notifications/mark-all-read
```

---

#### PATCH /api/v1/notifications/:id/archive
- [ ] Archives notification
- [ ] Status changes to ARCHIVED

---

#### DELETE /api/v1/notifications/:id
- [ ] Deletes notification
- [ ] Returns success

---

#### GET /api/v1/notifications/preferences
- [ ] Returns user's preferences
- [ ] Returns defaults if not set
- [ ] parsedTypes field

---

#### POST /api/v1/notifications/preferences
- [ ] Updates preferences
- [ ] Can toggle email enabled
- [ ] Can toggle push enabled
- [ ] Can set digest frequency
- [ ] Can mute notification types

---

### ✅ Frontend Components

#### NotificationDropdown
- [ ] Bell icon visible in header (when logged in)
- [ ] Unread badge shows count
- [ ] Badge shows "99+" for 99+
- [ ] Clicking bell opens dropdown
- [ ] Dropdown shows last 10 notifications
- [ ] Clicking outside closes dropdown
- [ ] "Mark all as read" button works
- [ ] "View all notifications" link works
- [ ] Loading state shows spinner
- [ ] Empty state shows "No notifications"
- [ ] Dark mode colors correct
- [ ] Mobile: Dropdown positioned correctly

**Test command:** Log in and check header

---

#### Notifications Page (/notifications)
- [ ] Page loads with breadcrumb
- [ ] Shows list of notifications
- [ ] Filter buttons (All, Unread, Read, Archived)
- [ ] Filter changes results
- [ ] Pagination shows/hides appropriately
- [ ] Previous/Next buttons work
- [ ] Each notification shows:
  - Icon (✓, 🎉, ⚠️, 💝, etc.)
  - Title
  - Message
  - Date
  - Action buttons
- [ ] Mark as read button works
- [ ] Archive button works
- [ ] Dark mode styling
- [ ] Mobile responsive

**Test command:** Go to `/notifications` (logged in)

---

#### NotificationItem
- [ ] Shows notification data
- [ ] Icon color matches type
- [ ] Title displayed (truncated if long)
- [ ] Message displayed (max 2 lines)
- [ ] Date/time shown
- [ ] Unread notifications highlighted
- [ ] Mark as read button clickable
- [ ] Archive button clickable
- [ ] Animation on mount/exit

---

### ✅ Database

#### Notifications Table
- [ ] Notifications can be created
- [ ] Queries work with indexes
- [ ] Timestamps correct (createdAt, readAt)
- [ ] Status field stores correctly
- [ ] Metadata JSON parsed correctly

**Test command:**
```bash
# In database
SELECT COUNT(*) FROM "Notification" WHERE status = 'UNREAD';
```

---

#### NotificationPreference Table
- [ ] Preferences can be created
- [ ] Preferences can be updated
- [ ] Unique constraint on userId works
- [ ] JSON fields parse correctly

---

## 📱 Responsive Design Testing

### Mobile (iPhone SE, 375px)
- [ ] All text readable
- [ ] Touch targets >= 44x44px
- [ ] No horizontal scroll
- [ ] Bottom nav height appropriate
- [ ] Dropdown menus accessible
- [ ] Inputs usable with mobile keyboard

### Tablet (iPad, 768px)
- [ ] Layout adjusts properly
- [ ] Navigation works
- [ ] All features functional

### Desktop (1024px+)
- [ ] Full feature set visible
- [ ] Spacing appropriate
- [ ] No unnecessary scrolling

---

## 🌙 Dark Mode Testing

- [ ] All components have dark mode colors
- [ ] Toast colors correct in dark mode
- [ ] Notification dropdown readable in dark mode
- [ ] Text contrast sufficient (WCAG AA)
- [ ] Icons visible in dark mode

**Test command:** Toggle dark mode (theme button top-right)

---

## ♿ Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Enter/Space activates buttons
- [ ] Escape closes dropdowns
- [ ] Dropdown items navigable with arrow keys

### Screen Reader
- [ ] All buttons have aria-labels
- [ ] Notification count announced
- [ ] Status changes announced
- [ ] Form labels associated correctly
- [ ] Icons have alt text or aria-label

### Color Contrast
- [ ] Text on background WCAG AA (4.5:1)
- [ ] Focus indicators visible (3:1)
- [ ] Error messages distinguish by shape/text, not just color

---

## 🚀 Performance Testing

### Bundle Size
- [ ] New components < 20KB gzipped total
- [ ] Images optimized
- [ ] No console warnings

**Test command:**
```bash
npm run build --filter=web
# Check size in .next/static
```

### Runtime Performance
- [ ] Notifications load in < 500ms
- [ ] Dropdown opens without lag
- [ ] Animations smooth at 60 FPS
- [ ] No memory leaks on repeated actions

**Test command:** Chrome DevTools > Performance > Record

---

## 🧹 Build & Lint Testing

### TypeScript
```bash
cd apps/web
npm run typecheck
# Should have 0 errors
```

### ESLint
```bash
npm run lint
# Should have 0 errors in new files
```

### Build
```bash
npm run build
# Should complete without errors
```

---

## 📋 Manual Testing Scenarios

### Scenario 1: User Receives Notification
1. User A signs a User B's petition
2. User B receives signature notification
3. Badge updates
4. Notification appears in dropdown

**Expected:** Notification visible immediately

---

### Scenario 2: User Archives Notification
1. Open notification dropdown
2. Click archive icon on notification
3. Notification disappears
4. Count stays same

**Expected:** Notification archived, no longer in list

---

### Scenario 3: User Marks All as Read
1. Have multiple unread notifications
2. Click "Mark all as read"
3. All notifications marked READ
4. Badge count goes to 0
5. Toast shows success message

**Expected:** All notifications read, badge cleared

---

### Scenario 4: User Changes Preferences
1. Go to notifications page
2. Scroll to preferences (if visible)
3. Toggle email notifications off
4. Save preferences
5. Verify they're saved on reload

**Expected:** Preferences persist

---

## ✅ Final Verification

- [ ] All Phase 1 components tested and working
- [ ] All Phase 2 notification endpoints tested
- [ ] All UI responsive on mobile/tablet/desktop
- [ ] Dark mode working everywhere
- [ ] Accessibility audit passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Builds successfully
- [ ] All tests passing
- [ ] Documentation complete

---

## 🐛 Known Issues & Workarounds

(To be filled in during testing)

| Issue | Severity | Workaround | Status |
|-------|----------|-----------|--------|
|       |          |           |        |

---

## 📊 Test Results Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Toast System | ✅ | Ready |
| Search Bar | ✅ | Ready |
| Empty States | ✅ | Ready |
| Breadcrumbs | ✅ | Ready |
| Skeleton Loaders | ✅ | Ready |
| Loading Button | ✅ | Ready |
| Bottom Nav Polish | ✅ | Ready |
| Notification API | ✅ | Ready |
| Notification UI | ✅ | Ready |
| Preferences | ⏳ | Ready for testing |

---

**Testing Date:** [INSERT DATE]  
**Tested By:** [INSERT NAME]  
**Browser:** [INSERT BROWSER/VERSION]  
**OS:** [INSERT OS]

---

**Sign-off Status:** ⏳ PENDING TESTING
