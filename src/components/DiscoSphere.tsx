'use client';
import { useEffect, useRef } from 'react';

const fragment = `precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform float energy;
void main(){
 vec2 p=(gl_FragCoord.xy*2.-resolution)/min(resolution.x,resolution.y);
 vec3 cyan=vec3(.04,.88,1.), violet=vec3(.64,.17,1.);
 float r=length(p), radius=.58;
 vec3 color=vec3(.012,.018,.04);
 color+=mix(violet,cyan,.5+.5*sin(time*.15+p.x))*exp(-r*3.)*.18;
 if(r<radius){
   vec3 n=normalize(vec3(p/radius,sqrt(1.-r*r/(radius*radius))));
   vec3 l=normalize(vec3(-.7,.9,1.));
   float diffuse=max(dot(n,l),0.);
   float rim=pow(1.-n.z,3.);
   float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),65.);
   float longitude=atan(n.x,n.z)+time*.45;
   float bands=pow(.5+.5*sin(longitude*22.),18.)*pow(.5+.5*sin(n.y*26.),8.);
   float core=exp(-length(p-vec2(.07,-.03))*8.);
   color=vec3(.025,.055,.085)*(diffuse+.3)+cyan*rim*.95;
   color+=mix(violet,cyan,n.y*.5+.5)*bands*.7+vec3(1.)*spec*.85;
   color+=cyan*core*(.3+energy*.12*sin(time*2.));
 }
 float orbit=length(vec2(p.x,p.y*2.5+p.x*.65));
 float ring=exp(-abs(orbit-.83)*180.);
 color+=mix(cyan,violet,.5+.5*sin(time*.4+p.x*3.))*ring*.8;
 float orbit2=length(vec2(p.x*2.2-p.y*.7,p.y));
 color+=violet*exp(-abs(orbit2-.92)*210.)*.45;
 color+=cyan*exp(-abs(r-radius)*90.)*.25;
 gl_FragColor=vec4(color,1.-smoothstep(.92,1.35,r));
}`;

export function DiscoSphere({ isPlaying = false, className = '' }: { isPlaying?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const playing = useRef(isPlaying);
  useEffect(() => { playing.current = isPlaying; }, [isPlaying]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      shaders.push(shader); gl!.shaderSource(shader, source); gl!.compileShader(shader);
      return shader;
    }
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec2 position; void main(){ gl_Position=vec4(position,0.,1.); }'));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program); return;
    }
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program,'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const res = gl.getUniformLocation(program,'resolution'), t = gl.getUniformLocation(program,'time'), energy = gl.getUniformLocation(program,'energy');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, last = -100, visible = true, elapsed = 0;
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
    observer.observe(el);
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || now-last<33 || (motion.matches && last>=0)) return;
      if (playing.current && last >= 0) elapsed += Math.min((now-last)/1000,.05);
      last=now;
      const size = el.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio,1.5);
      const w=Math.max(1,Math.round(size.width*dpr)), h=Math.max(1,Math.round(size.height*dpr));
      if(el.width!==w || el.height!==h){ el.width=w;el.height=h;gl.viewport(0,0,w,h); }
      gl.uniform2f(res,w,h);gl.uniform1f(t,motion.matches?0:elapsed);gl.uniform1f(energy,playing.current?1:0);
      gl.drawArrays(gl.TRIANGLES,0,6);
    };
    frame=requestAnimationFrame(draw);
    const resize = () => { last=-100; };
    window.addEventListener('resize',resize);motion.addEventListener('change',resize);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize',resize);motion.removeEventListener('change',resize);gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program); };
  }, []);
  return <div className={`lore-orb ${isPlaying ? 'is-playing' : ''} ${className}`} aria-hidden="true"><div className="lore-orb-fallback"><div className="lore-orb-mirrors" /></div><canvas ref={canvas} /></div>;
}
