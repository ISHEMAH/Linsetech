import { defineField, defineType } from "sanity";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({ name: "key", type: "string", options: { list: ["design", "web", "systems", "software", "hardware", "it"] }, validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", validation: (r) => r.required() }),
    defineField({ name: "order", type: "number" }),
    defineField({ name: "title", type: "localeString", validation: (r) => r.required() }),
    defineField({ name: "headline", type: "localeString" }),
    defineField({ name: "intro", type: "localeText" }),
    defineField({ name: "bullets", type: "array", of: [{ type: "localeString" }] }),
    defineField({
      name: "stats",
      type: "array",
      of: [{ type: "object", fields: [defineField({ name: "value", type: "string" }), defineField({ name: "label", type: "localeString" })] }],
    }),
    defineField({ name: "related", type: "array", of: [{ type: "reference", to: [{ type: "project" }] }] }),
    defineField({
      name: "faqs",
      type: "array",
      of: [{ type: "object", fields: [defineField({ name: "q", type: "localeString" }), defineField({ name: "a", type: "localeText" })] }],
    }),
    defineField({ name: "formation", type: "string", options: { list: ["grid", "ring", "stack", "wave", "cube", "line"] }, initialValue: "grid", description: "Tile formation in the chapter animation" }),
  ],
  preview: { select: { title: "title.en", subtitle: "key" } },
});
