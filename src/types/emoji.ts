export const CUSTOM_EMOJI_MAX_FILE_SIZE = 20 * 1024 * 1024;
export const CUSTOM_EMOJI_RENDER_SIZE = 80;

export interface CustomEmoji {
  key: string;
  name: string;
  url: string;
  size?: number;
  updatedAt?: string;
}
