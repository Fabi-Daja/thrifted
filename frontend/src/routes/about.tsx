import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/PageContainer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Rreth nesh — Thrifted" },
      { name: "description", content: "Mëso më shumë për Thrifted, tregun e modës second-hand në Shqipëri." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageContainer narrow>
      <h1 className="mb-4 text-3xl font-semibold text-textPrimary">Rreth Thrifted</h1>
      <div className="flex flex-col gap-4 text-textSecondary">
        <p>
          Thrifted është tregu i modës së përdorur me shpirt. Misioni ynë është të japim rrobave një jetë të re,
          duke i lidhur shitësit dhe blerësit në një komunitet që vlerëson cilësinë, qëndrueshmërinë dhe
          individualitetin.
        </p>
        <p>
          Çdo copë që shitet përmes platformës sonë është një hap drejt një konsumi më të vetëdijshëm. Në vend që
          veshjet e mira të mbyllen në dollap ose të hidhen, ne u japim mundësinë të gjejnë një shtëpi të re.
        </p>
        <p>
          Pavarësisht nëse kërkon një xhaketë vintage, një palë këpucë dizajneri ose thjesht diçka unike për
          garderobën tënde, në Thrifted do të gjesh artikuj të kuruar me kujdes nga përdorues si ti.
        </p>
      </div>
    </PageContainer>
  );
}
