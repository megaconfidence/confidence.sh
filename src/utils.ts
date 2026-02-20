/** Normalize a tag string into a URL-safe slug */
export function tagSlug(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-');
}
