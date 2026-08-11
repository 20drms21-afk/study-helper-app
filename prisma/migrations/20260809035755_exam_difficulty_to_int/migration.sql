-- 난이도를 easy/medium/hard 3단계 대신 기출문제 반영도와 같은 0~10 스케일로 바꿈.
-- 기존 문자열 값을 버리지 않고 숫자로 매핑해서 데이터 손실 없이 전환한다.
ALTER TABLE "ExamConfig" ALTER COLUMN "difficulty" DROP DEFAULT;
ALTER TABLE "ExamConfig" ALTER COLUMN "difficulty" TYPE INTEGER USING (
  CASE "difficulty"
    WHEN 'easy' THEN 2
    WHEN 'hard' THEN 8
    ELSE 5
  END
);
ALTER TABLE "ExamConfig" ALTER COLUMN "difficulty" SET DEFAULT 5;
