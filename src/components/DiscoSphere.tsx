'use client';
import { useEffect, useRef } from 'react';

const fragment = `precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform float energy;
uniform float beat;
uniform float warmth;
void main(){
 vec2 p=(gl_FragCoord.xy*2.-resolution)/min(resolution.x,resolution.y);
 vec3 cyan=vec3(.04,.88,1.), violet=vec3(.64,.17,1.), amber=vec3(1.,.46,.12);
 float r=length(p), radius=.58+beat*.012, safeR=max(r,.001);
 vec3 color=vec3(.006,.012,.028);

 // Ambiente de club: lavados amplios cyan/violeta y un toque ámbar cálido.
 float room=exp(-r*1.45);
 float sweepA=.5+.5*sin(time*.19+p.x*1.7-p.y*.7);
 float sweepB=.5+.5*sin(time*.13-p.x*1.1+p.y*1.4+1.8);
 color+=cyan*room*(.028+.045*sweepA);
 color+=violet*room*(.018+.032*sweepB);
 color+=amber*room*warmth*(.010+.05*beat);

 // Dos haces móviles salen visualmente desde la esfera y barren el escenario.
 vec2 stage=p-vec2(0.,-.05);
 float stageA=atan(stage.y,stage.x);
 float coneA=pow(max(cos(stageA-time*.20-.15),0.),30.)*exp(-r*.65);
 float coneB=pow(max(cos(stageA+time*.16+2.45),0.),34.)*exp(-r*.65);
 color+=mix(cyan,amber,warmth*.72)*coneA*(.022+.13*beat);
 color+=violet*coneB*(.018+.095*beat);

 if(r<radius){
   vec3 n=normalize(vec3(p/radius,sqrt(max(0.,1.-r*r/(radius*radius)))));
   vec3 l=normalize(vec3(-.7,.9,1.));
   float diffuse=max(dot(n,l),0.);
   float rim=pow(1.-n.z,3.);
   float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),65.);
   float longitude=atan(n.x,n.z)+time*.38;
   float bands=pow(.5+.5*sin(longitude*22.),18.)*pow(.5+.5*sin(n.y*26.),8.);
   float core=exp(-length(p-vec2(.07,-.03))*8.);
   color=vec3(.025,.055,.085)*(diffuse+.3)+cyan*rim*(.95+beat*.2);
   color+=mix(violet,cyan,n.y*.5+.5)*bands*(.68+beat*.18)+vec3(1.)*spec*(.82+beat*.26);
   color+=mix(cyan,amber,warmth*.55)*core*(.28+energy*.10+beat*.65);
 }

 float orbit=length(vec2(p.x,p.y*2.5+p.x*.65));
 color+=mix(cyan,violet,.5+.5*sin(time*.35+p.x*3.))*exp(-abs(orbit-.83)*180.)*(.72+beat*.18);
 float orbit2=length(vec2(p.x*2.2-p.y*.7,p.y));
 color+=mix(violet,amber,warmth*.35)*exp(-abs(orbit2-.92)*210.)*(.4+beat*.12);
 color+=cyan*exp(-abs(r-radius)*90.)*(.22+beat*.24);

 float a=atan(p.y,p.x);
 float halo=smoothstep(.62,.76,r)*(1.-smoothstep(.76,1.42,r));
 float beamA=pow(max(cos(a-time*.28),0.),34.)*halo;
 float beamB=pow(max(cos(a+time*.22+2.35),0.),38.)*halo;
 color+=mix(cyan,amber,warmth*.45)*beamA*(.018+energy*.075+beat*.16);
 color+=violet*beamB*(.012+energy*.055+beat*.12);
 float bounce=exp(-abs(r-(.95+.035*sin(time*.8)))*40.)*(.012+energy*.025+beat*.08);
 color+=mix(cyan,mix(violet,amber,warmth),.45)*bounce;

 // Rebote bajo: una franja suave da la sensación de que la luz golpea el vidrio.
 float floorGlow=exp(-abs(p.y+.72)*9.)*exp(-abs(p.x)*.65);
 color+=mix(cyan,amber,warmth*.58)*floorGlow*(.008+.055*beat);

 gl_FragColor=vec4(color,1.-smoothstep(.94,1.38,safeR));
}`;

export function DiscoSphere({ isPlaying = false, className = '' }: { isPlaying?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const playing = useRef(isPlaying);
  useEffect(() => { playing.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    const currentElement = canvas.current;
    if (!currentElement) return;
    const element: HTMLCanvasElement = currentElement;

    const currentGl = element.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    if (!currentGl) return;
    const gl: WebGLRenderingContext = currentGl;

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
    let beat: WebGLUniformLocation | null = null;
    let warmth: WebGLUniformLocation | null = null;
    let beatImpulse = 0;
    let beatWarmth = .18;
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
      beat = gl.getUniformLocation(program, 'beat');
      warmth = gl.getUniformLocation(program, 'warmth');
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
        const delta = last >= 0 ? Math.min((now - last) / 1000, .1) : 0;
        if (!reducedMotion && playing.current && last >= 0) elapsed += Math.min(delta, .05);
        else if (!reducedMotion && !playing.current && last >= 0) elapsed += Math.min(delta, .025);
        last = now;

        if (!playing.current) {
          beatImpulse = 0;
          beatWarmth += (.18 - beatWarmth) * .12;
        } else if (delta > 0) {
          beatImpulse *= Math.exp(-delta * 8.5);
          beatWarmth += (.18 - beatWarmth) * Math.min(1, delta * 1.6);
        }

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
        gl.uniform1f(beat, reducedMotion ? 0 : beatImpulse);
        gl.uniform1f(warmth, reducedMotion ? .18 : beatWarmth);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

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
      element.style.opacity = '0';
    }

    function handleContextRestored() {
      contextLost = false;
      if (setup()) startLoop();
    }

    function handleYouTubeBeat(event: Event) {
      const detail = (event as CustomEvent<{ strength?: number; warmth?: number }>).detail;
      beatImpulse = Math.max(beatImpulse, Math.min(1.15, detail?.strength ?? .72));
      beatWarmth = Math.max(.12, Math.min(1, detail?.warmth ?? .18));
      startLoop();
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
    window.addEventListener('lore:youtube-beat', handleYouTubeBeat as EventListener);

    if (setup()) startLoop();

    return () => {
      stopLoop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      motion.removeEventListener('change', handleMotionChange);
      element.removeEventListener('webglcontextlost', handleContextLost, false);
      element.removeEventListener('webglcontextrestored', handleContextRestored, false);
      window.removeEventListener('lore:youtube-beat', handleYouTubeBeat as EventListener);
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
