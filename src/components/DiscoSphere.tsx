'use client';
import { useEffect, useRef } from 'react';

const fragment = `precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform float energy;
uniform float beat;
uniform float warmth;

vec2 rotate2(vec2 v, float a){
 float c=cos(a), s=sin(a);
 return vec2(c*v.x-s*v.y,s*v.x+c*v.y);
}

void main(){
 vec2 p=(gl_FragCoord.xy*2.-resolution)/min(resolution.x,resolution.y);
 vec3 cyan=vec3(.04,.88,1.), violet=vec3(.64,.17,1.), amber=vec3(1.,.46,.12);
 float flash=beat*beat;
 float r=length(p), radius=.58+beat*.020, safeR=max(r,.001);
 float roomAngle=atan(p.y,p.x);
 vec3 color=vec3(.006,.012,.028);

 // Ambiente de club premium: luz amplia y móvil, sin flashes agresivos.
 float room=exp(-r*1.18);
 float sweepA=.5+.5*sin(time*.19+p.x*1.7-p.y*.7);
 float sweepB=.5+.5*sin(time*.13-p.x*1.1+p.y*1.4+1.8);
 float sweepC=.5+.5*sin(time*.10+roomAngle*2.0+r*1.9);
 float roomArc=pow(.5+.5*cos(roomAngle-time*.12),7.)*exp(-r*.72);
 color+=cyan*room*(.040+.060*sweepA+.105*flash);
 color+=violet*room*(.028+.046*sweepB+.078*flash);
 color+=mix(cyan,violet,sweepC)*roomArc*(.018+.085*energy+.090*beat);
 color+=amber*room*warmth*(.014+.112*flash);

 // Haces anchos que nacen desde el núcleo y golpean visualmente el escenario.
 vec2 stage=p-vec2(0.,-.05);
 float stageA=atan(stage.y,stage.x);
 float coneA=pow(max(cos(stageA-time*.20-.15),0.),30.)*exp(-r*.65);
 float coneB=pow(max(cos(stageA+time*.16+2.45),0.),34.)*exp(-r*.65);
 color+=mix(cyan,amber,warmth*.72)*coneA*(.026+.22*beat);
 color+=violet*coneB*(.020+.16*beat);

 if(r<radius){
   vec3 n=normalize(vec3(p/radius,sqrt(max(0.,1.-r*r/(radius*radius)))));
   vec3 l=normalize(vec3(-.7,.9,1.));
   float diffuse=max(dot(n,l),0.);
   float rim=pow(1.-n.z,3.);
   float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),65.);
   float longitude=atan(n.x,n.z)+time*.38;
   float latitude=asin(clamp(n.y,-1.,1.));
   float bands=pow(.5+.5*sin(longitude*22.),18.)*pow(.5+.5*sin(n.y*26.),8.);
   float core=exp(-length(p-vec2(.07,-.03))*8.);
   float deepCore=exp(-r*4.9);
   float hotCore=exp(-r*10.5);
   float innerBreath=.5+.5*sin(time*1.18);
   float innerOrbit=.5+.5*sin(longitude*4.0-latitude*2.5-time*1.7);

   color=vec3(.025,.055,.085)*(diffuse+.3)+cyan*rim*(1.06+beat*.56);
   color+=mix(violet,cyan,n.y*.5+.5)*bands*(.76+beat*.38)+vec3(1.)*spec*(.90+beat*.50);
   color+=mix(cyan,amber,warmth*.55)*core*(.34+energy*.12+beat*1.08);

   // Núcleo luminoso visible desde dentro: respira y cambia de tono con el ritmo.
   vec3 innerColor=mix(cyan,violet,.38+.34*innerOrbit);
   innerColor=mix(innerColor,amber,warmth*beat*.28);
   color+=innerColor*deepCore*(.10+.13*innerBreath+.32*energy+.44*beat);
   color+=mix(vec3(1.),cyan,.55)*hotCore*(.035+.12*innerBreath+.42*beat);

   // Matriz de puntos LED sobre la esfera. Los puntos se encienden por zonas y
   // cambian cyan/violeta/ámbar según la fase del beat.
   float ledLon=pow(.5+.5*cos(longitude*18.-time*.82),24.);
   float ledLat=pow(.5+.5*cos(latitude*15.+time*.30),20.);
   float leds=ledLon*ledLat;
   float ledWave=.5+.5*sin(longitude*3.6+latitude*4.2-time*2.0);
   vec3 ledColor=mix(cyan,violet,ledWave);
   ledColor=mix(ledColor,amber,warmth*beat*.46);
   color+=ledColor*leds*(.34+energy*.18+beat*1.55);
 }

 // Anillo 1: rotación propia, profundidad aparente y LEDs que corren por el contorno.
 vec2 q1=rotate2(p,time*.11);
 vec2 e1v=vec2(q1.x,q1.y*2.5+q1.x*.65);
 float orbit=length(e1v);
 float ring1=exp(-abs(orbit-.83)*185.);
 float ringA1=atan(e1v.y,e1v.x);
 float chase1=pow(.5+.5*sin(ringA1*11.-time*4.5),16.);
 vec3 ringColor1=mix(cyan,violet,.5+.5*sin(ringA1*2.2+time*.36));
 float depth1=(r<radius && q1.y>.0)?.10:1.;
 color+=ringColor1*ring1*depth1*(.64+chase1*(.70+beat*1.25)+beat*.30);
 color+=mix(cyan,amber,warmth*.52)*ring1*chase1*depth1*(.10+beat*.72);

 // Anillo 2: gira en sentido contrario y a otra velocidad para que sea independiente.
 vec2 q2=rotate2(p,-time*.075+1.05);
 vec2 e2v=vec2(q2.x*2.2-q2.y*.7,q2.y);
 float orbit2=length(e2v);
 float ring2=exp(-abs(orbit2-.92)*205.);
 float ringA2=atan(e2v.y,e2v.x);
 float chase2=pow(.5+.5*sin(ringA2*13.+time*3.75+1.7),17.);
 vec3 ringColor2=mix(violet,amber,warmth*(.28+.32*beat));
 float depth2=(r<radius && q2.y<.0)?.12:1.;
 color+=ringColor2*ring2*depth2*(.46+chase2*(.58+beat*1.05)+beat*.24);
 color+=cyan*ring2*chase2*depth2*(.08+beat*.52);

 // Anillo 3 fino: más luces girando sin recargar la escena.
 vec2 q3=rotate2(p,time*.052-.45);
 vec2 e3v=vec2(q3.x*1.55+q3.y*.48,q3.y*2.7);
 float orbit3=length(e3v);
 float ring3=exp(-abs(orbit3-1.04)*225.);
 float ringA3=atan(e3v.y,e3v.x);
 float chase3=pow(.5+.5*sin(ringA3*17.-time*3.05),20.);
 vec3 ringColor3=mix(cyan,violet,.5+.5*sin(ringA3*2.8-time*.24));
 color+=ringColor3*ring3*(.16+chase3*(.38+beat*.78));
 color+=mix(cyan,amber,warmth*.36)*ring3*chase3*(.03+beat*.25);

 // Corona LED exterior de la propia esfera: segmentos cortos que responden al bombo.
 float a=atan(p.y,p.x);
 float rimLine=exp(-abs(r-radius)*105.);
 float rimLed=pow(.5+.5*sin(a*26.-time*5.2),13.);
 vec3 rimColor=mix(cyan,violet,.5+.5*sin(a*3.+time*.5));
 rimColor=mix(rimColor,amber,warmth*beat*.36);
 color+=rimColor*rimLine*(.30+rimLed*(.36+beat*1.18)+beat*.38);

 float halo=smoothstep(.62,.76,r)*(1.-smoothstep(.76,1.42,r));
 float beamA=pow(max(cos(a-time*.28),0.),34.)*halo;
 float beamB=pow(max(cos(a+time*.22+2.35),0.),38.)*halo;
 float beamC=pow(max(cos(a-time*.13+4.25),0.),42.)*halo;
 color+=mix(cyan,amber,warmth*.45)*beamA*(.026+energy*.082+beat*.24);
 color+=violet*beamB*(.020+energy*.064+beat*.19);
 color+=mix(cyan,violet,.42)*beamC*(.010+energy*.045+beat*.12);
 float bounce=exp(-abs(r-(.95+.035*sin(time*.8)))*40.)*(.014+energy*.025+beat*.13);
 color+=mix(cyan,mix(violet,amber,warmth),.45)*bounce;

 // Rebote bajo que refuerza la sensación de vidrio en las tarjetas.
 float floorGlow=exp(-abs(p.y+.72)*8.)*exp(-abs(p.x)*.58);
 color+=mix(cyan,amber,warmth*.58)*floorGlow*(.014+.11*beat);

 // La sala completa conserva un brillo muy tenue para que los rebotes alcancen
 // los extremos del Home incluso en pantallas anchas.
 float edgeRoom=exp(-r*.58)*(.006+.013*energy+.010*beat);
 color+=mix(cyan,violet,.48)*edgeRoom;

 gl_FragColor=vec4(color,1.0);
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
          beatImpulse *= Math.exp(-delta * 7.2);
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
      beatImpulse = Math.max(beatImpulse, Math.min(1.35, (detail?.strength ?? .72) * 1.14));
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
