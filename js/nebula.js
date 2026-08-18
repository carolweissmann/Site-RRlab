/* ================================================================
   RRlab — js/nebula.js

   Fundo animado "nebulosa" em WebGL puro, sem dependências.
   Mesmo padrão de engine do js/iridescence.js (mesmo container,
   mesmo resize/DPR/reduced-motion/destroy), trocando só o shader:
   em vez de bandas iridescentes, gera nuvens orgânicas via ruído
   simplex 3D (fbm) + uma camada de partículas/estrelas por cima.

   Uso:
     const fx = createNebula(container, {
       colorDeep: [r, g, b],   // 0..1 — tom mais escuro (fundo)
       colorMid:  [r, g, b],   // 0..1 — corpo da nuvem
       colorGlow: [r, g, b],   // 0..1 — brilho de destaque
       speed: 1.0,
       mouseReact: true,
       stars: true,
     });
     fx.destroy(); // remove canvas e listeners
================================================================ */

function createNebula(container, options = {}) {
  const state = {
    colorDeep: options.colorDeep || [0.027, 0.035, 0.047],
    colorMid:  options.colorMid  || [0.118, 0.408, 0.510], // brand-blue
    colorGlow: options.colorGlow || [0.624, 0.463, 0.416], // brand-terra
    speed:     options.speed ?? 1.0,
    mouseReact: options.mouseReact ?? true,
    stars:     options.stars ?? true,
  };

  const vertexSrc = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSrc = `
    precision highp float;

    uniform float uTime;
    uniform vec3  uResolution;
    uniform vec2  uMouse;
    uniform float uSpeed;
    uniform float uStars;
    uniform vec3  uColorDeep;
    uniform vec3  uColorMid;
    uniform vec3  uColorGlow;

    varying vec2 vUv;

    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      float mr = min(uResolution.x, uResolution.y);
      vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

      vec2 mouseOffset = (uMouse - vec2(0.5)) * 0.12;
      vec3 p = vec3(uv * 1.5 + mouseOffset, uTime * 0.035 * uSpeed);

      float n  = fbm(p);
      float n2 = fbm(p * 2.1 + vec3(5.2, 1.3, uTime * 0.02 * uSpeed));

      float glow = smoothstep(0.05, 0.9, n * 0.5 + 0.5);
      vec3 color = mix(uColorDeep, uColorMid, glow);
      color = mix(color, uColorGlow, smoothstep(0.6, 1.0, n2 * 0.5 + 0.5) * 0.45);

      float vig = smoothstep(1.15, 0.25, length(uv));
      color *= vig;

      if (uStars > 0.5) {
        vec2 guv = uv * 22.0;
        vec2 cell = floor(guv);
        vec2 grid = fract(guv) - 0.5;
        float star = hash(cell);
        float twinkle = sin(uTime * (1.0 + star * 3.0) * uSpeed + star * 20.0) * 0.5 + 0.5;
        float dotStar = smoothstep(0.08, 0.0, length(grid)) * step(0.965, star) * twinkle;
        color += vec3(0.85, 0.9, 1.0) * dotStar * 1.1;
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.error('WebGL não suportado neste navegador.');
    return { destroy() {} };
  }

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSrc);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Erro ao linkar programa:', gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
  const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const positionLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  const uvLoc = gl.getAttribLocation(program, 'uv');
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    uTime:       gl.getUniformLocation(program, 'uTime'),
    uResolution: gl.getUniformLocation(program, 'uResolution'),
    uMouse:      gl.getUniformLocation(program, 'uMouse'),
    uSpeed:      gl.getUniformLocation(program, 'uSpeed'),
    uStars:      gl.getUniformLocation(program, 'uStars'),
    uColorDeep:  gl.getUniformLocation(program, 'uColorDeep'),
    uColorMid:   gl.getUniformLocation(program, 'uColorMid'),
    uColorGlow:  gl.getUniformLocation(program, 'uColorGlow'),
  };

  const mouse = { x: 0.5, y: 0.5 };

  function resize() {
    const rawScale = window.devicePixelRatio || 1;
    const scale = window.innerWidth < 768 ? Math.min(rawScale, 1.5) : rawScale;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform3f(uniforms.uResolution, canvas.width, canvas.height, canvas.width / canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  function handleMouseMove(e) {
    const rect = container.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
  }
  if (state.mouseReact) {
    container.addEventListener('mousemove', handleMouseMove);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let animationId;
  const start = performance.now();

  function drawFrame(now) {
    const time = (now - start) * 0.001;

    gl.useProgram(program);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y);
    gl.uniform1f(uniforms.uSpeed, state.speed);
    gl.uniform1f(uniforms.uStars, state.stars ? 1.0 : 0.0);
    gl.uniform3f(uniforms.uColorDeep, state.colorDeep[0], state.colorDeep[1], state.colorDeep[2]);
    gl.uniform3f(uniforms.uColorMid,  state.colorMid[0],  state.colorMid[1],  state.colorMid[2]);
    gl.uniform3f(uniforms.uColorGlow, state.colorGlow[0], state.colorGlow[1], state.colorGlow[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function render(now) {
    animationId = requestAnimationFrame(render);
    drawFrame(now);
  }

  if (prefersReducedMotion) {
    drawFrame(performance.now());
  } else {
    animationId = requestAnimationFrame(render);
  }

  return {
    setColors({ deep, mid, glow }) {
      if (deep) state.colorDeep = deep;
      if (mid)  state.colorMid  = mid;
      if (glow) state.colorGlow = glow;
    },
    setSpeed(v) { state.speed = v; },
    setStars(v) { state.stars = v; },
    setMouseReact(v) {
      state.mouseReact = v;
      container.removeEventListener('mousemove', handleMouseMove);
      if (v) container.addEventListener('mousemove', handleMouseMove);
    },
    destroy() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeChild(canvas);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    },
  };
}
