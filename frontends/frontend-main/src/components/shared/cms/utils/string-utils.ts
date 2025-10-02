/**
 * String utilities for CMS content type creation
 */

/**
 * Convert a display name to camelCase API ID
 * @param displayName The display name to convert
 * @returns camelCase string suitable for API ID
 */
export const toCamelCase = (displayName: string): string => {
  if (!displayName) return '';
  
  return displayName
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters except word chars and spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .split(' ')
    .map((word, index) => {
      const cleanWord = word.toLowerCase();
      return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    })
    .join('');
};

/**
 * Convert a singular word to its plural form using common English pluralization rules
 * @param singular The singular form
 * @returns The plural form
 */
export const pluralize = (singular: string): string => {
  if (!singular) return '';
  
  const word = singular.toLowerCase();
  
  // Irregular plurals
  const irregulars: Record<string, string> = {
    'child': 'children',
    'person': 'people',
    'man': 'men',
    'woman': 'women',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese',
    'ox': 'oxen',
    'sheep': 'sheep',
    'deer': 'deer',
    'fish': 'fish',
    'moose': 'moose',
    'series': 'series',
    'species': 'species',
    'data': 'data',
    'media': 'media'
  };
  
  if (irregulars[word]) {
    // Preserve the original case pattern
    if (singular === singular.toUpperCase()) {
      return irregulars[word].toUpperCase();
    }
    if (singular[0] === singular[0].toUpperCase()) {
      return irregulars[word].charAt(0).toUpperCase() + irregulars[word].slice(1);
    }
    return irregulars[word];
  }
  
  // Words ending in -s, -ss, -sh, -ch, -x, -z, -o
  if (word.match(/(s|ss|sh|ch|x|z)$/)) {
    return singular + 'es';
  }
  
  // Words ending in -o (but not -oo)
  if (word.endsWith('o') && !word.endsWith('oo')) {
    return singular + 'es';
  }
  
  // Words ending in consonant + y
  if (word.match(/[bcdfghjklmnpqrstvwxz]y$/)) {
    return singular.slice(0, -1) + 'ies';
  }
  
  // Words ending in -f or -fe
  if (word.endsWith('f')) {
    return singular.slice(0, -1) + 'ves';
  }
  
  if (word.endsWith('fe')) {
    return singular.slice(0, -2) + 'ves';
  }
  
  // Default: just add 's'
  return singular + 's';
};

/**
 * Validate display name format
 * @param displayName The display name to validate
 * @returns Validation result
 */
export const validateDisplayName = (displayName: string): string | boolean => {
  if (!displayName) return 'Display name is required';
  
  if (displayName.length < 2) {
    return 'Display name must be at least 2 characters';
  }
  
  if (displayName.length > 50) {
    return 'Display name cannot exceed 50 characters';
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(displayName)) {
    return 'Display name must contain at least one letter';
  }
  
  // Cannot start or end with special characters
  if (/^[^a-zA-Z0-9]|[^a-zA-Z0-9]$/.test(displayName)) {
    return 'Display name cannot start or end with special characters';
  }
  
  return true;
};

/**
 * Validate API ID format
 * @param apiId The API ID to validate
 * @returns Validation result
 */
export const validateApiId = (apiId: string): string | boolean => {
  if (!apiId) return 'API ID is required';
  
  if (!/^[a-z][a-zA-Z0-9]*$/.test(apiId)) {
    return 'API ID must start with lowercase letter and contain only letters and numbers';
  }
  
  if (apiId.length < 2) {
    return 'API ID must be at least 2 characters';
  }
  
  if (apiId.length > 30) {
    return 'API ID cannot exceed 30 characters';
  }
  
  return true;
};