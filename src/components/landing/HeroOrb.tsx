"use client";

import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle, Vec3 } from "ogl";

// Claude Design 목업(Landing.dc.html)의 히어로 오브젝트 셰이더를 그대로 이식.
// 라임그린 리퀴드 블롭이 천천히 회전·요동치는 애니메이션 — snoise3 기반 유기적 노이즈.
const VERTEX = `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;
  uniform float iTime;
  uniform vec3 iResolution;
  uniform float hover;
  uniform float rot;
  uniform float hoverIntensity;
  varying vec2 vUv;

  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
  }
  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(dot(d0,d0), dot(d1,d1), dot(d2,d2), dot(d3,d3)), 0.0);
    vec4 n = h*h*h*h*vec4(dot(d0,hash33(i)), dot(d1,hash33(i+i1)), dot(d2,hash33(i+i2)), dot(d3,hash33(i+1.0)));
    return dot(vec4(31.316), n);
  }
  vec4 extractAlpha(vec3 colorIn) {
    float a = max(max(colorIn.r, colorIn.g), colorIn.b);
    return vec4(colorIn.rgb / (a + 1e-5), a);
  }
  const vec3 baseColor1 = vec3(0.796, 1.0, 0.302);
  const vec3 baseColor2 = vec3(0.486, 0.596, 0.184);
  const vec3 baseColor3 = vec3(0.071, 0.063, 0.047);
  const float innerRadius = 0.6;
  const float noiseScale = 0.65;
  float light1(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * attenuation); }
  float light2(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * dist * attenuation); }
  vec4 draw(vec2 uv) {
    vec3 color1 = baseColor1;
    vec3 color2 = baseColor2;
    vec3 color3 = baseColor3;
    float ang = atan(uv.y, uv.x);
    float len = length(uv);
    float invLen = len > 0.0 ? 1.0 / len : 0.0;
    float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
    float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
    float d0 = distance(uv, (r0 * invLen) * uv);
    float v0 = light1(1.0, 10.0, d0);
    v0 *= smoothstep(r0 * 1.05, r0, len);
    float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
    float a = iTime * -1.0;
    vec2 pos = vec2(cos(a), sin(a)) * r0;
    float d = distance(uv, pos);
    float v1 = light2(1.5, 5.0, d);
    v1 *= light1(1.0, 50.0, d0);
    float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
    float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
    vec3 col = mix(color1, color2, cl);
    col = mix(color3, col, v0);
    col = (col + v1) * v2 * v3;
    col = clamp(col, 0.0, 1.0);
    return extractAlpha(col);
  }
  vec4 mainImage(vec2 fragCoord) {
    vec2 center = iResolution.xy * 0.5;
    float size = min(iResolution.x, iResolution.y);
    vec2 uv = (fragCoord - center) / size * 2.0;
    float angle = rot;
    float s = sin(angle);
    float c = cos(angle);
    uv = vec2(c*uv.x - s*uv.y, s*uv.x + c*uv.y);
    uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
    uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
    return draw(uv);
  }
  void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec4 col = mainImage(fragCoord);
    gl_FragColor = vec4(col.rgb * col.a, col.a);
  }
`;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * 히어로 섹션의 라이브 WebGL 블롭. 아래 경우엔 정적 이미지(`hero-blob.webp`)로 자동
 * 폴백한다 — prefers-reduced-motion, WebGL 컨텍스트 생성 실패, ogl 초기화 실패:
 * 예전에 @paper-design/shaders-react로 이 자리를 구현했다가 ResizeObserver/스태킹
 * 컨텍스트 이슈로 정적 이미지로 되돌렸던 이력이 있어(랜딩페이지 리디자인 메모리),
 * 실패 시 무조건 안전하게 정적 이미지가 보이도록 해둠.
 */
export function HeroOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    let rafId = 0;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let running = true;

    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        throw new Error("prefers-reduced-motion");
      }

      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      container.appendChild(gl.canvas);
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      gl.canvas.style.display = "block";

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          iTime: { value: 0 },
          iResolution: { value: new Vec3(1, 1, 1) },
          hover: { value: 0.42 },
          rot: { value: 0 },
          hoverIntensity: { value: 0.4 },
        },
      });
      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        program.uniforms.iResolution.value.set(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      };
      window.addEventListener("resize", resize);
      resize();
      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
      }

      let lastTime = 0;
      let currentRot = 0;
      let currentRotationSpeed = 0.34;
      let targetRotationSpeed = 0.34;
      let currentHover = 0.42;
      let targetHover = 0.42;
      let currentHoverIntensity = 0.4;
      let targetHoverIntensity = 0.4;
      let nextTargetChange = randomBetween(2.5, 6.0);
      let targetTimer = 0;
      const chooseNewTargets = () => {
        targetRotationSpeed = randomBetween(0.22, 0.48);
        targetHover = randomBetween(0.25, 0.6);
        targetHoverIntensity = randomBetween(0.25, 0.55);
        nextTargetChange = randomBetween(2.5, 6.0);
        targetTimer = 0;
      };

      const update = (t: number) => {
        rafId = requestAnimationFrame(update);
        if (!running) return;
        const dt = lastTime === 0 ? 0 : Math.min((t - lastTime) * 0.001, 0.05);
        lastTime = t;
        program.uniforms.iTime.value = t * 0.001;
        targetTimer += dt;
        if (targetTimer >= nextTargetChange) chooseNewTargets();
        const speedSmoothing = 1 - Math.exp(-dt * 1.1);
        const deformSmoothing = 1 - Math.exp(-dt * 0.85);
        currentRotationSpeed += (targetRotationSpeed - currentRotationSpeed) * speedSmoothing;
        currentHover += (targetHover - currentHover) * deformSmoothing;
        currentHoverIntensity += (targetHoverIntensity - currentHoverIntensity) * deformSmoothing;
        currentRot += dt * currentRotationSpeed;
        program.uniforms.rot.value = currentRot;
        program.uniforms.hover.value = currentHover;
        program.uniforms.hoverIntensity.value = currentHoverIntensity;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderer.render({ scene: mesh });
      };
      rafId = requestAnimationFrame(update);

      if ("IntersectionObserver" in window) {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            running = entries[0].isIntersecting;
          },
          { threshold: 0.1 }
        );
        intersectionObserver.observe(container);
      }

      return () => {
        running = false;
        window.removeEventListener("resize", resize);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        cancelAnimationFrame(rafId);
        try {
          if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
        } catch {
          // 이미 언마운트된 경우 무시
        }
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    } catch {
      // WebGL 컨텍스트 생성 실패/reduced-motion — 이펙트 실행 중 동기적으로 setState하면
      // react-hooks/set-state-in-effect 규칙에 걸리므로 마이크로태스크로 한 틱 미룸.
      queueMicrotask(() => setFailed(true));
      return;
    }
  }, []);

  if (failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/landing/hero-blob.webp"
        alt=""
        className="hero-orb h-full w-full select-none object-contain opacity-80"
      />
    );
  }

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}
