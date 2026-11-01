import { defineField, defineType } from "sanity";

export const LOCALES = [
  { id: "en", title: "English", isDefault: true },
  { id: "fr", title: "Français" },
  { id: "rw", title: "Kinyarwanda" },
];

/** A string / text in the three site languages. English is required, the others fall back to it. */
export const localeString = defineType({
  name: "localeString",
  title: "Localised string",
  type: "object",
  fields: LOCALES.map((l) =>
    defineField({ name: l.id, title: l.title, type: "string", validation: l.isDefault ? (r) => r.required() : undefined }),
  ),
});

export const localeText = defineType({
  name: "localeText",
  title: "Localised text",
  type: "object",
  fields: LOCALES.map((l) => defineField({ name: l.id, title: l.title, type: "text", rows: 4 })),
});

export const localeBlocks = defineType({
  name: "localeBlocks",
  title: "Localised rich text",
  type: "object",
  fields: LOCALES.map((l) => defineField({ name: l.id, title: l.title, type: "array", of: [{ type: "block" }, { type: "image", options: { hotspot: true } }] })),
});
