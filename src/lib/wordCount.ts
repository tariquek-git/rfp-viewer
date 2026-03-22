export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function getWordCountColor(count: number, limits = { green: 150, yellow: 250 }): "green" | "yellow" | "red" {
  if (count <= limits.green) return "green";
  if (count <= limits.yellow) return "yellow";
  return "red";
}

export function getWordCountClasses(color: "green" | "yellow" | "red"): string {
  switch (color) {
    case "green": return "text-emerald-600 bg-emerald-50";
    case "yellow": return "text-amber-600 bg-amber-50";
    case "red": return "text-red-600 bg-red-50";
  }
}
