import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/PageContainer";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Ndihmë — Thrifted" },
      { name: "description", content: "Pyetje të shpeshta dhe ndihmë për përdorimin e Thrifted." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    question: "Si mund të blej një produkt?",
    answer:
      "Gjeni produktin që ju pëlqen, zgjidhni mënyrën e blerjes (çmim fiks ose ofertë) dhe ndiqni hapat për të finalizuar transaksionin. Pronari do të njoftohet menjëherë.",
  },
  {
    question: "Si funksionon ofertimi?",
    answer:
      "Për produktet me ofertim, mund të dërgoni një çmim që jeni i gatshëm të paguani. Pronari mund ta pranojë ose refuzojë ofertën tuaj.",
  },
  {
    question: "Si shes një produkt?",
    answer:
      "Krijoni një llogari, klikoni butonin 'Shit' dhe plotësoni formularin me foto, detaje dhe çmim. Produkti juaj do të jetë i dukshëm për blerësit brenda pak minutash.",
  },
  {
    question: "A është e sigurt blerja?",
    answer:
      "Thrifted lidh përdoruesit direkt. Rekomandojmë të komunikoni qartë dhe të përdorni metoda pagese të sigurta. Lexoni vlerësimet e shitësit përpara se të blini.",
  },
];

function HelpPage() {
  return (
    <PageContainer narrow>
      <h1 className="mb-6 text-3xl font-semibold text-textPrimary">Ndihmë</h1>
      <div className="flex flex-col gap-5">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-lg border border-border bg-surface p-4 shadow-card">
            <h2 className="font-medium text-textPrimary">{faq.question}</h2>
            <p className="mt-2 text-sm text-textSecondary">{faq.answer}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
