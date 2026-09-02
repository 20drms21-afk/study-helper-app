import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { NoteContentType, SummaryContent, ExplanationContent } from "@/lib/prompts/summarize";
import { KOREAN_FONT_FAMILY, registerFonts } from "@/lib/pdf/fonts";
import { splitSectionsIntoColumns } from "@/lib/pdf/summaryLayout";

registerFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: KOREAN_FONT_FAMILY,
    fontSize: 10,
    padding: 24,
    color: "#111111",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  columns: {
    flexDirection: "row",
    gap: 16,
  },
  column: {
    flex: 1,
  },
  sectionBox: {
    marginBottom: 12,
    padding: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bulletDot: {
    width: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.4,
    marginTop: 4,
    color: "#333333",
  },
  explanationSection: {
    marginBottom: 16,
  },
  explanationHeading: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.7,
    marginBottom: 8,
  },
});

function SummarySectionBox({ section }: { section: SummaryContent["sections"][number] }) {
  return (
    <View style={styles.sectionBox} wrap={false}>
      <Text style={styles.sectionHeading}>{section.heading}</Text>
      {section.bullets.map((bullet, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
      {section.body && <Text style={styles.bodyText}>{section.body}</Text>}
    </View>
  );
}

export function SummaryNotePdf({
  title,
  type,
  content,
}: {
  title: string;
  type: NoteContentType;
  content: SummaryContent | ExplanationContent;
}) {
  if (type === "summary") {
    const sections = (content as SummaryContent).sections;
    const pages = splitSectionsIntoColumns(sections);

    return (
      <Document>
        {pages.map((page, pageIndex) => (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {pageIndex === 0 && <Text style={styles.title}>{title}</Text>}
            <View style={styles.columns}>
              <View style={styles.column}>
                {page.left.map((section, i) => (
                  <SummarySectionBox key={i} section={section} />
                ))}
              </View>
              <View style={styles.column}>
                {page.right.map((section, i) => (
                  <SummarySectionBox key={i} section={section} />
                ))}
              </View>
            </View>
          </Page>
        ))}
      </Document>
    );
  }

  const sections = (content as ExplanationContent).sections;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {sections.map((section, i) => (
          <View key={i} style={styles.explanationSection}>
            <Text style={styles.explanationHeading}>{section.heading}</Text>
            {section.body.split(/\n{2,}/).map((paragraph, j) => (
              <Text key={j} style={styles.paragraph}>
                {paragraph.trim()}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
