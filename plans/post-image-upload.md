# Post Image Upload and Display Implementation Plan

## 1. Database Schema Update
Modify `prisma/schema.prisma` to include a `PostImage` model.

```prisma
model Post {
  // ... existing fields
  images    PostImage[]
}

model PostImage {
  id        String   @id @default(cuid())
  url       String
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

## 2. Backend Logic Updates

### `src/lib/post.ts`
- Update `createPost` to accept `images: string[]`.
- Update `getPosts` and `getPostById` to include `images` in the Prisma query.

### `src/app/api/post/route.ts`
- Update `POST` handler to receive `images` array from the request body.

## 3. Frontend Components

### New Component: `src/components/PostImages.tsx`
- Props: `images: string[]`, `isDetail?: boolean`
- **Grid Logic**:
  - **1 image**: Single large image (max-height constrained).
  - **2 images**: 2 columns.
  - **3 images**: 3 columns.
  - **4 images**: 2 columns (2x2 grid).
  - **5-9 images**: 3 columns (Jiugongge).
- **Display Limit**:
  - **Detail Page (`isDetail=true`)**: Show ALL images. Grid layout continues (3 cols for >4).
  - **Feed (`isDetail=false`)**:
    - Show max **9** images.
    - If `images.length > 9`:
      - Display first 9 images.
      - The 9th image has an overlay: `+{remaining_count}`.
- **Styling**:
  - Use `grid` and `grid-cols-*`.
  - Square aspect ratio for grid items (using `aspect-square` and `object-cover`).

### Update `src/components/HomeContent.tsx`
- **State**:
  - `selectedImages`: Array of uploaded image URLs.
  - `isUploading`: Boolean to track upload status.
- **UI**:
  - Add an "Image" button (icon) to the post creation area.
  - Hidden file input accepting `image/*`, multiple.
  - **Preview Area**: Display thumbnails of uploaded images with a "Remove" (X) button.
- **Logic**:
  - `handleImageSelect`: Upload file immediately to `/api/upload` and get the URL. Add URL to `selectedImages`.
  - `handleCreatePost`: Include `images: selectedImages` in the API call. Clear `selectedImages` on success.
- **Display**:
  - Import and use `PostImages` in the post list rendering (`isDetail={false}`).

### Update `src/components/UserPostList.tsx`
- Import and use `PostImages` (`isDetail={false}`).

### Update `src/app/post/[id]/page.tsx`
- Import and use `PostImages` (`isDetail={true}`).

## 4. API Interfaces
- **POST /api/post**
  - Request Body: `{ content: string, authorId: string, images?: string[] }`

## 5. Execution Steps
1.  Modify `prisma/schema.prisma` and run `npx prisma db push`.
2.  Update `src/lib/post.ts`.
3.  Update `src/app/api/post/route.ts`.
4.  Create `src/components/PostImages.tsx`.
5.  Update `src/components/HomeContent.tsx`.
6.  Update `src/components/UserPostList.tsx`.
7.  Update `src/app/post/[id]/page.tsx`.
