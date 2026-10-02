import CreatePostWorkspace from "@/components/CreatePostWorkspace";
import { isVideoUploadEnabled } from "@/lib/feature-flags";

export default function CreatePostPage() {
  // 视频上传开关在服务端求值后下发，保证前端提示与后端拒绝逻辑一致。
  return <CreatePostWorkspace presentation="page" videoUploadEnabled={isVideoUploadEnabled()} />;
}
