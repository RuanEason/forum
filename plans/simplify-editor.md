# Simplify Rich Text Editor Plan

## Objective
Simplify the post creation editor (`src/app/post/create/page.tsx`) to make it more intuitive for middle school students. Remove complex, broken, or redundant features (specifically the built-in image embedding) and focus on basic text formatting.

## Current State
- Uses `@uiw/react-md-editor`.
- Displays default toolbar with all options (Bold, Italic, Headings, Code, Quote, Image, Link, Lists, etc.).
- Has a separate image upload section below the editor, making the editor's built-in image button redundant and potentially confusing (especially if it doesn't handle uploads correctly).

## Proposed Changes

### 1. Customize Toolbar Commands
We will use the `commandsFilter` prop to filter out advanced or redundant commands.

**Keep:**
- Bold (`bold`)
- Italic (`italic`)
- Strikethrough (`strikethrough`)
- Headings (`title`) - maybe limit to H1-H3 if possible, or just keep the generic title command.
- Quote (`quote`)
- Unordered List (`unordered-list`)
- Ordered List (`ordered-list`)
- Link (`link`)
- Divider (`hr`)

**Remove:**
- Image (`image`) - We have a dedicated image uploader.
- Code (`code`) - Not primary for general student posts.
- Code Block (`codeBlock`)
- Comment (`comment`)
- Table (`table`) - Too complex.
- Help (`help`)

### 2. Simplify Bottom Toolbar
The bottom toolbar often contains "Open in new window" or "Fullscreen" toggles. We can simplify this by setting `extraCommands={[]}` or filtering them as well if they are distracting. We might want to keep the "Preview" toggle if it's useful, or force a specific view mode if we want to be very opinionated. For now, we will keep the preview toggle but remove other extras.

### 3. Implementation Details
Modify `src/app/post/create/page.tsx`:

```tsx
// ... imports

export default function CreatePostPage() {
  // ... existing state

  // Define the filter function
  const commandsFilter = (command: any) => {
    const allowedCommands = [
      "bold", "italic", "strikethrough", "hr", "title",
      "quote", "unordered-list", "ordered-list", "link",
      "code", "codeBlock"
    ];
    
    if (allowedCommands.includes(command.name)) {
      return command;
    }
    return false;
  };

  // ... existing code

  return (
    // ...
    <MDEditor
      value={content}
      onChange={(val) => setContent(val || "")}
      height={300}
      preview="edit"
      commandsFilter={commandsFilter} // Add this
      extraCommands={[]} // Remove bottom toolbar extras (like fullscreen/preview toggle if desired, or keep specific ones)
      // ...
    />
    // ...
  );
}
```

## Verification
- Check that only the specified icons appear in the toolbar.
- Verify that the "Image" button is gone from the toolbar.
- Verify that basic formatting still works.
