import ffmpeg from "fluent-ffmpeg";
import { execSync } from "child_process";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

export function initializeFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('Using system FFmpeg');
    return ffmpeg;
  } catch (e) {
    console.log('System FFmpeg not found, using npm package');

    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    return ffmpeg;
  }
}

export const ffmpegInstance = initializeFFmpeg();
