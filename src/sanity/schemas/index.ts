import { localeString, localeText, localeBlocks } from "./locale";
import { project } from "./project";
import { post } from "./post";
import { service } from "./service";
import { teamMember } from "./team";
import { siteSettings } from "./settings";

export const schemaTypes = [localeString, localeText, localeBlocks, project, post, service, teamMember, siteSettings];
