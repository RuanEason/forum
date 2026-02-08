declare module "fluent-ffmpeg" {
  type FfmpegEvent = "end" | "error";

  interface FfmpegCommand {
    size(size: string): FfmpegCommand;
    videoBitrate(bitrate: string): FfmpegCommand;
    videoCodec(codec: string): FfmpegCommand;
    audioCodec(codec: string): FfmpegCommand;
    outputOptions(options: string[]): FfmpegCommand;
    format(format: string): FfmpegCommand;
    on(event: "end", listener: () => void): FfmpegCommand;
    on(event: "error", listener: (error: Error) => void): FfmpegCommand;
    on(event: FfmpegEvent, listener: (...args: unknown[]) => void): FfmpegCommand;
    save(path: string): void;
  }

  interface FfmpegFactory {
    (input?: string): FfmpegCommand;
    setFfmpegPath(path: string): void;
  }

  const ffmpeg: FfmpegFactory;
  export default ffmpeg;
}
