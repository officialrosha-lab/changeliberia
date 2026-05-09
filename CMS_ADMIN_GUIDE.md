# CMS Block-Based Page Editor - Admin Guide

## Overview

The Change Liberia platform now features a **block-based CMS** that allows administrators to manage and edit content pages without writing code. Pages are composed of individual "blocks" (hero sections, text, images, grids, etc.) that can be added, edited, deleted, and reordered.

## Accessing the Admin CMS

1. Log in to the admin dashboard
2. Navigate to **Admin → CMS** 
3. You'll see three sections:
   - **Block-Based Page Editor** (Primary - for daily use)
   - **Page Management (Legacy)** (Old system - for reference)
   - **Template Management** (Configuration)

## Block-Based Page Editor

### Selecting a Page

1. At the top of the editor, select a page from the dropdown:
   - **About** - Organization information and values
   - **How It Works** - Step-by-step user guide
   - **Help Center** - FAQ and support information

2. The page loads with all existing blocks listed below

### Understanding Block Types

The CMS supports 9 different block types:

| Block Type | Purpose | Use Cases |
|-----------|---------|-----------|
| **Hero** | Large banner with title, subtitle, description, and CTA button | Page headers, call-to-action introductions |
| **Text** | Paragraphs with optional title | Body content, descriptions, explanations |
| **Image** | Single image with optional caption | Featured images, photos, illustrations |
| **Grid** | 1-4 column grid with items containing icon, title, description | Values, features, categories, step-by-step guides |
| **CTA** | Call-to-action section with primary and secondary buttons | Encouraging user action, sign-ups |
| **Testimonial** | Quote with author attribution | User stories, testimonials, quotes |
| **Divider** | Visual separator | Page rhythm, section breaks |
| **FAQ** | Expandable frequently asked questions | Q&A sections, help content |
| **Features** | List of features with icons and descriptions | Product features, capabilities |

### Adding a Block

1. Scroll to **Add Block** section at the bottom
2. Select the block type from the dropdown
3. Fill in the block-specific properties:
   - **Hero**: Title, Subtitle, Description, Background Image URL, Button Text, Button Link
   - **Text**: Title (optional), Body text, Alignment (left/center/right), Emphasize checkbox
   - **Image**: Image URL, Caption (optional)
   - **Grid**: Number of columns, Grid items (title, description, icon, optional details)
   - **CTA**: Headline, Description, Primary button (text/link), Secondary button (text/link)
   - **Testimonial**: Quote text, Author name
   - **Divider**: (No configuration needed)
   - **FAQ**: Question/answer pairs
   - **Features**: Feature items with icon, title, description

4. Click **Add Block** - the new block appears at the bottom

### Editing a Block

1. Find the block in the block list
2. In the block's edit section, modify the properties
3. The form displays relevant fields for that block type
4. Click **Update Block** to save changes
5. Changes appear immediately in the preview on the right

### Deleting a Block

1. Find the block in the list
2. Click the **Delete** button (red X icon)
3. Confirm deletion - the block is removed immediately

### Previewing Your Page

The **Preview** section on the right side of the screen shows:
- How the page will look to visitors
- Live updates as you add/edit/delete blocks
- Block rendering with proper styling

This is the exact view your users will see publicly.

### Publishing Changes

After making changes:
1. The changes are saved immediately to the database
2. Public pages update instantly (no separate publish step for blocks)
3. If you want to make multiple changes before going live, you can:
   - Edit blocks without saving (but they WILL save automatically)
   - Work across multiple pages in different browser tabs
   - Preview before finalizing

## Best Practices

### Content Organization

- **Hero blocks** should always be first (page header)
- **Text blocks** work best for body content and explanations
- **Grid blocks** are ideal for structured data (values, steps, categories)
- **FAQ blocks** keep questions/answers together
- **CTA blocks** encourage action at logical points

### Naming Conventions

For consistency, use these naming conventions:
- Block types: Use lowercase (hero, text, grid)
- Button text: Action-oriented (e.g., "Get Started", "Learn More", "Apply Now")
- Grid items: Use parallel structure

### Image URLs

- Use absolute URLs (full path including https://)
- Test images load properly in preview before publishing
- Recommended sizes:
  - Hero background: 1920x1080px or larger
  - Grid/Feature icons: 64x64px to 128x128px
  - Standard images: 800x600px to 1200x900px

### Text Content

- Keep text concise and scannable
- Use proper grammar and spelling
- Hero titles: 5-10 words typically
- Descriptions: 1-2 sentences per block
- FAQ answers: 2-3 sentences typically

## Database Backing

All blocks are stored in the database with:
- **Unique ID** - Auto-generated identifier
- **Type** - Block type (hero, text, etc.)
- **Order** - Position in the page (1st, 2nd, 3rd, etc.)
- **Props** - Block-specific data as JSON
- **Timestamps** - Created and updated dates

This means:
- Blocks persist across deployments
- No need to redeploy when editing content
- Instant updates to public pages
- Full history in database

## Current Pages

### About (/about)
**Current blocks:**
1. Hero - Welcome to Change Liberia
2. Text - Mission statement
3. Grid - Core values (transparency, accountability, innovation, integrity)
4. Text - Governance information
5. CTA - Join our movement button

### How It Works (/how-it-works)
**Current blocks:**
1. Hero - How petitions work
2. Grid - 4-step process (Create → Gather → Submit → Track)
3. Text - Additional explanation
4. FAQ - Common questions (5 items)

### Help Center (/help-center)
**Current blocks:**
1. Hero - We're here to help
2. Grid - 6 support categories (Getting Started, Creating, Verification, etc.)
3. FAQ - General questions (5 items)
4. FAQ - Creating petitions (5 items)
5. FAQ - Verification process (5 items)

## Troubleshooting

### Block isn't updating in preview
- Ensure you clicked **Update Block**
- Refresh the page if preview doesn't update
- Check browser console (F12) for errors

### Image isn't loading
- Verify the full URL is correct (including https://)
- Check the image exists at that URL
- Use a different image host if needed

### Text is cut off or misaligned
- Check the "Alignment" setting for text blocks
- Reduce text length if it's very long
- Verify no special characters are breaking layout

### Can't save changes
- Verify you're logged in and have admin permissions
- Check your internet connection
- Try refreshing the page and trying again

## API Endpoints (For Reference)

Developers can access blocks programmatically:

```
GET /api/cms/pages/:pageId/blocks
  - List all blocks for a page

POST /api/cms/pages/:pageId/blocks
  - Create a new block

PATCH /api/cms/blocks/:blockId
  - Update an existing block

DELETE /api/cms/blocks/:blockId
  - Delete a block

GET /api/cms/pages/:slug
  - Public endpoint to fetch published page with blocks
```

## Security

- Only admin users can edit CMS pages
- All changes are logged with timestamps
- Blocks are validated before saving
- Public pages show only published content

## Future Enhancements

Planned features:
- Drag-and-drop block reordering
- Block duplication
- Page versioning/drafts
- Scheduled publishing
- Media library integration
- A/B testing variants
- Analytics per block
- SEO metadata editor in visual interface

---

**Need help?** Contact the development team or check the inline help tooltips in the editor.
