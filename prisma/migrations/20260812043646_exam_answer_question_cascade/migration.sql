-- ExamAnswer.questionId 외래키가 ON DELETE RESTRICT라서, 시험을 한 번이라도 응시한 뒤
-- 그 시험(ExamConfig)을 삭제하면 ExamPaper -> ExamQuestion cascade 도중 아직 남아있는
-- ExamAnswer 행 때문에 FK 위반으로 삭제가 실패했다. ON DELETE CASCADE로 바꿔서
-- ExamQuestion이 지워질 때 그 문제에 달린 ExamAnswer도 함께 정리되게 한다.
ALTER TABLE "ExamAnswer" DROP CONSTRAINT "ExamAnswer_questionId_fkey";
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
