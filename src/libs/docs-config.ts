import fs from 'fs';
import path from 'path';

/**
 * Type-safe config for docs.json.
 * Extend as needed for more fields.
 */
export interface DocsConfig {
  theme: string;
  name: string;
  colors: {
    primary: string;
    light?: string;
    dark?: string;
    [key: string]: unknown;
  };
  navigation: Record<string, unknown> | unknown[];
  [key: string]: unknown;
}

const CONFIG_PATH = path.resolve(process.cwd(), 'content/docs.json');

export function loadDocsConfig(): DocsConfig | null {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn('docs.json not found at', CONFIG_PATH);
    return null;
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse docs.json:', e);
    return null;
  }
}
