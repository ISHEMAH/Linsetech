import { createClient } from "next-sanity";
import { projectId, dataset, apiVersion, isSanityConfigured } from "./env";

export const client = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: true, perspective: "published" })
  : null;
