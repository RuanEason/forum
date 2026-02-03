import ffmpeg from "fluent-ffmpeg";
import path from "path";
import os from "os";
import { execSync } from "child_process";

export function initializeFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('Using system FFmpeg');
    return ffmpeg;
  } catch (e) {
    console.log('System FFmpeg not found, using npm package');
    
    const platform = os.platform();
    const arch = os.arch();
    let ffmpegPath: string;

    if (platform === 'win32' && arch === 'x64') {
      ffmpegPath = path.join(
        process.cwd(), 
        'node_modules', 
        '@ffmpeg-installer', 
        'win32-x64', 
        'ffmpeg.exe'
      );
    } else if (platform === 'linux' && arch === 'x64') {
      ffmpegPath = path.join(
        process.cwd(), 
        'node_modules', 
        '@ffmpeg-installer', 
        'linux-x64', 
        'ffmpeg'
      );
    } else if (platform === 'darwin' && arch === 'x64') {
      ffmpegPath = path.join(
        process.cwd(), 
        'node_modules', 
        '@ffmpeg-installer', 
        'darwin-x64', 
        'ffmpeg'
      );
    } else {
      throw new Error(`Unsupported platform: ${platform} ${arch}`);
    }
    
    ffmpeg.setFfmpegPath(ffmpegPath);
    return ffmpeg;
  }
}

export const ffmpegInstance = initializeFFmpeg();
