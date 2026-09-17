'use client';
import { useEffect, useRef } from 'react';

const fragment = `precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform float energy;
void main(){
 vec2 p=(gl_FragCoord.xy*2.-resolution)/min(resolution.x,resolution.y);
 vec3 cyan=vec3(.04,.88,1.), violet=vec3(.64,.17,1.);
 float r=length(p), radius=.58, safeR=max(r,.001);
 vec3 color=vec3(.006,.012,.028);
 color+=mix(violet,cyan,.5+.5*sin(time*.12+p.x))*exp(-r*3.)*.14;
 if(r<radius){
   vec3 n=normalize(vec3(p/radius,sqrt(max(0.,1.-r*r/(radius*radius)))));
   vec3 l=normalize(vec3(-.7,.9,1.));
   float diffuse=max(dot(n,l),0.);
   float rim=pow(1.-n.z,3.);
   float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),65.);
   float longitude=atan(n.x,n.z)+time*.38;
   float bands=pow(.5+.5*sin(longitude*22.),18.)*pow(.5+.5*sin(n.y*26.),8.);
   float core=exp(-length(p-vec2(.07,-.03))*8.);
   color=vec3(.025,.055,.085)*(diffuse+.3)+cyan*rim*.95;
   color+=mix(violet,cyan,n.y*.5+.5)*bands*.68+vec3(1.)*spec*.82;
   color+=cyan*core*(.28+energy*.12*sin(time*2.));
 }
 float orbit=length(vec2(p.x,p.y*2.5+p.x*.65));
 color+=mix(cyan,violet,.5+.5*sin(time*.35+p.x*3.))*exp(-abs(orbit-.83)*180.)*.72;
 float orbit2=length(vec2(p.x*2.2-p.y*.7,p.y));
 color+=violet*exp(-abs(orbit2-.92)*210.)*.4;
 color+=cyan*exp(-abs(r-radius)*90.)*.22;

 // Dos haces baratos dentro del mismo shader: dan sensación de luz que sale,
 // toca el entorno y vuelve sin añadir partículas ni capas DOM pesadas.
 float a=atan(p.y,p.x);
 float halo=smoothstep(.62,.76,r)*(1.-smoothstep(.76,1.42,r));
 float beamA=pow(max(cos(a-time*.28),0.),34.)*halo;
 float beamB=pow(max(cos(a+time*.22+2.35),0.),38.)*halo;
 color+=cyan*beamA*(.018+energy*.095);
 color+=violet*beamB*(.012+energy*.07);
 float bounce=exp(-abs(r-(.95+.035*sin(time*.8)))*40.)*(.012+energy*.035);
 color+=mix(cyan,violet,.45)*bounce;

 gl_FragColor=vec4(color,1.-smoothstep(.94,1.38,safeR));
}`;

export function DiscoSphere({ isPlaying = false, className = '' }: { isPlaying?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const playing = useRef(isPlaying);
  useEffect(() => { playing.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    const gl = element.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    let frame = 0;
    let last = -100;
    let elapsed = 0;
    let visible = true;
    let contextLost = false;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let shaders: WebGLShader[] = [];
    let res: WebGLUniformLocation | null = null;
    let t: WebGLUniformLocation | null = null;
    let energy: WebGLUniformLocation | null = null;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');

    function destroyResources() {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      buffer = null;
      program = null;
      shaders = [];
    }

    function compile(type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      shaders.push(shader);
      return shader;
    }

    function setup() {
      destroyResources();
      const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 position; void main(){ gl_Position=vec4(position,0.,1.); }');
      const pixel = compile(gl.FRAGMENT_SHADER, fragment);
      if (!vertex || !pixel) return false;

      program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vertex);
      gl.attachShader(program, pixel);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      res = gl.getUniformLocation(program, 'resolution');
      t = gl.getUniformLocation(program, 'time');
      energy = gl.getUniformLocation(program, 'energy');
      element.style.opacity = '1';
      last = -100;
      return true;
    }

    function stopLoop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    function shouldRun() {
      return visible && !document.hidden && !contextLost && !!program;
    }

    function draw(now: number) {
      frame = 0;
      if (!shouldRun()) return;

      const reducedMotion = motion.matches;
      const interval = playing.current ? 33 : 66;
      if (now - last >= interval || reducedMotion) {
        if (!reducedMotion && playing.current && last >= 0) elapsed += Math.min((now - last) / 1000, .05);
        else if (!reducedMotion && !playing.current && last >= 0) elapsed += Math.min((now - last) / 1000, .025);
        last = now;

        const size = element.getBoundingClientRect();
        const mobile = Math.min(window.innerWidth, window.innerHeight) <= 700;
        const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25);
        const w = Math.max(1, Math.round(size.width * dpr));
        const h = Math.max(1, Math.round(size.height * dpr));
        if (element.width !== w || element.height !== h) {
          element.width = w;
          element.height = h;
          gl.viewport(0, 0, w, h);
        }

        gl.uniform2f(res, w, h);
        gl.uniform1f(t, reducedMotion ? 0 : elapsed);
        gl.uniform1f(energy, playing.current ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // En reduced-motion dibujamos una sola imagen y liberamos el loop.
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    }

    function startLoop() {
      if (!frame && shouldRun()) frame = requestAnimationFrame(draw);
    }

    function handleVisibility() {
      if (document.hidden) stopLoop();
      else {
        last = -100;
        startLoop();
      }
    }

    function handleMotionChange() {
      stopLoop();
      last = -100;
      startLoop();
    }

    function handleContextLost(event: Event) {
      event.preventDefault();
      contextLost = true;
      stopLoop();
      // Android puede liberar la GPU al cambiar de app. El fallback negro/neón
      // queda visible hasta que WebGL se restaure, evitando el flash blanco.
      element.style.opacity = '0';
    }

    function handleContextRestored() {
      contextLost = false;
      if (setup()) startLoop();
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) startLoop();
      else stopLoop();
    });

    observer.observe(element);
    document.addEventListener('visibilitychange', handleVisibility);
    motion.addEventListener('change', handleMotionChange);
    element.addEventListener('webglcontextlost', handleContextLost, false);
    element.addEventListener('webglcontextrestored', handleContextRestored, false);

    if (setup()) startLoop();

    return () => {
      stopLoop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      motion.removeEventListener('change', handleMotionChange);
      element.removeEventListener('webglcontextlost', handleContextLost, false);
      element.removeEventListener('webglcontextrestored', handleContextRestored, false);
      destroyResources();
    };
  }, []);

  return (
    <div className={`lore-orb ${isPlaying ? 'is-playing' : ''} ${className}`} aria-hidden="true">
      <div className="lore-orb-fallback"><div className="lore-orb-mirrors" /></div>
      <canvas ref={canvas} />
    </div>
  );
}
