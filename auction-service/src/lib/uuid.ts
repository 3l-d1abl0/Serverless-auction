// Custom UUID utility to replace uuid package
// This is ESM-compatible and avoids dynamic requires

/**
 * Generate a random UUID v4
 * Implementation based on https://stackoverflow.com/a/2117523
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Export as default to mimic uuid package
export default {
  v4: generateUUID
}; 