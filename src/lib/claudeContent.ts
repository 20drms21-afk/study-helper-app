import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { UploadedFile } from "@/generated/prisma/client";
import { readStoredFile } from "@/lib/storage";
import { imageMediaType } from "@/lib/fileKind";

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
