"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemas";
import { projectId, dataset } from "./src/sanity/env";

export default defineConfig({
  name: "linse",
  title: "Linse",
  basePath: "/studio",
  projectId: projectId || "missing-project-id",
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem().title("Site settings").child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.documentTypeListItem("project").title("Work"),
            S.documentTypeListItem("service").title("Services"),
            S.documentTypeListItem("post").title("News"),
            S.documentTypeListItem("teamMember").title("Team"),
          ]),
    }),
  ],
});
