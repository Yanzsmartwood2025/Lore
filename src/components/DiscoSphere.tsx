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
 vec3 color=vec3(.006,.012,.028);

 // Ambiente de club: el bombo levanta toda la sala sin convertirla en un flash blanco.
 float room=exp(-r*1.35);
 float sweepA=.5+.5*sin(time*.19+p.x*1.7-p.y*.7);
 float sweepB=.5+.5*sin(time*.13-p.x*1.1+p.y*1.4+1.8);
 color+=cyan*room*(.032+.052*sweepA+.095*flash);
 color+=violet*room*(.020+.038*sweepB+.070*flash);
 color+=amber*room*warmth*(.012+.105*flash);

 // Lavados ambientales lentos: iluminan el fondo sin flashes agresivos.
 float washL=exp(-length(p-vec2(-.92,.18))*1.65);
 float washR=exp(-length(p-vec2(.96,-.08))*1.72);
 float washTop=exp(-length(p-vec2(.08,.92))*1.55);
 color+=cyan*washL*(.010+.030*sweepA+.046*flash);
 color+=violet*washR*(.008+.027*sweepB+.040*flash);
 color+=mix(cyan,amber,warmth*.42)*washTop*(.006+.020*energy+.034*flash);

 // Haces anchos que nacen desde el núcleo y golpean visualmente el escenario.
 vec2 stage=p-vec2(0.,-.05);
 float stageA=atan(stage.y,stage.x);
 float coneA=pow(max(cos(stageA-time*.20-.15),0.),30.)*exp(-r*.65);
 float coneB=pow(max(cos(stageA+time*.16+2.45),0.),34.)*exp(-r*.65);
 color+=mix(cyan,amber,warmth*.72)*coneA*(.026+.22*beat);
 color+=violet*coneB*(.020+.16*beat);
 float coneC=pow(max(cos(stageA-time*.11+1.58),0.),42.)*exp(-r*.72);
 float coneD=pow(max(cos(stageA+time*.09-1.18),0.),46.)*exp(-r*.75);
 color+=cyan*coneC*(.010+.085*beat);
 color+=mix(violet,amber,warmth*.34)*coneD*(.008+.072*beat);

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
   float innerPulse=exp(-r*4.7)*(.55+.45*sin(time*.86+latitude*2.4));
   float innerAngle=atan(p.y,p.x)+time*.31;
   float innerRibbon=pow(.5+.5*cos(innerAngle*3.0+sin(r*13.-time*.72)),7.)*exp(-r*2.7);
   float innerSpark=pow(.5+.5*sin(innerAngle*8.0-time*1.35),18.)*exp(-r*3.5);

   color=vec3(.025,.055,.085)*(diffuse+.3)+cyan*rim*(1.06+beat*.58);
   color+=mix(violet,cyan,n.y*.5+.5)*bands*(.76+beat*.38)+vec3(1.)*spec*(.90+beat*.50);
   color+=mix(cyan,amber,warmth*.55)*core*(.38+energy*.14+beat*1.12);
   color+=mix(cyan,violet,.42+.20*sin(time*.17))*innerPulse*(.10+.16*energy+.36*beat);
   color+=mix(violet,amber,warmth*.32)*innerRibbon*(.055+.10*energy+.20*beat);
   color+=cyan*innerSpark*(.025+.08*energy+.18*beat);

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
 float chase1b=pow(.5+.5*sin(ringA1*17.+time*3.15+1.4),22.);
 vec3 ringColor1=mix(cyan,violet,.5+.5*sin(ringA1*2.2+time*.36));
 float depth1=(r<radius && q1.y>.0)?.10:1.;
 color+=ringColor1*ring1*depth1*(.66+chase1*(.72+beat*1.28)+chase1b*(.22+beat*.38)+beat*.30);
 color+=mix(cyan,amber,warmth*.52)*ring1*(chase1+chase1b*.55)*depth1*(.10+beat*.72);

 // Anillo 2: gira en sentido contrario y a otra velocidad para que sea independiente.
 vec2 q2=rotate2(p,-time*.075+1.05);
 vec2 e2v=vec2(q2.x*2.2-q2.y*.7,q2.y);
 float orbit2=length(e2v);
 float ring2=exp(-abs(orbit2-.92)*205.);
 float ringA2=atan(e2v.y,e2v.x);
 float chase2=pow(.5+.5*sin(ringA2*13.+time*3.75+1.7),17.);
 float chase2b=pow(.5+.5*sin(ringA2*19.-time*2.65+.35),23.);
 vec3 ringColor2=mix(violet,amber,warmth*(.28+.32*beat));
 float depth2=(r<radius && q2.y<.0)?.12:1.;
 color+=ringColor2*ring2*depth2*(.48+chase2*(.60+beat*1.08)+chase2b*(.20+beat*.34)+beat*.24);
 color+=cyan*ring2*(chase2+chase2b*.48)*depth2*(.08+beat*.54);

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
 color+=mix(cyan,amber,warmth*.45)*beamA*(.020+energy*.075+beat*.22);
 color+=violet*beamB*(.014+energy*.055+beat*.17);
 float bounce=exp(-abs(r-(.95+.035*sin(time*.8)))*40.)*(.014+energy*.025+beat*.13);
 color+=mix(cyan,mix(violet,amber,warmth),.45)*bounce;

 // Cinturón de puntos exteriores: más luces girando, pero pequeñas y controladas.
 float outerTrack=exp(-abs(r-1.06)*72.);
 float outerSparkA=pow(.5+.5*sin(a*18.-time*3.15),18.);
 float outerSparkB=pow(.5+.5*sin(a*23.+time*2.35+1.2),22.);
 color+=cyan*outerTrack*outerSparkA*(.025+.055*energy+.13*beat);
 color+=mix(violet,amber,warmth*.30)*outerTrack*outerSparkB*(.018+.045*energy+.10*beat);

 // Rebotes laterales y bajos para que el vidrio de las tarjetas recoja la sala.
 float sideBounce=exp(-abs(abs(p.x)-.78)*10.)*exp(-abs(p.y+.20)*1.25);
 color+=mix(cyan,violet,.52)*sideBounce*(.004+.015*energy+.048*beat);

 // Rebote bajo que refuerza la sensación de vidrio en las tarjetas.
 float floorGlow=exp(-abs(p.y+.72)*9.)*exp(-abs(p.x)*.65);
 color+=mix(cyan,amber,warmth*.58)*floorGlow*(.010+.095*beat);

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
