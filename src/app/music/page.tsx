import Image from "next/image";
import MusicPlayer from "@/components/MusicPlayer";

export function generateMetadata() {
  const title = "清明节 | Music";
  const description = "A special Qingming music page on Slept.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default function MusicQingmingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Image
        src="https://cdn.zyg2024.top/act/musicbg.png"
        alt="Qingming activity background"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="relative z-10 flex min-h-screen flex-col justify-center py-10">
        <MusicPlayer />
      </div>
    </div>
  );
}
