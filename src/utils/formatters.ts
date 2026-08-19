// Format seconds to mm:ss or hh:mm:ss
export function formatDuration(seconds: number | undefined): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

// Format numbers to 1.2K, 3.4M
export function formatNumber(num: number | undefined): string {
  if (!num || isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// Debounce helper function
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
