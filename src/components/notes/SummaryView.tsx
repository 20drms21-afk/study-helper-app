import type {
  NoteContentType,
  SummaryContent,
  ExplanationContent,
} from "@/lib/prompts/summarize";

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
        <div className="columns-1 gap-6 sm:columns-2">
          {(content as SummaryContent).sections.map((section, i) => (
            <div
              key={i}
              className="mb-4 break-inside-avoid rounded-md border border-gray-200 p-4"
            >
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
          ))}
        </div>
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
