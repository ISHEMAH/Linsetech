import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";
import { isSanityConfigured } from "@/sanity/env";

export const dynamic = "force-static";
export const metadata = { title: "Linse Studio", robots: { index: false } };

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <main style={{ fontFamily: "system-ui", padding: 40, maxWidth: 640 }}>
        <h1>Sanity Studio is not configured yet</h1>
        <p>
          Create a project at sanity.io/manage, then set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and <code>NEXT_PUBLIC_SANITY_DATASET</code> in <code>.env.local</code> (see <code>.env.example</code>) and restart the server. Until then the site uses the content files in <code>src/content</code>.
        </p>
      </main>
    );
  }
  return <NextStudio config={config} />;
}
