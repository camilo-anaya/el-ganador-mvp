export function isLocalDemoAdminRequest(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const host = new URL(request.url).hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
