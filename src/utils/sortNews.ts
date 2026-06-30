import { NewsItem } from "../types";

const MONTHS: Record<string, number> = {
  janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
};

function parseFrenchDate(dateStr: string): Date {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTHS[parts[1]?.toLowerCase()] || 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month - 1, day);
  }
  return new Date(0);
}

export function sortNewsByDate(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const dateA = parseFrenchDate(a.date).getTime();
    const dateB = parseFrenchDate(b.date).getTime();
    if (isNaN(dateA) || isNaN(dateB)) return 0;
    return dateB - dateA;
  });
}
