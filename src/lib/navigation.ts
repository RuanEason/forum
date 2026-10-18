/**
 * 站内导航的统一准入判断。
 *
 * 背景：全局加载遮罩（PageLoadProgressProvider）在超时后会「作废」当前这次换页，
 * 但 Next.js 的路由跳转一旦被触发就收不回来——RSC 请求还在路上，
 * 等它返回时页面照样会切过去，于是出现「遮罩已经消失 → 用户以为失败了 → 突然又跳走」。
 *
 * 所以这里维护一份「加载锁」：
 * - 锁存在时，新发起的导航意图会被丢弃，保证只有加载动画还在的时候才允许换页；
 * - 每次导航还会拿到一张一次性票据，票据被撤销后，迟到的 router.push 也不会执行。
 *
 * 锁状态写进 Cookie，而不是普通内存变量：Next 会把预取渲染放进 Web Worker，
 * 而浏览器对 Cookie 有内存缓存，主线程写入后 Worker 里能同步读到同一份状态。
 */

/** 加载锁 Cookie 名：空值表示空闲，"1" 表示正在加载，"hard" 表示超时后强制拦截。 */
export const LOADING_COOKIE_NAME = "dsh_loading";

/** 超时作废某次导航时派发的事件，detail 为导航票据 id。 */
export const NAVIGATION_CANCELLED_EVENT = "dsh:navigation-cancelled";

type TicketState = "pending" | "committed" | "cancelled";
type LoadingState = "idle" | "loading" | "hard";

const ticketStates = new Map<string, TicketState>();

/** 主线程权威状态：这里直接读变量，不依赖 document.cookie 的解析。 */
let mainThreadState: LoadingState = "idle";
/** Worker 内读不到主线程变量，只能回落到 Cookie。 */
const inWorker = typeof window === "undefined" && typeof self !== "undefined";

let ticketSeq = 0;

/**
 * 是否运行在浏览器主线程。
 * @returns {boolean} 可访问 window 时为 true
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * 写出加载锁 Cookie（仅主线程调用）。
 * @param value - idle / loading / hard
 */
export function writeLoadingCookie(value: LoadingState): void {
  mainThreadState = value;
  if (!isBrowser()) {
    return;
  }
  const cookieValue = value === "idle" ? "" : value === "loading" ? "1" : "hard";
  document.cookie = `${LOADING_COOKIE_NAME}=${cookieValue}; path=/; SameSite=Lax`;
}

/**
 * 读取当前加载锁状态。
 * @returns {"idle" | "loading" | "hard"} 当前状态
 */
export function readLoadingState(): LoadingState {
  if (typeof document === "undefined") {
    return "idle";
  }

  if (!inWorker) {
    return mainThreadState;
  }

  const cookieEntries = document.cookie.split("; ");
  const cookieEntry = cookieEntries.find((entry) => entry.startsWith(LOADING_COOKIE_NAME + "="));
  const cookieValue = cookieEntry ? cookieEntry.slice(LOADING_COOKIE_NAME.length + 1) : "";
  if (cookieValue.startsWith("hard")) {
    return "hard";
  }
  return cookieValue === "1" ? "loading" : "idle";
}

/**
 * 撤销一次尚未执行的导航，撤销后该票据永久失效。
 * @param id - 导航票据 id
 */
export function cancelNavigation(id: string | null): void {
  if (!id) {
    return;
  }
  ticketStates.set(id, "cancelled");
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(new CustomEvent(NAVIGATION_CANCELLED_EVENT, { detail: id }));
}

/**
 * 查询导航票据是否仍然有效。
 * @param id - 导航票据 id
 * @returns {boolean} 是否允许继续执行这次导航
 */
export function isNavigationAllowed(id: string | null): boolean {
  if (!id) {
    return readLoadingState() !== "hard";
  }
  return ticketStates.get(id) !== "cancelled";
}

/**
 * 为一次程序化导航申请票据。
 * @returns {string} 票据 id
 */
export function issueNavigationTicket(): string {
  ticketSeq += 1;
  const id = `${Date.now().toString(36)}-${ticketSeq.toString(36)}`;
  ticketStates.set(id, "pending");
  if (isBrowser()) {
    // 票据只服务于一次导航，过期即回收，避免 Map 无限增长。
    window.setTimeout(() => {
      ticketStates.delete(id);
    }, 60000);
  }
  return id;
}

/**
 * 标记票据已经真正用于导航。
 * @param id - 导航票据 id
 */
export function markNavigationCommitted(id: string | null): void {
  if (!id) {
    return;
  }
  ticketStates.set(id, "committed");
}
