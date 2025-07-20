export function buildInfiniteScrollQuery(pageParam: Record<string, string> | null) {
  return pageParam
    ? Object.entries(pageParam)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&")
    : "";
}
