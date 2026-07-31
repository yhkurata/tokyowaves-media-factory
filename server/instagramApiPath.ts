export function instagramApiPathSegments(
  rawPath: string | string[] | undefined,
  requestUrl: string | undefined,
) {
  if (Array.isArray(rawPath) && rawPath.length > 0) return rawPath;
  if (typeof rawPath === "string" && rawPath !== "") return [rawPath];

  const pathname = new URL(requestUrl ?? "/", "http://localhost").pathname;
  const prefix = "/api/instagram/";
  if (!pathname.startsWith(prefix)) return [];
  return pathname
    .slice(prefix.length)
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
}

