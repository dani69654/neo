import * as fs from 'fs';
import * as path from 'path';

const IMAGE_EXT = '(?:jpg|jpeg|png|webp)';

function stripTrailingPunctuation(text: string): string {
  return text.trim().replace(/[?.!]+$/, '').trim();
}

/** Matches a single path token ending in an image extension. */
const PATH_TOKEN = String.raw`(\S+\.${IMAGE_EXT})`;

/**
 * Extracts an image file path from free text, e.g. "who is in photo.png"
 * or "who is /Users/me/photo.jpg".
 * Returns null when no image path is found.
 */
export function extractImagePath(text: string): string | null {
  const trimmed = stripTrailingPunctuation(text);

  const patterns = [
    new RegExp(`^who is(?: this| that| in)?\\s+${PATH_TOKEN}$`, 'i'),
    new RegExp(`^(?:recognize|identify)(?: face in)?\\s+${PATH_TOKEN}$`, 'i'),
    new RegExp(`^${PATH_TOKEN}$`, 'i'),
    // Absolute path anywhere in the sentence (avoid greedy "who is …" false positives).
    new RegExp(`(/\\S+\\.${IMAGE_EXT})`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return path.resolve(match[1].trim());
    }
  }

  return null;
}

/** Returns true when the text mentions a recognizable face command with an image path. */
export function detectRecognizeFace(text: string): boolean {
  return extractImagePath(text) !== null;
}

/** Returns a clear error when the image file is missing. */
export function requireImageFile(imagePath: string): void {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }
}
