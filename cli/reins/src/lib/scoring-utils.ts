export function countGoldenPrinciples(content: string): number {
  const headings = content.match(/^##\s+/gm)?.length || 0;
  const numbered = content.match(/^\d+\.\s+/gm)?.length || 0;
  return Math.max(headings, numbered);
}
