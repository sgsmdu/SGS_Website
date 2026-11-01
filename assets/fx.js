/* Rocket cursor with smoke trail. Smoke blows opposite to the direction you move. */
(function(){
  var ROCKET=true;                       // set false to hide the rocket and keep only the smoke
  if(matchMedia("(pointer:coarse)").matches||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  var c=document.createElement("canvas"),x=c.getContext("2d");
  c.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  c.setAttribute("aria-hidden","true");document.body.appendChild(c);
  var W,H,dpr=Math.min(devicePixelRatio||1,2);
  function size(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
  size();addEventListener("resize",size);
  var m={x:W/2,y:H/2,on:false},r={x:W/2,y:H/2,a:-Math.PI/4},ps=[],k=0;
  addEventListener("mousemove",function(e){m.x=e.clientX;m.y=e.clientY;m.on=true});
  document.addEventListener("mouseleave",function(){m.on=false});
  function tick(){
    x.clearRect(0,0,W,H);
    if(m.on){
      var px=r.x,py=r.y;
      r.x+=(m.x-r.x)*.18;r.y+=(m.y-r.y)*.18;          // rocket eases toward the cursor
      var vx=r.x-px,vy=r.y-py,sp=Math.hypot(vx,vy);
      if(sp>.3)r.a=Math.atan2(vy,vx);
      if(sp>.6){
        for(var i=0;i<Math.min(4,1+sp/6|0);i++){     // exhaust goes opposite to motion
          k++;
          ps.push({x:r.x-Math.cos(r.a)*14,y:r.y-Math.sin(r.a)*14,
            vx:-vx*.25+(Math.random()-.5)*1.4,vy:-vy*.25+(Math.random()-.5)*1.4,
            s:5+Math.random()*7,l:1,h:k%3?215:330});
        }
      }
    }
    x.globalCompositeOperation="lighter";
    for(var j=ps.length-1;j>=0;j--){
      var p=ps[j];p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.vx*=.97;p.s+=.35;p.l-=.022;
      if(p.l<=0){ps.splice(j,1);continue}
      var g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s);
      g.addColorStop(0,"hsla("+p.h+",95%,62%,"+(p.l*.45)+")");g.addColorStop(1,"hsla("+p.h+",95%,50%,0)");
      x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.s,0,6.283);x.fill();
    }
    x.globalCompositeOperation="source-over";
    if(ROCKET&&m.on){
      x.save();x.translate(r.x,r.y);x.rotate(r.a+Math.PI/4);
      x.shadowColor="#ff3d8b";x.shadowBlur=14;x.font="22px serif";x.textAlign="center";x.textBaseline="middle";
      x.fillText("\uD83D\uDE80",0,0);x.restore();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
