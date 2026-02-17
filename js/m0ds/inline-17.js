
/* ==========================================================================
   ORB WebGL (shader nebula) + Partículas 2D — escopo HUB
   ========================================================================== */
(function(){
  const canvas = document.getElementById('orb');
  if(!canvas) return;
  const gl = canvas.getContext('webgl', { antialias:true, alpha:true });
  if(!gl) return;

  const dpr = Math.min(2, window.devicePixelRatio||1);
  function resize(){
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.floor(r.width*dpr);
    canvas.height = Math.floor(r.height*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const vs = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv=aPos*0.5+0.5; gl_Position=vec4(aPos,0.,1.);}';
  const fs = `precision highp float; varying vec2 vUv; uniform vec2 u_res; uniform float u_time; uniform float u_active;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
  float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); float a=hash(i);
    float b=hash(i+vec2(1.,0.)); float c=hash(i+vec2(0.,1.)); float d=hash(i+vec2(1.,1.));
    vec2 u=f*f*(3.-2.*f); return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y; }
  vec3 cam(){ return vec3(0.,0.,3.); }
  vec3 getRay(vec2 uv){ uv=(uv*2.-1.); uv.x*=u_res.x/u_res.y; return normalize(vec3(uv,-1.8)); }
  bool isph(vec3 ro, vec3 rd, float r, out float t){
    float b=dot(ro,rd); float c=dot(ro,ro)-r*r; float h=b*b-c; if(h<0.){t=-1.;return false;}
    h=sqrt(h); t=-b-h; if(t<0.) t=-b+h; if(t<0.) return false; return true; }
  void main(){
    vec2 uv=vUv; vec3 ro=cam(); vec3 rd=getRay(uv);
    float t; vec3 col=vec3(0.02,0.03,0.07); vec3 fogCol=vec3(0.07,0.09,0.16);
    float g=noise(uv*6.+u_time*0.05)*0.25; col+=vec3(0.25,0.08,0.55)*g*0.6+vec3(0.0,0.35,0.55)*g*0.4;
    if(isph(ro,rd,1.,t)){
      vec3 p=ro+rd*t; vec3 n=normalize(p);
      float bands=0.5+0.5*sin(6.*p.x+5.*p.y+u_time*0.6);
      float swirl=noise(p.xy*4.+u_time*0.2);
      vec3 A=vec3(0.52,0.24,1.00), B=vec3(0.00,0.90,1.00);
      vec3 base=mix(A,B, clamp(bands*0.6+swirl*0.4,0.,1.));
      vec3 L=normalize(vec3(0.6,0.7,0.5));
      float diff=max(dot(n,L),0.); float rim=pow(1.-max(dot(n,-rd),0.), 2.);
      float pulse=0.5+0.5*sin(u_time*1.5); float act=mix(0.6,1.0,u_active);
      vec3 c=base*(0.35+0.75*diff*act)+(B*0.6+A*0.4)*rim*(0.6+0.4*pulse);
      float fogAmt=1.0-exp(-t*0.35); col=mix(c,fogCol,fogAmt*0.25);
    }else{
      vec2 centered=uv-0.5; centered.x*=u_res.x/u_res.y;
      float d=length(centered); float outer=smoothstep(0.58,0.12,d);
      vec3 halo=vec3(0.25,0.12,0.55)*outer*0.35+vec3(0.00,0.55,0.95)*outer*0.25;
      col+=halo;
    }
    float vign=smoothstep(1.2,0.55, length((uv-0.5)*vec2(u_res.x/u_res.y,1.)));
    col*=vign; gl_FragColor=vec4(col,0.98);
  }`;
  function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; }
  const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1, 1,-1,1,1,-1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uRes=gl.getUniformLocation(pr,'u_res'); const uTime=gl.getUniformLocation(pr,'u_time'); const uActive=gl.getUniformLocation(pr,'u_active');
  let start=performance.now(), active=0.0;
  function draw(){ const t=(performance.now()-start)*0.001; gl.uniform2f(uRes,canvas.width,canvas.height); gl.uniform1f(uTime,t); gl.uniform1f(uActive,active); gl.drawArrays(gl.TRIANGLES,0,6); requestAnimationFrame(draw) }
  draw();
  window.__orbGL__ = {
    setActive:(v)=>{ active=v?1.0:0.0; },
    pulse:()=>{ let k=0,steps=24; const id=setInterval(()=>{ active=Math.min(1,active+0.06); if(++k>=steps) clearInterval(id);},16);
                setTimeout(()=>{ let j=0; const id2=setInterval(()=>{ active=Math.max(0,active-0.06); if(++j>=steps) clearInterval(id2);},16);},380); }
  };
})();

(function particles2D(){
  const c=document.getElementById('particles'); if(!c) return;
  const ctx=c.getContext('2d'); const dpr=Math.min(2,window.devicePixelRatio||1);
  function rs(){ const r=c.getBoundingClientRect(); c.width=Math.floor(r.width*dpr); c.height=Math.floor(r.height*dpr); }
  new ResizeObserver(rs).observe(c); rs();
  const N=90, nodes=Array.from({length:N},()=>({a:Math.random()*6.283, r:0.42+Math.random()*0.48, s:(0.2+Math.random()*0.7)*(Math.random()<0.5?-1:1), z:0.5+Math.random()*0.5, hue:200+Math.random()*160}));
  function draw(t){ ctx.clearRect(0,0,c.width,c.height); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(c.width/2,c.height/2); const scale=Math.min(c.width,c.height)/2;
    for(const n of nodes){
      const a=n.a + t*0.00025*n.s, r=n.r + 0.03*Math.sin(t*0.0005+n.a);
      const x=Math.cos(a)*r*scale, y=Math.sin(a)*r*scale;
      const g=ctx.createRadialGradient(x,y,0, x,y, 6 + n.z*8);
      g.addColorStop(0, `hsla(${n.hue}, 85%, 65%, ${0.38*n.z})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y, 2.5 + n.z*3.0, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore(); requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

// Pulsar no clique direto no wrap
document.getElementById('orbWrap')?.addEventListener('click', function(){ try{ window.__orbGL__ && window.__orbGL__.pulse(); }catch(_){ } });
