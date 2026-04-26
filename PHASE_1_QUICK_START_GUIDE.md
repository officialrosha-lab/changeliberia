# Phase 1 Quick Wins - Developer Quick Start Guide

## 🚀 TL;DR (30 seconds)

**All Phase 1 components are created, tested, and ready to use.**

- ✅ Toast system: Global via `useToast()`
- ✅ Search bar: Integrated into home page
- ✅ Empty states: Ready to deploy
- ✅ Breadcrumbs: Ready to deploy
- ✅ Skeleton loaders: Ready to deploy
- ✅ Loading button: Ready to deploy

**View all components:** Visit `/components-showcase`

---

## 📦 What's Included

### 1. Toast Notifications (Global)
**Import:**
```tsx
import { useToast } from '@/lib/toast-context';
```

**Usage:**
```tsx
const { show } = useToast();
show('Success!', 'success'); // Types: 'success' | 'error' | 'warning' | 'info'
```

**Already integrated:** Yes ✅ (available everywhere)

---

### 2. Search Bar
**Import:**
```tsx
import { SearchBar } from '@/components/search-bar';
```

**Usage:**
```tsx
<SearchBar
  onSearch={(filters) => console.log(filters)}
  placeholder="Search..."
  showFilters={true}
/>
```

**Already integrated:** Home page discovery ✅

---

### 3. Empty States
**Import:**
```tsx
import {
  EmptyState,
  EmptyStatePetitions,
  EmptyStateUserPetitions,
  EmptyStateDashboard,
  EmptyStateSearch
} from '@/components/empty-state';
```

**Usage:**
```tsx
{results.length === 0 ? <EmptyStatePetitions /> : <Grid {...} />}
```

**Already integrated:** Home page (when no search results) ✅

---

### 4. Breadcrumb Navigation
**Import:**
```tsx
import { Breadcrumb } from '@/components/breadcrumb';
```

**Usage:**
```tsx
// Auto-detect from URL
<Breadcrumb />

// Or custom items
<Breadcrumb items={[
  { label: 'Home', href: '/' },
  { label: 'Page', current: true }
]} />
```

**Already integrated:** No (ready to add to detail pages)

---

### 5. Skeleton Loaders
**Import:**
```tsx
import { SkeletonLoader, SkeletonGrid } from '@/components/skeleton-loader';
```

**Usage:**
```tsx
{isLoading ? <SkeletonGrid count={6} /> : <ContentGrid />}
```

**Already integrated:** No (ready to add to data-fetching pages)

---

### 6. Loading Button
**Import:**
```tsx
import { LoadingButton } from '@/components/loading-button';
```

**Usage:**
```tsx
<LoadingButton
  isLoading={isSubmitting}
  onClick={handleSubmit}
  variant="primary"
  size="md"
>
  Submit
</LoadingButton>
```

**Already integrated:** No (ready to add to forms)

---

## 🎯 Integration Examples

### Example 1: Adding Search to a Page
```tsx
'use client';

import { SearchBar } from '@/components/search-bar';
import { useToast } from '@/lib/toast-context';

export function MyPage() {
  const { show } = useToast();

  return (
    <SearchBar
      onSearch={(filters) => {
        // Your search logic
        show('Searching...', 'info');
      }}
    />
  );
}
```

### Example 2: Form with Loading Button & Toast
```tsx
'use client';

import { LoadingButton } from '@/components/loading-button';
import { useToast } from '@/lib/toast-context';
import { useState } from 'react';

export function MyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { show } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ /* data */ })
      });

      if (res.ok) {
        show('Submitted successfully!', 'success');
      } else {
        show('Submission failed', 'error');
      }
    } catch (error) {
      show('An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <LoadingButton isLoading={isLoading} type="submit">
        Submit
      </LoadingButton>
    </form>
  );
}
```

### Example 3: Data Loading with Skeleton
```tsx
'use client';

import { useEffect, useState } from 'react';
import { SkeletonGrid } from '@/components/skeleton-loader';
import { EmptyStatePetitions } from '@/components/empty-state';

export function PetitionList() {
  const [petitions, setPetitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/petitions')
      .then(r => r.json())
      .then(data => {
        setPetitions(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <SkeletonGrid count={6} cols={3} />;
  }

  if (petitions.length === 0) {
    return <EmptyStatePetitions />;
  }

  return (
    <div className="grid gap-6">
      {petitions.map(p => (
        <PetitionCard key={p.id} petition={p} />
      ))}
    </div>
  );
}
```

### Example 4: Detail Page with Breadcrumb
```tsx
'use client';

import { Breadcrumb } from '@/components/breadcrumb';

export function PetitionDetail({ petition }: { petition: Petition }) {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Petitions', href: '/petitions' },
        { label: petition.title, current: true }
      ]} />

      {/* Page content */}
    </>
  );
}
```

---

## 🎨 Customization

### Toast Variants
```tsx
const { show } = useToast();

// Success (green)
show('Saved!', 'success');

// Error (red)
show('Failed to save', 'error');

// Warning (yellow)
show('Are you sure?', 'warning');

// Info (blue)
show('FYI: Something happened', 'info');
```

### Toast with Action Button
```tsx
show(
  'Connection lost',
  'error',
  5000,
  { label: 'Retry', onClick: () => reconnect() }
);
```

### Button Variants & Sizes
```tsx
// Variants: primary (emerald), secondary (gray), danger (red)
<LoadingButton variant="danger">Delete</LoadingButton>

// Sizes: sm, md, lg
<LoadingButton size="lg">Large Button</LoadingButton>

// Combined
<LoadingButton variant="danger" size="sm">
  Delete Item
</LoadingButton>
```

### Search Bar Customization
```tsx
<SearchBar
  placeholder="Find your cause..."
  categories={[
    { value: 'custom', label: 'Custom Category' }
  ]}
  locations={[
    { value: 'custom', label: 'Custom Location' }
  ]}
  showFilters={false} // Hide filters on mobile
/>
```

---

## 🧪 Testing Components

### Visit Component Showcase
Go to: **`/components-showcase`**

This page includes:
- All components with examples
- Interactive testing buttons
- Dark mode toggle
- Mobile responsiveness tester
- Toast notification triggers

### Manual Testing
1. Open home page - verify search bar displays
2. Type in search - verify results filter
3. Submit a form - verify loading button and toast
4. Slow down network (DevTools) - verify skeleton loaders

---

## 🐛 Common Issues & Solutions

### Issue: Toast not appearing
**Cause:** ToastProvider not in layout
**Solution:** Check `/app/layout-provider.tsx` has `<ToastProvider>` wrapper

### Issue: Search filters not working
**Cause:** Component not receiving new petitions
**Solution:** Check `onSearch` callback is being called

### Issue: Skeleton animation choppy
**Cause:** GPU acceleration disabled
**Solution:** Check browser hardware acceleration is enabled

### Issue: Focus indicators not visible
**Cause:** Browser doesn't support :focus-visible
**Solution:** Use `:focus` selector in older browsers

---

## 📚 File Reference

### Component Files
```
/apps/web/components/
  ├── toast-container.tsx        (Toast UI)
  ├── search-bar.tsx             (Search + Filters)
  ├── empty-state.tsx            (Empty state variants)
  ├── breadcrumb.tsx             (Breadcrumb nav)
  ├── skeleton-loader.tsx        (Loading skeletons)
  ├── loading-button.tsx         (Button with loading)
  └── home-discover-grid.tsx     (Home page - modified)
```

### Context/Utility Files
```
/apps/web/lib/
  └── toast-context.ts           (Toast state management)
```

### Documentation
```
/
  ├── PHASE_1_IMPLEMENTATION_COMPLETE.md   (Full details)
  ├── PHASE_1_COMPONENT_REFERENCE.md       (API reference)
  ├── PHASE_1_DEPLOYMENT_CHECKLIST.md      (Deployment guide)
  └── PHASE_1_QUICK_START_GUIDE.md         (This file)
```

### Testing
```
/apps/web/app/
  └── components-showcase/page.tsx        (Component demo)
```

---

## 🚀 Next Steps

### Immediate (Today)
1. ✅ Review components at `/components-showcase`
2. ✅ Test search functionality on home page
3. ✅ Try toast notifications
4. ✅ Verify dark mode works

### Short-term (Next 1-2 days)
1. Add breadcrumbs to petition detail pages
2. Add skeleton loaders to data-fetching pages
3. Replace form buttons with LoadingButton
4. Add more empty state variants

### Medium-term (Phase 2)
1. Add notification center
2. Implement user profiles
3. Add auto-save forms
4. Create analytics dashboard

---

## 💡 Pro Tips

1. **Always use `useToast()`** - It's better than alert()
2. **Show skeletons while loading** - Improves perceived performance
3. **Use breadcrumbs on detail pages** - Helps navigation
4. **Add loading button to forms** - Users know what's happening
5. **Test in dark mode** - All components support it

---

## 🎓 Learning Resources

### Component Library Pattern
These components follow React best practices:
- Functional components with hooks
- Context for global state
- Composition over configuration
- TypeScript strict typing
- Responsive design patterns

### Animation Library
- Framer Motion for smooth animations
- GPU-accelerated transforms
- Keyframes and spring physics

### Styling
- Tailwind CSS utility classes
- Dark mode via `dark:` prefix
- Mobile-first responsive design

---

## 📞 Support

**Questions about a component?**
1. Check `/PHASE_1_COMPONENT_REFERENCE.md`
2. Visit `/components-showcase` for examples
3. Read the component source code (well-commented)

**Having issues?**
1. Check browser console for errors
2. Verify imports are correct
3. Check component showcase works
4. Review example code above

---

## ✅ Verification Checklist

Before using components in production:

- [ ] Visit `/components-showcase`
- [ ] Test search bar on home page
- [ ] Trigger toast notification
- [ ] Check dark mode works
- [ ] Test on mobile device
- [ ] Verify keyboard navigation
- [ ] Check screen reader compatibility

---

**Ready to build amazing UX?** 🚀

Start with the examples above and customize as needed. All components are production-ready and thoroughly tested.

**Happy coding!** 💻
