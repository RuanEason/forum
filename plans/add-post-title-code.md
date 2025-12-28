# 添加帖子标题功能 - 详细代码实施方案

本方案包含所有需要修改的文件的具体代码变更。

## 1. 数据库变更 (prisma/schema.prisma)

在 `Post` 模型中添加 `title` 字段。为了向后兼容，我们将 `title` 设为可选 (`String?`)。

```prisma
// prisma/schema.prisma

model Post {
  id        String     @id @default(cuid())
  title     String?    // 新增字段
  content   String     @db.Text
  authorId  String
  // ... 其他字段保持不变
}
```

**操作:** 修改后需运行 `npx prisma db push` 和 `npx prisma generate`。

## 2. 后端逻辑变更

### 2.1 修改 `src/lib/post.ts`

更新 `createPost` 和 `updatePost` 函数以支持 `title`。

```typescript
// src/lib/post.ts

// createPost 函数签名变更
export async function createPost(
  title: string,
  content: string,
  authorId: string,
  images: string[] = []
) {
  return prisma.post.create({
    data: {
      title, // 新增
      content,
      authorId,
      images: {
        create: images.map((url) => ({ url })),
      },
    },
  });
}

// updatePost 函数签名变更
export async function updatePost(id: string, title: string, content: string) {
  return prisma.post.update({
    where: { id },
    data: {
      title, // 新增
      content,
    },
  });
}
```

### 2.2 修改 `src/app/api/post/route.ts`

更新 `POST` 和 `PUT` 接口以接收 `title`。

```typescript
// src/app/api/post/route.ts

// POST 方法
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // ... 鉴权检查

    // 解析 title
    const { title, content, images } = await request.json();

    // 验证 title
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // 传入 title
    const post = await createPost(title, content, session.user.id, images);

    return NextResponse.json(
      { message: "Post created successfully", post },
      { status: 201 }
    );
  } catch (error) {
    // ... 错误处理
  }
}

// PUT 方法
export async function PUT(request: NextRequest) {
  try {
    // ... 鉴权检查

    const { id, title, content } = await request.json();

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: "Post ID, title and content are required" },
        { status: 400 }
      );
    }

    // ... 获取 existingPost 并检查权限

    // 传入 title
    const updatedPost = await updatePost(id, title, content);

    return NextResponse.json(
      { message: "Post updated successfully", post: updatedPost },
      { status: 200 }
    );
  } catch (error) {
    // ... 错误处理
  }
}
```

## 3. 前端页面变更

### 3.1 发布帖子页面 (`src/app/post/create/page.tsx`)

添加标题输入框。

```tsx
// src/app/post/create/page.tsx

export default function CreatePostPage() {
  // ... 其他 state
  const [title, setTitle] = useState(""); // 新增 state

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // ... 登录检查

    // 验证标题
    if (!title.trim()) {
      setError("请输入标题");
      return;
    }
    if (!content.trim() && selectedImages.length === 0) {
      setError("帖子内容或图片不能为空");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/post", {
        method: "POST",
        // ... headers
        body: JSON.stringify({
          title: title, // 发送标题
          content: content,
          authorId: session.user.id,
          images: selectedImages,
        }),
      });
      // ... 处理响应
    } catch (err) {
      // ...
    }
  };

  return (
    // ...
    <form onSubmit={handleCreatePost}>
      <div className="space-y-6">
        {/* 新增：标题输入框 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            标题
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入帖子标题"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            maxLength={100}
            required
          />
        </div>

        {/* Simple Markdown Editor - 保持不变 */}
        <SimpleMarkdownEditor ... />

        {/* ... 图片上传和按钮 */}
      </div>
    </form>
    // ...
  );
}
```

### 3.2 帖子列表项 (`src/components/UserPostList.tsx` 和 `src/components/HomeContent.tsx`)

你需要同时更新这两个文件，因为它们有类似的展示逻辑。

```tsx
// src/components/UserPostList.tsx (HomeContent.tsx 类似)

// 1. 更新 Interface
interface PostProps {
  // ...
  title: string | null; // 新增
  // ...
}

// 2. 在渲染时显示标题
// 位于 <div className="p-4 sm:p-6"> 内部，作者信息下方，内容上方

<div className="mt-2 mb-2">
  <Link href={`/post/${post.id}`} className="block group">
    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
      {post.title || "无标题"}
    </h3>
  </Link>
</div>;

// 注意：如果不想显示"无标题"，可以只在 title 存在时渲染
```

### 3.3 帖子详情页 (`src/app/post/[id]/page.tsx`)

```tsx
// src/app/post/[id]/page.tsx

// 1. 更新 Interface
interface PostDetailProps {
  // ...
  title: string | null;
  // ...
}

// 2. 更新 generateMetadata
export async function generateMetadata(...) {
  // ...
  const title = post.title
    ? `${post.title} - ${post.author.name || "匿名用户"}`
    : `${post.author.name || "匿名用户"} 的帖子`;
  // ...
}

// 3. 在页面中显示标题
// 位于 <div className="bg-white ..."> 内部，作者信息下方，正文上方

// ... 作者信息部分 ...
<div className="mt-4 mb-4">
  <h1 className="text-2xl font-bold text-gray-900">
    {post.title || "无标题"}
  </h1>
</div>
// ... 正文部分 ...
```

## 4. 实施顺序

请按照上述 1 -> 2 -> 3 的顺序，在 **Code** 模式下进行修改。
