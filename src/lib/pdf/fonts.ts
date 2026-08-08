import path from "path";
import { Font } from "@react-pdf/renderer";

export const KOREAN_FONT_FAMILY = "NanumGothic";

let registered = false;

export function registerFonts() {
  if (registered) return;

  Font.register({
    family: KOREAN_FONT_FAMILY,
    fonts: [
      {
        src: path.join(process.cwd(), "public", "fonts", "NanumGothic-Regular.ttf"),
        fontWeight: "normal",
      },
      {
        src: path.join(process.cwd(), "public", "fonts", "NanumGothic-Bold.ttf"),
        fontWeight: "bold",
      },
    ],
  });

  // NanumGothic has no hyphenation dictionary for Korean; disable hyphenation
  // so long words/URLs don't get split with a "-" mid-syllable.
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
