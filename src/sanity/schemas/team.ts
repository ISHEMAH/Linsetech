import { defineField, defineType } from "sanity";

export const teamMember = defineType({
  name: "teamMember",
  title: "Team member",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", type: "localeString" }),
    defineField({ name: "leadership", type: "boolean", initialValue: false }),
    defineField({ name: "order", type: "number" }),
    defineField({ name: "photo", type: "image", options: { hotspot: true } }),
    defineField({ name: "bio", type: "localeText" }),
    defineField({ name: "linkedin", type: "url" }),
  ],
  preview: { select: { title: "name", subtitle: "role.en", media: "photo" } },
});
