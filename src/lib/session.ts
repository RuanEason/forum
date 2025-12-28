import { getSession, signIn } from "next-auth/react";

/**
 * 强制刷新用户会话以获取最新的用户信息
 * 当用户角色或权限在数据库中被更改时使用
 */
export async function refreshUserSession() {
  // 获取当前会话
  const session = await getSession();
  
  if (session?.user) {
    // 强制重新登录以刷新会话
    // 这将触发 NextAuth 的 authorize 函数重新从数据库获取用户信息
    await signIn("credentials", {
      email: session.user.email,
      password: "", // 注意：这种方法要求 authorize 函数支持空密码刷新
      redirect: false,
    });
  }
}

/**
 * 检查用户是否有管理员权限
 * 这个函数会从服务器获取最新信息而不是依赖缓存的 JWT
 */
export async function checkAdminPermission(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/me");
    if (response.ok) {
      const userData = await response.json();
      return userData.role === "admin";
    }
    return false;
  } catch (error) {
    console.error("检查管理员权限时出错:", error);
    return false;
  }
}