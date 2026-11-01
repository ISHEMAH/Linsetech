"use client";
import { useTranslations } from "next-intl";
import WorkChapter from "@/components/sections/WorkChapter";
import type { Project } from "@/content/work";
import WorkHeadline from "@/components/sections/work/WorkHeadline";
import ExhibitCursor from "@/components/sections/work/ExhibitCursor";
import WorkArchive from "@/components/sections/work/WorkArchive";
import CaseMotion from "@/components/sections/work/CaseMotion";

/**
 * /work: Puture's Work chapter with the home teaser's pacing (opening beat = the work-award headline over the floor,
 * one held beat per project, the pull-back), then it ends into the archive (filters + rows with a hover preview).
 * The chapter is the shared one, untouched: the headline, the exhibit cursor and the wave links sit around it.
 */
export default function WorkIndex({ projects }: { projects: Project[] }) {
  const t = useTranslations("workPage");
  const tc = useTranslations("workPage.categories");
  const fields = [...new Set(projects.map((p) => p.category))];
  const flagship = projects.find((p) => p.featured) ?? projects[0];

  return (
    <>
      <div className="relative">
        <WorkChapter projects={projects} chapter="work" compact handoff="none" />
        <WorkHeadline
          count={projects.length}
          label={t("index.label")}
          title={t("index.title")}
          highlight={t("index.highlight")}
          kicker={t("index.kicker")}
          about={t("index.about")}
          facts={[
            [t("index.factProjects"), String(projects.length).padStart(2, "0")],
            [t("index.factFields"), fields.map((f) => tc(f)).join(" · ")],
            [t("index.factFlagship"), flagship ? `${flagship.title} · ${flagship.result.value}` : "—"],
          ]}
          browse={t("index.browse")}
        />
        <ExhibitCursor label={t("cursor")} />
      </div>
      <CaseMotion>
        <WorkArchive projects={projects} index={String(projects.length + 1).padStart(2, "0")} />
      </CaseMotion>
    </>
  );
}
