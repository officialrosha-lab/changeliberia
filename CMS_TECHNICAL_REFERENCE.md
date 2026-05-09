# Block-Based CMS - Technical Reference

## System Architecture

### Database Schema

```prisma
model CMSPage {
  id        String      @id @default(cuid())
  title     String
  slug      String      @unique
  blocks    CMSBlock[]  @relation(onDelete: Cascade)
  published Boolean     @default(false)
  metadata  String?     @db.Text()
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model CMSBlock {
  id        String    @id @default(cuid())
  pageId    String
  page      CMSPage   @relation(fields: [pageId], references: [id], onDelete: Cascade)
  type      String    // hero|text|image|grid|cta|testimonial|divider|faq|features
  order     Int       // Position in page
  props     String    @db.Text() // JSON-stringified block properties
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@unique([pageId, order])
  @@index([pageId, order])
}
```

### Backend Stack

**API Framework:** NestJS
**Database ORM:** Prisma with PostgreSQL
**Authentication:** JWT with role-based access control
**Validation:** class-validator with DTOs

### Key Backend Files

- [/apps/api/src/cms/cms.service.ts](apps/api/src/cms/cms.service.ts) - Business logic
- [/apps/api/src/cms/cms.controller.ts](apps/api/src/cms/cms.controller.ts) - HTTP endpoints
- [/apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) - Database model

### Frontend Stack

**Framework:** Next.js 16 with React 19
**Styling:** Tailwind CSS with dark mode
**State Management:** Zustand
**Type Safety:** TypeScript with strict mode

### Key Frontend Files

- [/apps/web/components/cms-page-block-editor.tsx](apps/web/components/cms-page-block-editor.tsx) - Admin visual editor (380+ lines)
- [/apps/web/components/cms-block-renderer.tsx](apps/web/components/cms-block-renderer.tsx) - Block rendering engine (400+ lines)
- [/apps/web/lib/cms.ts](apps/web/lib/cms.ts) - Types and API utilities

## Block Types Reference

### 1. Hero Block
**Purpose:** Large banner section, typically for page headers
**Props Interface:**
```typescript
interface HeroBlockProps {
  title: string;           // Main headline
  subtitle?: string;       // Secondary text
  description?: string;    // Longer description
  backgroundImage?: string; // Optional background image URL
  ctaText?: string;        // Button label (e.g., "Get Started")
  ctaLink?: string;        // Button destination
}
```
**Rendering:** Full-width hero with title/subtitle/description, optional image background, optional CTA button
**Example Usage:**
```javascript
{
  type: 'hero',
  props: {
    title: 'Welcome to Change Liberia',
    subtitle: 'Empower your voice',
    description: 'Create, gather signatures, and submit petitions...',
    ctaText: 'Get Started',
    ctaLink: '/create'
  }
}
```

### 2. Text Block
**Purpose:** Paragraphs and body content
**Props Interface:**
```typescript
interface TextBlockProps {
  title?: string;        // Optional section title
  body: string;         // Main text content
  alignment?: 'left' | 'center' | 'right';
  emphasize?: boolean;  // Apply emphasis styling
}
```
**Rendering:** Styled text container, centered title if provided
**Example Usage:**
```javascript
{
  type: 'text',
  props: {
    title: 'Our Mission',
    body: 'To create a platform for citizens...',
    alignment: 'left'
  }
}
```

### 3. Image Block
**Purpose:** Single images with optional captions
**Props Interface:**
```typescript
interface ImageBlockProps {
  src: string;          // Image URL
  alt?: string;         // Alt text for accessibility
  caption?: string;     // Optional caption
}
```
**Rendering:** Responsive image with caption below
**Example Usage:**
```javascript
{
  type: 'image',
  props: {
    src: 'https://example.com/hero.jpg',
    alt: 'Change Liberia platform',
    caption: 'Our vision in action'
  }
}
```

### 4. Grid Block
**Purpose:** Multi-column layouts for structured data
**Props Interface:**
```typescript
interface GridItem {
  icon?: string;        // Icon or emoji
  title: string;
  description: string;
  details?: string;     // Extra information
}

interface GridBlockProps {
  columns?: 1 | 2 | 3 | 4;  // Grid columns (default: 3)
  items: GridItem[];         // 1-6 items typically
}
```
**Rendering:** Responsive grid layout, collapsible on mobile
**Example Usage:**
```javascript
{
  type: 'grid',
  props: {
    columns: 4,
    items: [
      {
        icon: '🎯',
        title: 'Transparency',
        description: 'Open and honest governance'
      },
      {
        icon: '⚖️',
        title: 'Accountability',
        description: 'Responsible decision-making'
      }
    ]
  }
}
```

### 5. CTA Block
**Purpose:** Call-to-action sections encouraging user action
**Props Interface:**
```typescript
interface CTABlockProps {
  headline: string;          // Main heading
  description?: string;      // Supporting text
  primaryButtonText: string; // Primary button label
  primaryButtonLink: string; // Primary button URL
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}
```
**Rendering:** Centered text with two button options (primary/secondary styling)
**Example Usage:**
```javascript
{
  type: 'cta',
  props: {
    headline: 'Ready to make a difference?',
    description: 'Join thousands of citizens...',
    primaryButtonText: 'Create a Petition',
    primaryButtonLink: '/create',
    secondaryButtonText: 'Learn More',
    secondaryButtonLink: '/how-it-works'
  }
}
```

### 6. Testimonial Block
**Purpose:** User quotes and testimonials
**Props Interface:**
```typescript
interface TestimonialBlockProps {
  quote: string;    // Quoted text
  author: string;   // Person who said it
  title?: string;   // Author's title/role
}
```
**Rendering:** Styled quote box with attribution
**Example Usage:**
```javascript
{
  type: 'testimonial',
  props: {
    quote: 'This platform gave me a voice...',
    author: 'John Smith',
    title: 'Community Organizer'
  }
}
```

### 7. Divider Block
**Purpose:** Visual separator between sections
**Props Interface:**
```typescript
interface DividerBlockProps {
  type?: 'line' | 'space'; // Visual style
}
```
**Rendering:** Horizontal line or whitespace
**Example Usage:**
```javascript
{
  type: 'divider',
  props: { type: 'line' }
}
```

### 8. FAQ Block
**Purpose:** Expandable question/answer pairs
**Props Interface:**
```typescript
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQBlockProps {
  items: FAQItem[]; // 2-10 items typically
}
```
**Rendering:** Accordion-style expandable items using `<details>` element
**Example Usage:**
```javascript
{
  type: 'faq',
  props: {
    items: [
      {
        question: 'How do I create a petition?',
        answer: 'Click Create, fill in details...'
      },
      {
        question: 'How many signatures do I need?',
        answer: 'Currently 500 signatures...'
      }
    ]
  }
}
```

### 9. Features Block
**Purpose:** List of features or capabilities
**Props Interface:**
```typescript
interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

interface FeaturesBlockProps {
  items: FeatureItem[]; // 3-6 items typically
}
```
**Rendering:** Vertical list with icons and descriptions
**Example Usage:**
```javascript
{
  type: 'features',
  props: {
    items: [
      {
        icon: '📝',
        title: 'Create Petitions',
        description: 'Easily start campaigns for change'
      }
    ]
  }
}
```

## API Endpoints

### Get Page with Blocks
```http
GET /api/cms/pages/:slug
Content-Type: application/json

# Response:
{
  "id": "page_id",
  "title": "About",
  "slug": "about",
  "published": true,
  "blocks": [
    {
      "id": "block_1",
      "type": "hero",
      "order": 1,
      "props": { /* parsed JSON */ }
    }
  ]
}
```

### List Blocks for Page
```http
GET /api/cms/pages/:pageId/blocks
Authorization: Bearer <token>
Content-Type: application/json

# Response:
[
  {
    "id": "block_1",
    "pageId": "page_id",
    "type": "hero",
    "order": 1,
    "props": { /* parsed JSON */ }
  }
]
```

### Create Block
```http
POST /api/cms/pages/:pageId/blocks
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "hero",
  "order": 1,
  "props": {
    "title": "Welcome",
    "subtitle": "To our platform"
  }
}

# Response: 201 Created
{
  "id": "new_block_id",
  "pageId": "page_id",
  "type": "hero",
  "order": 1,
  "props": { /* same as request */ },
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### Update Block
```http
PATCH /api/cms/blocks/:blockId
Authorization: Bearer <token>
Content-Type: application/json

{
  "props": {
    "title": "Updated Title",
    "subtitle": "New subtitle"
  }
}

# Response: 200 OK
{
  "id": "block_id",
  "pageId": "page_id",
  "type": "hero",
  "order": 1,
  "props": { /* updated */ },
  "updatedAt": "2025-01-15T10:05:00Z"
}
```

### Delete Block
```http
DELETE /api/cms/blocks/:blockId
Authorization: Bearer <token>

# Response: 200 OK
{
  "message": "Block deleted successfully"
}
```

## Frontend Component Integration

### Rendering a Page
```typescript
import { fetchCmsPageWithBlocks } from '@/lib/cms';
import { CMSBlockRenderer } from '@/components/cms-block-renderer';

export default async function AboutPage() {
  const page = await fetchCmsPageWithBlocks('about');
  
  if (!page) {
    return <div>Page not found</div>;
  }
  
  return (
    <main>
      <h1>{page.title}</h1>
      {page.blocks?.map(block => (
        <CMSBlockRenderer key={block.id} block={block} />
      ))}
    </main>
  );
}
```

### Rendering Individual Blocks
```typescript
<CMSBlockRenderer 
  block={{
    id: 'block_1',
    type: 'hero',
    props: {
      title: 'Welcome',
      subtitle: 'To Change Liberia'
    }
  }}
/>
```

## Type Definitions

### Frontend Types
```typescript
// From /apps/web/lib/cms.ts

interface CMSBlock {
  id: string;
  pageId: string;
  type: string;
  order: number;
  props: Record<string, any>;
}

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  blocks?: CMSBlock[];
  metadata?: string;
}
```

### Backend DTOs
```typescript
// From /apps/api/src/cms/cms.dto.ts

export class CreateBlockDto {
  @IsString() @IsIn([...]) type: string;
  @IsInt() @Min(0) order: number;
  @IsObject() props: Record<string, any>;
}

export class UpdateBlockDto {
  @IsOptional() @IsObject() props?: Record<string, any>;
}
```

## Performance Considerations

### Database Queries
- Blocks are fetched with `include: { blocks: { orderBy: { order: 'asc' } } }`
- Indexed on `[pageId, order]` for fast sorting
- Cascade delete removes blocks when page is deleted

### Rendering
- CMSBlockRenderer uses React.memo to prevent unnecessary re-renders
- Type assertions prevent TypeScript errors with parsed props
- Tailwind CSS ensures fast styling with no runtime CSS-in-JS

### API Calls
- Frontend makes 1 HTTP request per page load
- All blocks fetched together (no N+1 queries)
- Blocks are cached by Next.js when appropriate

## Adding New Block Types

To add a new block type:

1. **Update Prisma schema** (no changes needed - type is string)

2. **Create DTO** in `/apps/api/src/cms/`:
```typescript
export class YourBlockProps {
  @IsString() prop1: string;
  @IsNumber() prop2?: number;
}
```

3. **Add to CMSBlockRenderer** in `/apps/web/components/cms-block-renderer.tsx`:
```typescript
case 'yourtype':
  return <YourBlockComponent {...(props as YourBlockProps)} />;
```

4. **Add props editor** to CMSPageBlockEditor if needed

5. **Update block type enum** if maintaining allowlist

## Security & Validation

- All block creation/updates require JWT authentication
- Only admin users can modify blocks (@Permission guard)
- Props are validated using class-validator DTOs
- Props stored as JSON.stringify() to prevent injection
- Public pages never expose authentication tokens

## Deployment Notes

- Blocks are stored in PostgreSQL database
- No code deployment needed to update content
- Migration: `20260507095235_add_cms_blocks` applied on deploy
- CDN can cache public pages if needed
- Clear cache after bulk updates if using caching layer

## Monitoring & Debugging

### Check Database
```sql
SELECT id, slug, title, published, created_at
FROM "CMSPage"
WHERE slug = 'about';

SELECT id, type, "order", props
FROM "CMSBlock"
WHERE "pageId" = '<page_id>'
ORDER BY "order";
```

### Enable API Logging
Add to NestJS interceptor:
```typescript
console.log(`Block operation: ${method} ${path}`, { blockId, props });
```

### Browser DevTools
- Check Network tab for API calls to `/api/cms/`
- Verify props JSON in response
- Inspect CMSBlockRenderer DOM for styling issues

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team
