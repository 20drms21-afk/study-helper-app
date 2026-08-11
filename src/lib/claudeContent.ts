import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { UploadedFile } from "@/generated/prisma/client";
import { readStoredFile } from "@/lib/storage";
import { imageMediaType } from "@/lib/fileKind";
import { extractPptx } from "@/lib/extract/pptx";

export type ContentBlocks = Extract<MessageParam["content"], unknown[]>;

export async function buildFileContentBlocks(
  file: UploadedFile,
  options?: { cache?: boolean }
): Promise<ContentBlocks> {
  let blocks: ContentBlocks;

  if (file.fileKind === "docx") {
    if (!file.extractedText) {
      throw new Error("문서에서 텍스트를 추출하지 못했습니다.");
    }
    blocks = [{ type: "text", text: file.extractedText }];
  } else if (file.fileKind === "pptx") {
    // pptx는 텍스트 하나로 안 끝나서(슬라이드 안 이미지도 봐야 함) 업로드 시점에 미리 뽑아
    // 저장해두지 않고, 매번 원본 파일을 다시 열어 텍스트+이미지 블록을 새로 구성한다.
    const buffer = await readStoredFile(file.storedPath);
    const { text, images } = await extractPptx(buffer);

    blocks = [];
    if (text) {
      blocks.push({ type: "text", text: `[PPTX 슬라이드 텍스트]\n${text}` });
    }
    for (const image of images) {
      const mediaType = imageMediaType(image.mimeType);
      if (!mediaType) continue;
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: image.data.toString("base64") },
      });
    }
    if (blocks.length === 0) {
      blocks = [{ type: "text", text: "(빈 PPTX 파일입니다.)" }];
    }
  } else {
    const buffer = await readStoredFile(file.storedPath);
    const base64 = buffer.toString("base64");

    if (file.fileKind === "pdf") {
      blocks = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
      ];
    } else {
      const mediaType = imageMediaType(file.mimeType);
      if (!mediaType) {
        throw new Error("지원하지 않는 이미지 형식입니다.");
      }

      blocks = [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
      ];
    }
  }

  if (options?.cache) {
    const lastBlock = blocks[blocks.length - 1] as unknown as {
      cache_control?: { type: "ephemeral" };
    };
    lastBlock.cache_control = { type: "ephemeral" };
  }

  return blocks;
}
