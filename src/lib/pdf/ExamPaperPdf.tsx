import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ExamPaperPublic } from "@/lib/exam/types";
import { choiceLabel, answerBlankLines } from "@/lib/exam/formatters";
import { KOREAN_FONT_FAMILY, registerFonts } from "@/lib/pdf/fonts";

registerFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: KOREAN_FONT_FAMILY,
    fontSize: 10,
    padding: 40,
    color: "#111111",
  },
  header: {
    borderBottom: "2pt solid #111111",
    paddingBottom: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  meta: {
    fontSize: 10,
    color: "#444444",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    fontSize: 10,
  },
  question: {
    marginBottom: 14,
  },
  questionPrompt: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
  },
  choiceRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 12,
  },
  choiceLabel: {
    width: 18,
  },
  blankLine: {
    borderBottom: "0.5pt solid #999999",
    height: 18,
    marginBottom: 2,
  },
});

export function ExamPaperPdf({ paper }: { paper: ExamPaperPublic }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{paper.title}</Text>
          <Text style={styles.meta}>
            시험 시간: {paper.timeLimitMinutes}분 · 총점: {paper.totalPoints}점
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text>학번/이름: ______________________</Text>
          <Text>날짜: ______________________</Text>
        </View>

        {paper.questions.map((q, i) => {
          const blanks = answerBlankLines(q.type, q.points);
          return (
            <View key={q.id} style={styles.question} wrap={false}>
              <Text style={styles.questionPrompt}>
                {i + 1}. {q.prompt} [{q.points}점]
              </Text>

              {q.type === "mcq" &&
                q.choices?.map((choice, ci) => (
                  <View key={ci} style={styles.choiceRow}>
                    <Text style={styles.choiceLabel}>{choiceLabel(ci)}.</Text>
                    <Text>{choice}</Text>
                  </View>
                ))}

              {q.type !== "mcq" &&
                Array.from({ length: blanks }).map((_, li) => (
                  <View key={li} style={styles.blankLine} />
                ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
