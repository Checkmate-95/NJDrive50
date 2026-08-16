export const config = {
  matcher: "/(.*)",
};

// ✅ All routes are public — no Basic Auth
export default function proxy(request: Request) {
  return; // no authentication check
}
