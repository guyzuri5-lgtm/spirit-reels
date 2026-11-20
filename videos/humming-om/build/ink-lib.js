/* ink-lib: the shared paper/ink drawing kit for the monk — palette, hands, arms, face parts (eyes, brows, mouth),
   the head rig (tilt / nod / wobble pivots), texture defs (ink outline, halftone, grain) and the halftone glow.
   monk-lib.js is loaded after it and builds THE MONK on top of these parts. */

/* ---------------- palette (reference style) ---------------- */
const SK='#dba67c',SKS='#c58f67',SKL='#e9bc96',LN='#9a6444',DK='#24170f';
const P=a=>a.map(v=>(+v).toFixed(1)).join(' ');
let UID=0;
function scallop(cx,cy,rx,ry,n,b,a0=0,a1=Math.PI*2){const p=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;p.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)])}let d=`M${P(p[0])}`;for(let i=1;i<p.length;i++)d+=` A${b} ${b} 0 0 1 ${P(p[i])}`;return d+'Z'}

/* ---------------- background ---------------- */
function bg(id,glow){let dots='';for(let y=16;y<440;y+=36)for(let x=16;x<400;x+=36)dots+=`<circle cx="${x}" cy="${y}" r="1.1"/>`;
 return `<defs><radialGradient id="${id}bg" cx="${glow[0]}%" cy="${glow[1]}%" r="85%"><stop offset="0" stop-color="#4a2312"/><stop offset=".45" stop-color="#1b0c06"/><stop offset="1" stop-color="#060303"/></radialGradient></defs>
 <rect width="400" height="440" fill="url(#${id}bg)"/><g fill="#a07e68" opacity=".28">${dots}</g>`}

/* ---------------- hands (wrist at 0,0 ; fingers to -y) ---------------- */
const knuckles=n=>{let d=`M${-17+(4-n)*9} -38`;for(let i=0;i<n;i++)d+=` q4.5 -9 9 0`;return `<path d="${d}" stroke="${LN}" stroke-width="2" fill="${SKL}"/>`};
const thumbFront=`<path d="M-21 -16 C-14 -27 3 -24 7 -13 C9 -4 -6 -2 -19 -7Z" fill="${SKL}" stroke="${LN}" stroke-width="2"/>`;
const HAND={
 fist:()=>`<rect x="-19" y="-44" width="38" height="44" rx="15" fill="${SK}"/>${knuckles(4)}${thumbFront}`,
 point:()=>`<rect x="-19" y="-44" width="38" height="44" rx="15" fill="${SK}"/><rect x="-18" y="-84" width="14" height="50" rx="7" fill="${SK}"/><path d="M-11 -40 v-36" stroke="${SKS}" stroke-width="2" opacity=".6"/><ellipse cx="-11" cy="-78" rx="4" ry="4.5" fill="${SKL}"/>${knuckles(3)}${thumbFront}`,
 thumb:()=>`<rect x="-24" y="-42" width="44" height="40" rx="13" fill="${SK}"/>${[0,1,2,3].map(i=>`<rect x="0" y="${-41+i*9.6}" width="24" height="10" rx="5" fill="${SKL}" stroke="${LN}" stroke-width="1.6"/>`).join('')}<rect x="-20" y="-80" width="16" height="46" rx="8" fill="${SK}"/><ellipse cx="-12" cy="-74" rx="4.5" ry="5" fill="${SKL}"/><path d="M-20 -38 q8 6 18 0" stroke="${LN}" stroke-width="1.8" fill="none"/>`,
 open:()=>`${[[-19,28,-8],[-8,33,-3],[3,32,3],[13,26,9]].map(([x,l,r])=>`<rect x="${x}" y="${-38-l}" width="10.5" height="${l+8}" rx="5.2" fill="${SK}" transform="rotate(${r} ${x+5} -38)"/>`).join('')}
  <rect x="-20" y="-44" width="40" height="44" rx="15" fill="${SK}"/><path d="M-9 -40 v-8 M2 -40 v-8 M12 -40 v-7" stroke="${LN}" stroke-width="1.8"/>
  <rect x="-35" y="-36" width="12" height="28" rx="6" fill="${SK}" transform="rotate(-38 -24 -16)"/><path d="M-14 -10 q8 6 18 0" stroke="${LN}" stroke-width="1.8" fill="none"/>`,
};
function arm(sh,el,wr,hand,extra,cl,cls,mirror,acc=''){
 const ang=Math.atan2(wr[1]-el[1],wr[0]-el[0])*180/Math.PI;
 const bx=el[0]+(wr[0]-el[0])*.86,by=el[1]+(wr[1]-el[1])*.86;
 const cx=el[0]+(wr[0]-el[0])*.12,cy=el[1]+(wr[1]-el[1])*.12;
 const sa=Math.atan2(el[1]-sh[1],el[0]-sh[0]),nx=-Math.sin(sa),ny=Math.cos(sa);
 const mx=sh[0]+(el[0]-sh[0])*.62,my=sh[1]+(el[1]-sh[1])*.62;
 const fold=(k,o)=>`<path d="M${P([mx+nx*o*20+(el[0]-sh[0])*k,my+ny*o*20+(el[1]-sh[1])*k])} q${P([nx*-6*o+(el[0]-sh[0])*.06,ny*-6*o+(el[1]-sh[1])*.06])} ${P([nx*-16*o,ny*-16*o])}" stroke="#202228" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>`;
 return `<g>
 <path d="M${P(sh)} L${P(el)}" stroke="#1c1d22" stroke-width="57" stroke-linecap="round"/>
 <path d="M${P(sh)} L${P(el)}" stroke="${cl}" stroke-width="52" stroke-linecap="round"/>
 <path d="M${P(sh)} L${P(el)}" stroke="url(#__ID__fleece)" stroke-width="52" stroke-linecap="round"/>
 <path d="M${P([sh[0]-nx*14,sh[1]-ny*14])} L${P([el[0]-nx*14,el[1]-ny*14])}" stroke="#5a5e6a" stroke-width="7" stroke-linecap="round" opacity=".55"/>
 ${fold(0,1)}${fold(.12,-1)}
 <path d="M${P(el)} L${P(wr)}" stroke="${LN}" stroke-width="34" stroke-linecap="round" opacity=".55"/>
 <path d="M${P(el)} L${P(wr)}" stroke="${SK}" stroke-width="31" stroke-linecap="round"/>
 <path d="M${P([el[0]+6,el[1]])} L${P([wr[0]+6,wr[1]])}" stroke="${SKS}" stroke-width="8" stroke-linecap="round" opacity=".8"/>
 <path d="M${P([el[0]-7,el[1]])} L${P([wr[0]-7,wr[1]])}" stroke="${SKL}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
 <g transform="rotate(${ang+90} ${cx} ${cy})"><rect x="${cx-27}" y="${cy-11}" width="54" height="22" rx="10" fill="#1c1d22"/><rect x="${cx-26}" y="${cy-10}" width="52" height="20" rx="10" fill="${cls}"/><rect x="${cx-26}" y="${cy-10}" width="52" height="20" rx="10" fill="url(#__ID__rib)"/></g>
 <g transform="rotate(${ang+90} ${bx} ${by})"><rect x="${bx-20}" y="${by-4.5}" width="40" height="9" rx="4.5" fill="#1d6b45"/>${[0,1,2,3,4,5,6].map(i=>`<circle cx="${bx-15+i*5}" cy="${by}" r="2.6" fill="${i%2?'#2fbf7a':'#3dff8a'}"/><circle cx="${bx-15.8+i*5}" cy="${by-.9}" r=".9" fill="#fff" opacity=".8"/>`).join('')}</g>
 <g transform="translate(${P(wr)}) rotate(${ang+90+extra}) scale(${mirror?-.96:.96} .96)">${HAND[hand]()}</g>${acc}</g>`}

/* ---------------- face ---------------- */
function eyes(o){const lk=o.look||[0,0];
 if(o.eyes==='wink')return `<ellipse cx="173" cy="231" rx="9.5" ry="5.8" fill="#fff"/><circle cx="${173+lk[0]}" cy="${229.5+lk[1]}" r="4.2" fill="${DK}"/><circle cx="${171.6+lk[0]}" cy="${228+lk[1]}" r="1.2" fill="#fff"/><path d="M161 231 Q173 222 185 230" stroke="${DK}" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M216 230 Q227 236 238 230" stroke="${DK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
 if(o.exp==='laugh')return `<path d="M163 232 Q173 222 183 232 M217 232 Q227 222 237 232" stroke="${DK}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
 const big=o.exp==='o'?1.25:1;
 return [173,227].map(x=>`<ellipse cx="${x}" cy="231" rx="${9.5*big}" ry="${5.8*big}" fill="#fff"/><circle cx="${x+lk[0]}" cy="${229.5+lk[1]}" r="${4.2*big}" fill="${DK}"/><circle cx="${x+lk[0]-1.4}" cy="${228+lk[1]}" r="1.2" fill="#fff"/><path d="M${x-12} ${231-(big-1)*6} Q${x} ${222-(big-1)*8} ${x+12} ${230-(big-1)*6}" stroke="${DK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`).join('')}
function brows(o){const t={normal:[0,0,0,0],up:[-9,-9,-6,6],skeptic:[2,-9,6,8],worry:[-6,-6,-12,12]}[o.brows||'normal'];
 return `<path d="M156 ${206+t[0]} q12 ${-7+t[2]*.4} 26 ${-1+t[2]*.3}" stroke="${o.bc}" stroke-width="6.5" fill="none" stroke-linecap="round"/><path d="M218 ${205+t[1]} q14 ${-6-t[3]*.2} 26 ${1+t[3]*.3}" stroke="${o.bc}" stroke-width="6.5" fill="none" stroke-linecap="round"/>`}
function mouth(o,id){const lip='#b9475a';
 const open=(w,h)=>{const d=`M${200-w} 276 Q200 ${276+h} ${200+w} 276 Q200 ${280} ${200-w} 276Z`;return `<clipPath id="${id}m"><path d="${d}"/></clipPath><path d="${d}" fill="#6a1a20"/><g clip-path="url(#${id}m)"><rect x="${200-w}" y="272" width="${w*2}" height="9" fill="#fff"/><ellipse cx="200" cy="${276+h*.5}" rx="${w*.55}" ry="${h*.28}" fill="#c4555e"/></g><path d="${d}" fill="none" stroke="${lip}" stroke-width="2" stroke-linejoin="round"/>`};
 return {open:open(20,28),laugh:open(25,38),smirk:`<path d="M184 282 Q200 290 218 276" stroke="${lip}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  o:`<ellipse cx="200" cy="284" rx="8" ry="10" fill="#6a1a20" stroke="${lip}" stroke-width="2"/>`,shush:`<ellipse cx="200" cy="282" rx="6" ry="4.5" fill="${lip}"/>`}[o.mouth||o.exp]}

/* head rig: 3 nested pivots at the neck (tilt / nod / wobble), driven by attr transform from the scene */
const HG0='<g class="rhd" transform="rotate(0 200 322)"><g class="rhn" transform="translate(0 0) rotate(0 200 322)"><g class="rhw" transform="rotate(0 200 322)">',HG1='</g></g></g>';
/* ---------------- character ---------------- */
function texDefs(id){
 return `<pattern id="${id}fleece" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".9" fill="#fff" opacity=".07"/><circle cx="5" cy="4.5" r=".8" fill="#000" opacity=".18"/><path d="M0 7 L7 0" stroke="#000" stroke-width=".5" opacity=".08"/></pattern>
 <pattern id="${id}rib" width="4.5" height="10" patternUnits="userSpaceOnUse"><rect width="1.6" height="10" fill="#000" opacity=".32"/><rect x="2.4" width="1" height="10" fill="#fff" opacity=".08"/></pattern>
 <pattern id="${id}strand" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="9" height="1.1" fill="#8f8a9c" opacity=".7"/><rect y="4.5" width="9" height=".7" fill="#fff" opacity=".8"/></pattern>
 <linearGradient id="${id}hairg" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#fbfaff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7e7890" stop-opacity=".55"/></linearGradient>
 <radialGradient id="${id}faceg" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="${SKL}" stop-opacity=".6"/><stop offset=".45" stop-color="${SKL}" stop-opacity="0"/><stop offset=".85" stop-color="${SKS}" stop-opacity=".25"/><stop offset="1" stop-color="#a86f4c" stop-opacity=".6"/></radialGradient>
 <linearGradient id="${id}bodyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6f7c" stop-opacity=".45"/><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
 <radialGradient id="${id}lens" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#d6ffe6" stop-opacity=".6"/><stop offset=".55" stop-color="#5bf09a" stop-opacity=".38"/><stop offset="1" stop-color="#16784a" stop-opacity=".6"/></radialGradient>
 <linearGradient id="${id}metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".5" stop-color="#b9bdc5"/><stop offset="1" stop-color="#7d828c"/></linearGradient>
 <pattern id="${id}ht" width="5.2" height="5.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.6" cy="2.6" r="1.55" fill="#1b1714"/></pattern>
 <filter id="${id}soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
 <filter id="${id}wh"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
 <filter id="${id}tex" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="2.1" result="d"/>
  <feFlood flood-color="#231915" result="f"/><feComposite in="f" in2="d" operator="in" result="ol"/>
  <feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="2" seed="4" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .42 0 0 0 -.14" result="na"/>
  <feComposite in="na" in2="SourceAlpha" operator="in" result="grain"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -.5 0 0 .2" result="nl"/>
  <feComposite in="nl" in2="SourceAlpha" operator="in" result="lgrain"/>
  <feMerge><feMergeNode in="ol"/><feMergeNode in="SourceGraphic"/><feMergeNode in="grain"/><feMergeNode in="lgrain"/></feMerge>
 </filter>`}
function htGlow(cx,cy,R,col,op){let d='';const s=7.5;for(let y=cy-R;y<=cy+R;y+=s)for(let x=cx-R;x<=cx+R;x+=s){const ox=((y-cy+R)/s)%2?s/2:0,xx=x+ox,dd=Math.hypot(xx-cx,(y-cy)*1.05);if(dd>=R)continue;const r=3.1*Math.pow(1-dd/R,.75);if(r<.45)continue;d+=`<circle cx="${xx.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`}
 return `<g fill="${col}" opacity="${op}">${d}</g>`}
