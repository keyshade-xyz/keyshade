import { existsSync, mkdir } from 'fs';
import { dirname, resolve } from 'path';

export async function ensureDirectoryExists(path: string): Promise<void> {
  const dir = dirname(resolve(path));
  if (!existsSync(dir)) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}