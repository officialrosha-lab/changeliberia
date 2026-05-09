# Phase 2-4 CMS Features - Quick Start Guide

**Version**: 1.0  
**Status**: ✅ Production Ready  
**Last Updated**: Active Development Session

---

## 🚀 Getting Started

### 1. Access the CMS

Navigate to: `http://localhost:3000/cms`

You'll see the Content Management System dashboard with two tabs:
- **Pages** - Manage all CMS pages
- **Templates** - (Placeholder for future template system)

### 2. Create Your First Page

1. Click **"+ Create New Page"**
2. Enter a title (e.g., "About Us")
3. Slug auto-generates (e.g., "about-us")
4. Click **"Create Page"**

Page is created in **Draft** mode by default.

---

## ✏️ Editing Pages (Phase 2-4 Features)

### Access Page Editor

1. On CMS dashboard, click **"Edit"** next to any page
2. Editor opens at `/cms/editor/[pageId]`

### Editor Layout

```
┌─ Page Header (Title, Draft/Ready status)
├─ Draft/Publish Controls
│  ├─ Mark as Ready / Back to Draft (toggle)
│  ├─ Publish Now (if draft)
│  └─ Version History (button)
├─ Page Blocks Section
│  └─ (Block editor with drag-drop, add, edit, delete)
├─ Basic Info (Title, Slug)
├─ SEO Metadata (Meta Description, Keywords, OG tags)
└─ Save Button
```

### Key Status Indicators

- **Draft Badge**: Page is in draft mode (not visible to public)
- **Ready Badge**: Page is ready but not yet published
- **Published Badge**: Page is live on website

---

## 📝 Block Management (Phase 2)

### Adding Blocks

1. In "Page Blocks" section, click **"+ Add Block"**
2. Select block type:
   - **Hero** - Large banner with title, subtitle, image, CTA
   - **Text** - Body text with heading option
   - **Image** - Full-width or constrained image
   - **CTA** - Call-to-action button with description
   - **Testimonial** - Quote + author attribution
   - **FAQ** - Collapsible Q&A section
   - **Grid** - Multi-column content grid
   - **Features** - Feature list with icons
   - **Divider** - Visual separator

### Editing Block Properties

1. Click the block or **"Edit"** button
2. Properties panel opens with type-specific fields
3. **Rich Text Fields** (title, description, etc.):
   - Click to open markdown editor
   - Use toolbar for formatting (H1, H2, **bold**, *italic*, links, lists)
   - Toggle preview to see rendered output
   - Click outside or "Done" to save

4. **Image Fields**:
   - Click **"Upload"** button next to image URL field
   - Modal opens with upload interface
   - Drag & drop files or click to browse
   - File size limit: 5MB
   - Accepted types: JPEG, PNG, WebP, GIF
   - Uploaded images appear in gallery
   - Click thumbnail to select

5. **Array Fields** (FAQ items, Grid items, Features):
   - Click **"+ Add Item"** to add row
   - Edit inline or click to open editor
   - Click **"✕"** to remove item
   - Drag to reorder (coming soon)

### Duplicating Blocks

1. Right-click block or click **"..."** menu
2. Select **"Duplicate"**
3. Block clones with same properties
4. Edit clone separately

### Deleting Blocks

1. Click **"..."** menu or right-click
2. Select **"Delete"**
3. Confirm deletion

---

## 💾 Saving Your Work (Phase 3)

### Auto-Save Status

Look at the top right of editor:
- **Saving...** - Changes being saved
- **✓ Saved** - All changes saved successfully
- **✗ Error** - Save failed (check internet connection)

### Manual Save

Click **"Save Page"** button at bottom of editor to force save.

---

## 📋 Draft & Publishing Workflow (Phase 3)

### Draft Mode

All new pages start in **Draft** mode. In draft:
- Not visible to public
- Only admins can see
- Safe place to edit and preview

### Ready for Review

1. Finish editing blocks and content
2. Click **"Mark as Ready"** button
3. Page status changes to **Ready** (amber badge)
4. Indicates: "Ready for publishing but not yet published"

### Publish Page

1. With page in **Ready** state, click **"Publish Now"**
2. Page goes live immediately
3. Status changes to **Published** (blue badge)
4. Page now visible to public at URL: `/pages/[slug]`

### Unpublish Page

1. Once published, **"Publish Now"** changes to **"Unpublish"**
2. Click to unpublish
3. Page goes back to **Ready** state
4. Still not visible to public

### Back to Draft

1. Click **"Back to Draft"** button anytime
2. Resets to draft mode for additional edits
3. Changes since draft creation are preserved

---

## ⏰ Schedule Content (Phase 3)

### Schedule a Publish Action

1. Click **"Schedule"** button (in Draft/Publish controls)
2. Modal opens with fields:
   - **Action**: Choose "Publish", "Unpublish", or "Update"
   - **Scheduled For**: Pick date & time
3. Click **"Schedule Action"**
4. Action queued for future execution
5. View pending schedules in "Schedules" section

### Cancel Scheduled Action

1. In "Schedules" section below version history
2. Find scheduled action
3. Click **"Cancel"** button
4. Action removed from queue

---

## 📜 Version History (Phase 3)

### View Page Versions

1. Click **"Version History"** button
2. Panel expands showing all saved versions
3. Each version shows:
   - Timestamp (when created)
   - Creator (which user)
   - Restore button

### Restore Previous Version

1. Find version you want to restore
2. Click **"Restore"** button
3. Confirm in dialog
4. Page reverts to that version state
5. Original version remains in history
6. New "restore" version created for audit trail

### How Often Are Versions Saved?

- Automatic snapshot every 5 minutes
- Manual snapshot when **"Mark as Ready"** is clicked
- On page publish/unpublish
- Each version captures: page metadata + all blocks

---

## 📊 Analytics (Phase 4)

### View Page Analytics

1. Go to `/cms/pages/[pageId]/analytics`
2. See metrics:
   - **Total Views**: How many times page was viewed
   - **Block Views**: Individual block view counts
   - **Click Rate**: CTA button clicks vs. views

### Track Block Events

Automatically tracked on public pages:
- **Page View**: When page loads
- **Block View**: When block becomes visible
- **Click**: When CTA button clicked

### Compare A/B Test Variants

1. Go to `/cms/blocks/[blockId]/compare-variants`
2. See performance comparison:
   - Views per variant
   - Clicks per variant
   - Engagement rate
   - Winner determination

---

## 🖼️ Image Management

### Upload an Image

1. Click **"Upload"** button on any image field
2. Modal opens
3. Drag & drop or click to browse files
4. Wait for upload to complete
5. Image appears in recent uploads gallery
6. Click thumbnail to select
7. Image URL populated automatically
8. Alt text pre-filled with filename

### Delete an Image

1. In uploads gallery, hover over thumbnail
2. Click **"✕"** button
3. Image removed from server
4. Only deleted if not used by any block

### Image Storage

- Images stored in: `/apps/api/uploads/`
- Metadata tracked in database
- Usage count prevents accidental deletion
- Each image has: URL, size, alt text, upload date

---

## 🔐 Permissions & Access

### Who Can Access CMS?

- Only users with **Admin** role
- Authenticated via JWT token
- Session required

### What Can Admins Do?

- ✅ Create, edit, delete pages
- ✅ Manage blocks (add, edit, delete, duplicate)
- ✅ Upload and manage images
- ✅ View version history
- ✅ Schedule publish actions
- ✅ View analytics

### User Attribution

All operations recorded with:
- Which admin made the change
- Timestamp of the action
- Type of action

---

## 🐛 Troubleshooting

### Images Not Uploading

**Problem**: Upload fails with error  
**Solution**:
- Check file size (max 5MB)
- Verify file type (JPEG, PNG, WebP, GIF)
- Check disk space on server
- Verify API endpoint: POST `/cms/files/upload`

### Changes Not Saving

**Problem**: "Save failed" error  
**Solution**:
- Check internet connection
- Verify API endpoint: PATCH `/cms/pages/:pageId`
- Ensure JWT token is valid
- Check browser console for detailed error

### Page Not Publishing

**Problem**: "Publish failed" error  
**Solution**:
- Ensure page is in "Ready" state first
- Verify no validation errors in blocks
- Check API endpoint: POST `/cms/pages/:pageId/publish`
- Verify your role has permission

### Version Restore Not Working

**Problem**: Restore button doesn't appear  
**Solution**:
- First version (original) cannot be restored
- Only previous versions have restore button
- Click "Version History" to refresh list
- Check API endpoint: POST `/cms/versions/:versionId/restore`

---

## 📱 Public Page URLs

### How Pages Are Accessed

Once published, page accessible at:

```
http://localhost:3000/pages/[slug]
```

**Example**: Page with slug "about-us" → `http://localhost:3000/pages/about-us`

### Block Rendering

Each block type renders with its own component:
- **Hero**: Large banner section
- **Text**: Formatted paragraph
- **Image**: Responsive image display
- **CTA**: Button with href
- **Testimonial**: Quote card
- **FAQ**: Expandable items
- **Grid**: Multi-column layout
- **Features**: Icon grid
- **Divider**: Visual separator

---

## 💡 Best Practices

### Draft & Publish
1. Always save changes before publishing
2. Use "Mark as Ready" for review stage
3. Schedule posts in advance for automatic publishing
4. Keep versions for rollback capability

### Content
1. Use Rich Text editor formatting wisely
2. Optimize image sizes before upload (recommended < 2MB)
3. Add alt text to all images (accessibility)
4. Test responsive on mobile

### SEO
1. Fill in Meta Description (160 chars max)
2. Add OG image for social sharing
3. Use keywords in title and description
4. Keep slug URL-friendly (lowercase, hyphens)

### Analytics
1. Monitor view/click rates weekly
2. Use A/B testing for CTAs and hero images
3. Identify underperforming blocks
4. Optimize based on engagement data

---

## 🔗 Useful Links

### Internal Routes
- **CMS Dashboard**: `/cms`
- **Page Editor**: `/cms/editor/[pageId]`
- **Public Page**: `/pages/[slug]`
- **Admin Panel**: `/admin`

### API Endpoints (for developers)
- **Create Page**: `POST /api/v1/cms/pages`
- **Update Page**: `PATCH /api/v1/cms/pages/:pageId`
- **Publish**: `POST /api/v1/cms/pages/:pageId/publish`
- **Get Analytics**: `GET /api/v1/cms/pages/:pageId/analytics`
- **Upload File**: `POST /api/v1/cms/files/upload`

### Documentation Files
- [Phase 2-4 Implementation](./PHASE_2_3_4_IMPLEMENTATION_COMPLETE.md)
- [API Documentation](./PHASE_12_QUICK_REFERENCE.md)
- [Database Schema](./PHASE_12_DATABASE_SCHEMA.md)

---

## 🎓 Example Workflow

### Step-by-Step: Create & Publish "Services" Page

1. Go to `/cms`
2. Click "+ Create New Page"
3. Title: "Our Services"
4. Create (slug auto-set to "our-services")
5. Click "Edit"
6. Add blocks:
   - Hero block with service intro
   - Feature block with 3 services
   - CTA block with contact button
   - FAQ block with common questions
7. Add images:
   - Service icons or screenshots
   - Hero background image
   - Feature thumbnails
8. Fill SEO metadata
9. Click "Save Page"
10. Click "Mark as Ready"
11. Click "Publish Now"
12. Page live at: `/pages/our-services`

**Done!** 🎉

---

## ❓ FAQ

**Q: How often are versions saved?**  
A: Every 5 minutes automatically, plus on key actions (ready, publish, unpublish).

**Q: Can I revert to old versions?**  
A: Yes! Click "Version History" and select any previous version to restore.

**Q: What happens when I schedule a publish?**  
A: Action queued in database. Background scheduler executes at scheduled time.

**Q: Are drafts visible to public?**  
A: No. Only published pages visible to public. Drafts only for admins.

**Q: Can I edit block HTML directly?**  
A: Rich text editor uses Markdown. For advanced HTML, edit API directly.

**Q: How are images stored?**  
A: Files stored on server disk. Metadata in PostgreSQL database.

**Q: What's the max image size?**  
A: 5MB per image. Recommended: optimize before upload.

**Q: Can I see who edited a page?**  
A: Yes! Version history shows creator and timestamp for each version.

---

## 📞 Support & Feedback

For bugs or feature requests:
1. Check this guide first
2. Review implementation docs
3. Contact development team

**Status**: All Phase 2-4 features ready for production testing ✅

---

*Last Updated: [Current Session]*  
*Build Version: [Latest Commit]*  
*Ready for: Testing, UAT, Production Deployment*
