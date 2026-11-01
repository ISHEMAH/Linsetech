import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "email", type: "string" }),
    defineField({ name: "supportEmail", type: "string" }),
    defineField({ name: "phone", type: "string" }),
    defineField({ name: "address", type: "array", of: [{ type: "string" }] }),
    defineField({
      name: "numbers",
      title: "Home · Numbers",
      type: "array",
      of: [{ type: "object", fields: [defineField({ name: "key", type: "string", options: { list: ["projects", "products", "devices", "uptime"] } }), defineField({ name: "value", type: "number" }), defineField({ name: "suffix", type: "string" })] }],
    }),
    defineField({ name: "hardwareBrands", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "partners", type: "array", of: [{ type: "object", fields: [defineField({ name: "name", type: "string" }), defineField({ name: "logo", type: "image" })] }] }),
    defineField({ name: "certifications", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "documents", type: "array", of: [{ type: "object", fields: [defineField({ name: "title", type: "localeString" }), defineField({ name: "file", type: "file" })] }] }),
    defineField({ name: "openRoles", type: "array", of: [{ type: "object", fields: [defineField({ name: "title", type: "localeString" }), defineField({ name: "type", type: "string" }), defineField({ name: "description", type: "localeText" })] }] }),
  ],
});
