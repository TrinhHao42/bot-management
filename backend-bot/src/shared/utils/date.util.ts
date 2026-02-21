export function parseRelativeDate(dateStr: string): Date {
  const text = dateStr.toLowerCase().trim();
  const now = new Date();

  if (text.includes('hôm nay') || text.includes('vừa xong') || text.includes('giờ trước') || text.includes('phút trước')) {
    return now;
  }

  if (text.includes('hôm qua')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  const daysAgoMatch = text.match(/(\d+)\s*(days? ago|ngày trước)/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  }

  const weeksAgoMatch = text.match(/(\d+)\s*(weeks? ago|tuần trước)/);
  if (weeksAgoMatch) {
    const weeks = parseInt(weeksAgoMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() - weeks * 7);
    return d;
  }

  // Handle standard "dd-mm-yyyy" or "dd/mm/yyyy"
  const dateMatch = text.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(dateMatch[3], 10);
    return new Date(year, month, day);
  }

  return now; // Fallback to now if unparseable
}

export function isWithinLastNDays(date: Date, n: number = 7): boolean {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= n;
}
