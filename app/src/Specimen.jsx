import React, { useEffect, useRef } from 'react';

// Draw the lab's beetle on an isometric grid. Each column has three lit faces.
export default function Specimen() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = 410, height = 220;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);
    const project = (x, y, z = 0) => [210 + (x - y) * 10.8, 132 + (x + y) * 4.8 - z * 11.5];
    function path(points, fill, stroke) {
      ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    }
    for (let i = -17; i <= 17; i++) {
      path([project(i, -17), project(i, 17)], null, '#a4ed9e18');
      path([project(-17, i), project(17, i)], null, '#a4ed9e18');
    }
    path([project(-6,-7),project(7,-7),project(7,7),project(-6,7),project(-6,-7)], null, '#b6f29b70');
    const palette = {
      leaf: ['#b4ec66','#609c48','#77b747'],
      sun: ['#e0ff95','#86b953','#acd75a'],
      green: ['#8bd354','#427f45','#5a9d46'],
      dark: ['#447556','#234f40','#2b5845'],
      claw: ['#75ad7a','#315840','#497e53'],
      eye: ['#e2ffca','#a2d282','#b9e89b'],
    };
    const parts = [];
    function block(x,y,z,shade){ parts.push({x,y,z,shade}); }
    for (const side of [-1,1]) {
      for (const y of [-2,0,2]) {
        block(side*3,y,.85,'claw');
        block(side*4,y+(y===0?0:Math.sign(y)),.72,'claw');
        block(side*5,y+(y===0?1:Math.sign(y)*2),.7,'dark');
      }
      block(side,-5,1.7,'claw'); block(side*2,-6,1.4,'sun');
    }
    for(let y=-4;y<=4;y++){
      const r=y===4||y===-4 ? 1 : Math.abs(y)===3 ? 2 : 3;
      for(let x=-r;x<=r;x++){
        const head=y<=-3, ridge=x===0;
        const z=head ? 2.5+(y===-3?.55:0) : 2.4+(3-Math.abs(x))*.39+(3-Math.abs(y))*.2;
        let shade=head?'dark':ridge?'green':x<0?'sun':'leaf';
        if(head&&y===-4&&Math.abs(x)===1) shade='eye';
        else if(!head&&Math.abs(x)===r) shade='green';
        block(x,y,z,shade);
      }
    }
    parts.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.y-b.y);
    parts.forEach(({x,y,z,shade})=>{
      const [top,left,right]=palette[shade];
      const a=project(x,y,z),b=project(x+1,y,z),c=project(x+1,y+1,z),d=project(x,y+1,z);
      path([d,c,project(x+1,y+1),project(x,y+1)],left);
      path([b,c,project(x+1,y+1),project(x+1,y)],right);
      path([a,b,c,d],top,'#26463438');
    });
    for (const [x,y,dx,dy] of [[100,28,1,1],[312,28,-1,1],[100,187,1,-1],[312,187,-1,-1]]) {
      ctx.lineWidth=1.5;
      path([[x+dx*12,y],[x,y],[x,y+dy*12]],null,'#c5ed9f9c');
    }
  }, []);
  return <canvas className="specimen" ref={ref} aria-hidden="true" />;
}
