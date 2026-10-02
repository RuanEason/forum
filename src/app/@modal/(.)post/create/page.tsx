import CreatePostWorkspace from "@/components/CreatePostWorkspace";
import { isVideoUploadEnabled } from "@/lib/feature-flags";

export default function CreatePostModalPage() {
  return <CreatePostWorkspace presentation="sheet" videoUploadEnabled={isVideoUploadEnabled()} />;
}
