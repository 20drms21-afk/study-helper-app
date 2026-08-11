import type {
  NoteContentType,
  SummaryContent,
  ExplanationContent,
} from "@/lib/prompts/summarize";
import { splitSectionsForWeb } from "@/lib/notes/summaryColumns";

function SectionCard({ section }: { section: SummaryContent["sections"][number] }) {
  return (
    <div className="mb-4 rounded-md p-4">
      <h3 className="mb-2 font-semibold">{section.heading}</h3>
      {section.bullets.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
          {section.bullets.map((bullet, j) => (
            <li key={j}>{bullet}</li>
          ))}
        </ul>
      )}
      {section.body && (
        <p className="mt-2 text-sm leading-relaxed text-gray-700">{section.body}</p>
      )}
    </div>
  );
}

export function SummaryView({
  content,
  type,
}: {
  content: SummaryContent | ExplanationContent;
  type: NoteContentType;
}) {
  return (
    <div className="mx-auto w-full max-w-[794px] rounded-sm bg-white p-12 shadow-md ring-1 ring-gray-200">
      <h2 className="mb-6 text-lg font-bold">{content.title}</h2>

      {type === "summary" ? (
        (() => {
          const { left, right } = splitSectionsForWeb((content as SummaryContent).sections);
          return (
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="min-w-0 flex-1">
                {left.map((section, i) => (
                  <SectionCard key={i} section={section} />
                ))}
              </div>
              {right.length > 0 && (
                <div className="min-w-0 flex-1">
                  {right.map((section, i) => (
                    <SectionCard key={i} section={section} />
                  ))}
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="space-y-8">
          {(content as ExplanationContent).sections.map((section, i) => (
            <div key={i}>
              <h3 className="mb-2 text-base font-semibold">{section.heading}</h3>
              {section.body.split(/\n{2,}/).map((paragraph, j) => (
                <p key={j} className="mb-3 text-[15px] leading-8 text-gray-800">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
