import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { projectId, dataset } from "./env";

const builder = projectId ? imageUrlBuilder({ projectId, dataset }) : null;

export const urlFor = (src: SanityImageSource | null | undefined, width = 1600) =>
  src && builder ? builder.image(src).width(width).auto("format").url() : null;
