# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Build and production
npm run build        # Build for production
npm run start        # Start production server

# Database (WARNING: dev connects to production DB)
npx prisma generate  # Generate Prisma Client (outputs to src/generated)
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio GUI

# Linting
npm run lint         # Run ESLint
```

**Note**: No test framework is currently configured. Running a single test is not applicable.

## Code Style

### Imports
- Use `@/*` path aliases for src imports: `import { prisma } from "@/lib/prisma"`
- Order: external libraries (next, react) → internal libraries (lib/) → components → types
- Absolute imports for external dependencies, relative (`./`) for local files in same directory
- Client components must include `"use client"` at the top of the file
- Server actions must include `"use server"` at the top of the file

### Formatting
- No Prettier configured - follow existing patterns in the codebase
- 2-space indentation
- Use `cn()` utility from `@/lib/utils` for conditional Tailwind classes
- Use Chinese for all user-facing text and comments
- Component interfaces should be exported

### TypeScript
- Strict mode enabled
- Use JSDoc for exported functions with `@param`, `@returns`, `@throws`, `@example`
- Use Chinese for code comments and JSDoc descriptions (project convention)
- Prisma types are generated in `src/generated` - use inferred types from schema
- Use `as any` sparingly (only for NextAuth sessions where types are complex)
- Type definitions for external modules go in `src/types/` (e.g., `next-auth.d.ts`)

### Naming Conventions
- Components: PascalCase (`Button.tsx`, `HomeContent.tsx`)
- Utilities/Functions: camelCase (`getPosts()`, `cn()`)
- API Routes: lowercase kebab-case directories (`/api/post`, `/api/upload`)
- Constants: UPPER_SNAKE_CASE (`MAX_CONTENT_LENGTH`)
- Database models: PascalCase (Prisma default)

### Error Handling
- API routes: Always wrap in try/catch
- Use `console.error()` for logging errors
- Return consistent error format: `NextResponse.json({ error: "message" }, { status: code })`
- Common status codes: 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal)
- Non-critical operations (like view count) should log but not throw

### API Route Pattern
```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await request.json();
    // validation...
    const result = await someFunction(data);
    return NextResponse.json({ message: "Success", data: result }, { status: 200 });
  } catch (error) {
    console.error("Operation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Prisma Usage
- Import from `@/lib/prisma` (singleton pattern)
- Use `select` to control returned fields and avoid over-fetching
- Use `include` for nested relations
- Cascade deletes are configured in schema
- Check permissions (author or admin) before updates/deletes

### Component Guidelines
- Place reusable UI components in `components/ui/`
- Use `forwardRef` for components that accept refs
- Export interfaces for props
- Add `displayName` for forwardRef components

### Server Actions Pattern
Server actions go in `src/lib/actions/` and must start with `"use server"`:
```typescript
"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function someServerAction(param: string): Promise<{ success: boolean; message: string }> {
  try {
    // Validate input
    if (!param) {
      return { success: false, message: "Invalid input" };
    }

    // Database operation
    await prisma.someModel.create({ data: { field: param } });

    // Revalidate cache
    revalidatePath("/some-path");

    return { success: true, message: "Success" };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, message: "Internal server error" };
  }
}
```

### Important Constraints
- Post title max: 200 chars (optional)
- Post content max: 10,000 chars
- Max images per post: 10
- Max attachments per post: 5
- Password hashing: bcryptjs
- Image uploads go to Tencent Cloud COS + CDN
- Development environment connects to production database - use caution

### Security Notes
- All authenticated routes must check session
- Admin routes must verify `session.user.role === "admin"`
- Validate all inputs (type, length, format)
- Never expose secrets - ensure `NEXT_PUBLIC_` prefix only for client-side variables
- Tencent COS keys must NOT have `NEXT_PUBLIC_` prefix

### Notification Requirement
After completing any task, send a desktop notification:
```powershell
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Task description', '✅ Task Complete')"
```

### ESLint Configuration
- Uses `eslint.config.mjs` with Next.js recommended rules
- Ignores: `src/generated/**` (auto-generated)
- Run `npm run lint` to verify changes
