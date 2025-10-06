/**
 * Converts a string to title case (capitalizes first letter of each word)
 * @param str - The string to convert
 * @returns The title-cased string
 */
export function toTitleCase(str: string): string {
  return str.replace(/\b\w+/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Checks if a string looks like a date
 * @param str - The string to check
 * @returns True if the string appears to be a date
 */
function looksLikeDate(str: string): boolean {
  // Common date patterns
  const datePatterns = [
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/, // MM/DD/YYYY or similar
    /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/, // YYYY/MM/DD or similar
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i, // Month DD, YYYY
    /^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}$/i, // DD Month YYYY
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i, // Short month
  ];

  const trimmed = str.trim();
  return datePatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Extracts the first sentence from content blocks
 * @param content - Array of content blocks from Strapi
 * @returns The first sentence as a string
 */
export function extractFirstSentence(
  content: { type: string; children: { text: string }[] }[]
): string {
  if (!content || !Array.isArray(content)) return '';

  const sentencesFound: string[] = [];

  // Find paragraph blocks with text content
  for (const block of content) {
    if (block.type === 'paragraph' && block.children) {
      // Extract text from all children
      const fullText = block.children
        .map((child: { text: string }) => child.text || '')
        .join('')
        .trim();

      if (fullText) {
        // Split by sentence endings
        const sentences = fullText.match(/[^.!?]+[.!?]/g) || [];

        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim();
          // Skip if it looks like a date
          if (!looksLikeDate(trimmedSentence.replace(/[.!?]$/, ''))) {
            sentencesFound.push(trimmedSentence);
            // Return the first non-date sentence
            if (sentencesFound.length > 0) {
              return sentencesFound[0];
            }
          }
        }

        // If no proper sentences found but we have text, and it's not a date
        if (sentencesFound.length === 0 && !looksLikeDate(fullText)) {
          // Return first 150 characters
          return fullText.length > 150 ? fullText.substring(0, 150) + '...' : fullText;
        }
      }
    }
  }

  return '';
}
