import { TranslateUploadForm } from "@/components/translate/TranslateUploadForm";

export default function NewTranslatePage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-bold">PDF 영어자료 변환</h1>
      <p className="mt-1 text-sm text-gray-600">
        영어 PDF와 과목명을 입력하면 원본 레이아웃을 유지한 한글 번역본을 만들어드려요. 무료
        플랜은 5페이지, Pro 플랜은 60페이지까지 변환됩니다.
      </p>
      <div className="mt-6">
        <TranslateUploadForm />
      </div>
    </div>
  );
}
