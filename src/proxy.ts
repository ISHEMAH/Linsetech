import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, the Sanity studio, Next internals, metadata image routes and static files.
  matcher: ["/((?!api|studio|_next|_vercel|.*opengraph-image|.*twitter-image|icon|apple-icon|.*\\..*).*)"],
};
