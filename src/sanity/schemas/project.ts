import { defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Work · project",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "client", type: "string" }),
    defineField({ name: "tag", type: "string", description: "e.g. Fintech · Published product" }),
    defineField({
      name: "category",
      type: "string",
      options: { list: ["software", "web", "systems", "design", "hardware"] },
      validation: (r) => r.required(),
    }),
    defineField({ name: "year", type: "string" }),
    defineField({ name: "featured", type: "boolean", initialValue: false }),
    defineField({ name: "order", type: "number", description: "Position on the Work floor (lower first)" }),
    defineField({ name: "shape", type: "string", options: { list: ["landscape", "portrait", "kiosk"] }, initialValue: "landscape", description: "Card shape on the 3D floor" }),
    defineField({ name: "accent", type: "string", description: "Hex colour used when there is no cover" }),
    defineField({ name: "cover", type: "image", options: { hotspot: true } }),
    defineField({ name: "blurb", type: "localeText" }),
    defineField({ name: "summary", type: "localeText" }),
    defineField({ name: "url", type: "url" }),
    defineField({
      name: "result",
      type: "object",
      fields: [defineField({ name: "value", type: "string" }), defineField({ name: "label", type: "localeString" })],
    }),
    defineField({
      name: "stats",
      type: "array",
      of: [{ type: "object", fields: [defineField({ name: "value", type: "string" }), defineField({ name: "label", type: "localeString" })] }],
    }),
    defineField({
      name: "meta",
      type: "object",
      fields: [
        defineField({ name: "scope", type: "localeString" }),
        defineField({ name: "period", type: "string" }),
        defineField({ name: "role", type: "localeString" }),
        defineField({ name: "stack", type: "array", of: [{ type: "string" }] }),
      ],
    }),
    defineField({ name: "delivered", type: "array", of: [{ type: "localeText" }] }),
    defineField({
      name: "screens",
      type: "array",
      of: [{ type: "object", fields: [defineField({ name: "image", type: "image", options: { hotspot: true } }), defineField({ name: "caption", type: "localeString" })] }],
    }),
    defineField({
      name: "journey",
      type: "array",
      of: [{ type: "object", fields: [defineField({ name: "title", type: "localeString" }), defineField({ name: "text", type: "localeText" })] }],
    }),
    defineField({
      name: "engineering",
      type: "array",
      of: [{ type: "object", fields: [defineField({ name: "title", type: "localeString" }), defineField({ name: "text", type: "localeText" })] }],
    }),
  ],
  preview: { select: { title: "title", subtitle: "client", media: "cover" } },
});
