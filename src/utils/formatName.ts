/**
 * Capitalizes the first letter of each word in a name.
 * e.g. "john doe" → "John Doe"
 */
export const capitalizeName = (name: string): string =>
  name
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
