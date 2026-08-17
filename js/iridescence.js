/* ================================================================
   RRlab — js/iridescence.js

   Fundo animado "iridescente" em WebGL puro, sem dependências.
   Renderiza um triângulo de tela cheia com um shader procedural
   e expõe controles de cor/velocidade/amplitude/reação ao mouse.

   Uso:
     const fx = createIridescence(containerEl, {
       color: [r, g, b],   // 0..1
       speed: 1.0,
       amplitude: 0.1,
       mouseReact: false,
     });
     fx.destroy(); // remove canvas e listeners
================================================================ */

function createIridescence(container, options = {}) {
  const state = {
    color: options.color || [0.3, 0.2, 0.5],
    speed: options.speed ?? 1.0,
    amplitude: options.amplitude ?? 0.1,
    mouseReact: options.mouseReact ?? false,
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
    uniform vec3 uColor;
    uniform vec3 uResolution;
    uniform vec2 uMouse;
    uniform float uAmplitude;
    uniform float uSpeed;

    varying vec2 vUv;

    void main() {
      float mr = min(uResolution.x, uResolution.y);
      vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

      uv += (uMouse - vec2(0.5)) * uAmplitude;

      float d = -uTime * 0.5 * uSpeed;
      float a = 0.0;
      for (float i = 0.0; i < 8.0; ++i) {
        a += cos(i - d - a * uv.x);
        d += sin(uv.y * i + a);
      }
      d += uTime * 0.5 * uSpeed;
      vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
      col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
      gl_FragColor = vec4(col, 1.0);
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
    uTime: gl.getUniformLocation(program, 'uTime'),
    uColor: gl.getUniformLocation(program, 'uColor'),
    uResolution: gl.getUniformLocation(program, 'uResolution'),
    uMouse: gl.getUniformLocation(program, 'uMouse'),
    uAmplitude: gl.getUniformLocation(program, 'uAmplitude'),
    uSpeed: gl.getUniformLocation(program, 'uSpeed'),
  };

  const mouse = { x: 0.5, y: 0.5 };

  function resize() {
    const scale = window.devicePixelRatio || 1;
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

  let animationId;
  const start = performance.now();

  function render(now) {
    animationId = requestAnimationFrame(render);
    const time = (now - start) * 0.001;

    gl.useProgram(program);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform3f(uniforms.uColor, state.color[0], state.color[1], state.color[2]);
    gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y);
    gl.uniform1f(uniforms.uAmplitude, state.amplitude);
    gl.uniform1f(uniforms.uSpeed, state.speed);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  animationId = requestAnimationFrame(render);

  return {
    setColor(rgb) { state.color = rgb; },
    setSpeed(v) { state.speed = v; },
    setAmplitude(v) { state.amplitude = v; },
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
