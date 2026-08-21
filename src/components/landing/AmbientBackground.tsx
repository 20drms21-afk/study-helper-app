// Landing.dc.html 목업의 페이지 전체 배경 레이어 — 스크롤해도 움직이지 않는 fixed 블러 원 2개.
// 히어로 섹션 안의 HeroOrb(WebGL 셰이더)와는 별개로, 모든 섹션 뒤에 은은하게 깔리는 장식.
export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute -left-0 -top-[15%] h-[480px] w-[480px] rounded-full opacity-25 blur-[120px]"
        style={{ background: "#C2FF3D" }}
      />
      <div
        className="absolute -bottom-[15%] -right-[10%] h-[560px] w-[560px] rounded-full opacity-40 blur-[130px]"
        style={{ background: "#55642f" }}
      />
    </div>
  );
}
