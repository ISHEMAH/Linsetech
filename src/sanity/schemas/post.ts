import { defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "News · post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "localeString", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title.en" }, validation: (r) => r.required() }),
    defineField({ name: "category", type: "string", options: { list: ["company", "product", "hardware", "insights", "press"] }, validation: (r) => r.required() }),
    defineField({ name: "date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "featured", type: "boolean", initialValue: false }),
    defineField({ name: "author", type: "string", initialValue: "Linse" }),
    defineField({ name: "readTime", type: "number", initialValue: 3 }),
    defineField({ name: "excerpt", type: "localeText" }),
    defineField({ name: "cover", type: "image", options: { hotspot: true } }),
    defineField({ name: "body", type: "localeBlocks" }),
    defineField({ name: "pdf", type: "file", description: "Press release PDF (optional)" }),
  ],
  preview: { select: { title: "title.en", subtitle: "date", media: "cover" } },
});
