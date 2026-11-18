
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

/* ---------------- hair ---------------- */
const HAIR={
 bun:(c)=>({back:`<path d="M120 232 C112 170 140 104 200 102 C260 104 288 170 280 232 C276 200 266 178 250 168 L150 168 C134 178 124 200 120 232Z" fill="${c.h}"/><circle cx="200" cy="88" r="34" fill="${c.h}"/><path d="M182 82 C188 68 212 68 218 82 M186 98 C194 90 208 92 212 100" stroke="${c.s}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  front:`<path d="M122 214 C118 148 152 104 200 104 C248 104 282 148 278 214 C272 186 258 166 234 160 C216 156 184 156 166 160 C142 166 128 186 122 214Z" fill="${c.h}"/><path d="M160 118 C176 112 196 112 206 120 M214 116 C236 118 254 130 264 150 M140 150 C146 134 156 124 168 120 M134 196 C134 176 140 164 150 156" stroke="${c.s}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`}),
 bob:(c)=>({back:`<path d="${scallop(200,200,104,116,16,26)}" fill="${c.h}"/>`,
  front:`<path d="${scallop(200,146,82,40,9,20)}" fill="${c.h}"/><path d="M150 130 C170 114 196 110 214 116 M222 118 C242 124 256 136 262 152 M106 220 C104 196 108 176 118 164 M294 220 C296 196 292 176 282 164" stroke="${c.s}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`}),
 perm:(c)=>({back:`<path d="${scallop(200,178,132,114,15,36)}" fill="${c.h}"/>`,
  front:`<path d="${scallop(200,140,88,36,9,22)}" fill="${c.h}"/>${[[120,120],[200,84],[278,122],[96,200],[304,200]].map(([x,y])=>`<path d="M${x-14} ${y+4} C${x-8} ${y-10} ${x+10} ${y-10} ${x+14} ${y+2}" stroke="${c.s}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('')}`}),
 sweep:(c)=>({back:`<path d="M116 246 C100 184 120 108 198 96 C270 90 302 150 288 246 C284 222 278 200 268 186 L132 186 C124 204 118 224 116 246Z" fill="${c.d}"/><path d="M116 246 C100 184 120 108 198 96 C270 90 302 150 288 246 C284 222 278 200 268 186 L132 186 C124 204 118 224 116 246Z" fill="url(#__ID__hairg)"/>
  <path d="M124 236 C112 196 116 150 140 126 M280 236 C292 196 290 160 270 132" stroke="#8f8a9c" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`,
  front:`<path d="M122 212 C118 150 150 102 204 102 C258 102 286 146 280 200 L270 182 L264 198 L254 174 L246 192 L234 168 L224 188 L212 164 L202 184 L190 166 L180 186 L168 170 L158 192 L148 178 L140 200 L130 194Z" fill="${c.h}"/>
  <path d="M122 212 C118 150 150 102 204 102 C258 102 286 146 280 200 L270 182 L264 198 L254 174 L246 192 L234 168 L224 188 L212 164 L202 184 L190 166 L180 186 L168 170 L158 192 L148 178 L140 200 L130 194Z" fill="url(#__ID__hairg)"/>
  <path d="M122 212 C118 150 150 102 204 102 C258 102 286 146 280 200 L270 182 L264 198 L254 174 L246 192 L234 168 L224 188 L212 164 L202 184 L190 166 L180 186 L168 170 L158 192 L148 178 L140 200 L130 194Z" fill="url(#__ID__strand)" opacity=".55"/>
  <g stroke="#9c97aa" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".85"><path d="M150 186 C150 160 160 140 178 128"/><path d="M172 180 C174 156 184 138 200 126"/><path d="M198 178 C202 154 214 138 232 130"/><path d="M226 182 C232 160 246 146 262 142"/><path d="M252 186 C258 170 266 160 276 156"/><path d="M138 196 C134 172 140 150 152 136"/></g>
  <path d="M146 128 C168 112 198 106 224 110" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
  <path d="M232 114 C252 122 266 136 272 156" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".45"/>
  <path d="M138 160 C142 140 150 128 160 120" stroke="${c.s}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M168 170 L180 186 L190 166 M212 164 L224 188 L234 168" stroke="#8f8a9c" stroke-width="1.6" fill="none" stroke-linejoin="round" opacity=".7"/>`}),
 hood:(c)=>({back:`<path d="M96 318 C80 206 108 84 200 78 C292 84 320 206 304 318 C280 330 120 330 96 318Z" fill="${c.hood}"/><path d="M112 300 C100 210 124 106 200 100 C276 106 300 210 288 300" stroke="${c.hd}" stroke-width="3" fill="none" opacity=".8"/>`,
  front:`<path d="M126 206 C124 160 150 124 200 124 C250 124 276 160 274 206 L266 190 L258 204 L250 184 L240 200 L230 180 L220 198 L210 178 L200 196 L190 178 L180 198 L170 180 L160 200 L150 184 L142 204 L134 190Z" fill="${c.h}"/><path d="M116 222 C110 150 150 104 200 104 C250 104 290 150 284 222 C278 164 246 128 200 128 C154 128 122 164 116 222Z" fill="${c.hood}"/><path d="M118 214 C116 156 152 112 200 112 C248 112 284 156 282 214" stroke="${c.hd}" stroke-width="2.5" fill="none"/>`}),
 crown:(c)=>{let br='';for(let i=0;i<=10;i++){const a=Math.PI*(1.08+i*0.084),x=200+84*Math.cos(a),y=176+74*Math.sin(a),rot=a*180/Math.PI+90;br+=`<ellipse cx="${P([x])}" cy="${P([y])}" rx="15" ry="10" fill="${i%2?c.h:c.d}" transform="rotate(${rot.toFixed(1)} ${P([x])} ${P([y])})"/><path d="M${P([x-7])} ${P([y])} q7 -5 14 0" stroke="${c.s}" stroke-width="2" fill="none" transform="rotate(${rot.toFixed(1)} ${P([x])} ${P([y])})"/>`}
  return {back:`<path d="M118 240 C110 170 140 106 200 104 C260 106 290 170 282 240 C276 206 264 182 248 172 L152 172 C136 182 124 206 118 240Z" fill="${c.h}"/>`,
  front:`<path d="M124 210 C120 150 152 112 200 112 C248 112 280 150 276 210 C268 184 254 168 232 162 C214 158 186 158 168 162 C146 168 132 184 124 210Z" fill="${c.h}"/><path d="M150 150 C170 136 230 136 250 150" stroke="${c.s}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${br}`}},
};

/* ---------------- glasses ---------------- */
const GL={
 round:(c)=>`<g fill="#fff" fill-opacity=".14" stroke="${c}" stroke-width="3.4"><circle cx="173" cy="231" r="18"/><circle cx="227" cy="231" r="18"/></g><path d="M191 229 Q200 223 209 229" stroke="${c}" stroke-width="3.4" fill="none"/><path d="M162 222 l7 -6 M216 222 l7 -6" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`,
 cat:(c)=>`<g fill="#fff" fill-opacity=".14" stroke="${c}" stroke-width="3.4" stroke-linejoin="round"><path d="M150 232 C148 218 162 214 175 215 C188 216 196 221 196 231 C196 243 187 249 174 249 C160 249 152 243 150 232Z"/><path d="M250 232 C252 218 238 214 225 215 C212 216 204 221 204 231 C204 243 213 249 226 249 C240 249 248 243 250 232Z"/></g><path d="M151 227 L139 208 L160 216Z M249 227 L261 208 L240 216Z" fill="${c}"/><path d="M196 228 Q200 224 204 228" stroke="${c}" stroke-width="3.4" fill="none"/>`,
 half:(c)=>`<g fill="#fff" fill-opacity=".14" stroke="${c}" stroke-width="3.2"><path d="M156 244 h34 a17 12 0 0 1 -34 0Z"/><path d="M210 244 h34 a17 12 0 0 1 -34 0Z"/></g><path d="M190 245 Q200 240 210 245" stroke="${c}" stroke-width="3" fill="none"/><path d="M156 246 C140 270 134 300 140 330 M244 246 C260 270 266 300 260 330" stroke="#d8a64a" stroke-width="2.2" fill="none" stroke-dasharray="1 4" stroke-linecap="round"/>`,
 big:(c)=>`<g fill="#fff" fill-opacity=".14" stroke="${c}" stroke-width="4.5"><rect x="150" y="214" width="46" height="34" rx="11"/><rect x="204" y="214" width="46" height="34" rx="11"/></g><path d="M196 226 h8" stroke="${c}" stroke-width="4.5"/><path d="M158 222 l8 -5 M212 222 l8 -5" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`,
 green:(c)=>`<g fill="url(#__ID__lens)" stroke="${c}" stroke-width="3.6"><circle cx="173" cy="231" r="18"/><circle cx="227" cy="231" r="18"/></g><g stroke="#5b5f68" stroke-width="1.1" fill="none" opacity=".9"><circle cx="173" cy="231" r="15.6"/><circle cx="227" cy="231" r="15.6"/></g><path d="M161 226 l9 -9 M166 230 l5 -5 M215 226 l9 -9 M220 230 l5 -5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".75"/><path d="M155 233 L130 226 M245 233 L270 226" stroke="${c}" stroke-width="3" stroke-linecap="round"/><g fill="none" stroke="none" stroke-width="0"><circle cx="173" cy="231" r="18"/><circle cx="227" cy="231" r="18"/></g><path d="M191 229 Q200 223 209 229" stroke="${c}" stroke-width="3.4" fill="none"/>${[0,2].map(i=>`<rect x="${162+i*2}" y="${222+i*6}" width="${16-i*3}" height="2" fill="#0b3d1d" opacity=".5"/><rect x="${216+i*2}" y="${222+i*6}" width="${18-i*4}" height="2" fill="#0b3d1d" opacity=".5"/>`).join('')}`,
};

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
function head(o,id){const H=HAIR[o.hair](o.hc);
 return `${HG0}<g transform="translate(200 326) scale(1.13) translate(-200 -326)">${H.back}</g>${HG1}
 <path d="M180 296 L180 336 Q200 344 220 336 L220 296Z" fill="${SKS}"/>`+'__BODY__'+`${HG0}<g transform="translate(200 326) scale(1.13) translate(-200 -326)">
 <ellipse cx="124" cy="236" rx="9" ry="14" fill="${SKS}"/><ellipse cx="276" cy="236" rx="9" ry="14" fill="${SKS}"/>
 ${o.ear==='pearl'?`<circle cx="122" cy="252" r="5" fill="#f3ece0"/><circle cx="278" cy="252" r="5" fill="#f3ece0"/>`:[123,277].map(x=>`<circle cx="${x}" cy="248" r="2.4" fill="#d8b25a"/><path d="M${x} 250 C${x-6} 260 ${x-4} 268 ${x} 270 C${x+5} 268 ${x+6} 260 ${x} 250Z" fill="#1f8a58"/><path d="M${x} 250 L${x-2.5} 264 L${x} 270Z" fill="#3dff8a" opacity=".55"/><path d="M${x+1} 255 l1.5 4" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`).join('')}
 <path d="M200 108 C262 108 278 160 278 214 C278 276 246 318 200 320 C154 318 122 276 122 214 C122 160 138 108 200 108Z" fill="${SK}"/>
 <path d="M200 108 C262 108 278 160 278 214 C278 276 246 318 200 320 C154 318 122 276 122 214 C122 160 138 108 200 108Z" fill="url(#__ID__faceg)"/>
 <path d="M266 196 C278 224 276 266 256 292 C242 310 224 318 208 320 C234 304 254 280 260 250 C264 230 264 212 266 196Z" fill="${SKS}" opacity=".7"/>
 <ellipse cx="158" cy="266" rx="17" ry="10" fill="#e07d6c" opacity=".32" filter="url(#__ID__soft)"/><ellipse cx="244" cy="266" rx="17" ry="10" fill="#e07d6c" opacity=".32" filter="url(#__ID__soft)"/>
 <g fill="#b5714d" opacity=".55">${[[150,262],[156,270],[146,270],[248,262],[242,270],[252,270],[160,258]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.1"/>`).join('')}</g>
 <path d="M150 248 q6 4 12 2 M238 250 q6 2 12 -2" stroke="${LN}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"/>
 <path d="M176 296 q24 10 48 0" stroke="${SKS}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
 <g stroke="#2a130a" stroke-width="1.2" opacity=".42">${[0,1,2,3,4,5].map(i=>`<line x1="${282-i*2.2}" y1="${248+i*8}" x2="${289-i*2.2}" y2="${240+i*8}"/>`).join('')}</g>
 ${H.front}
 ${o.pencil?`<g transform="translate(232 ${o.hair==='bun'?84:118}) rotate(-38)"><rect x="0" y="-5" width="62" height="10" fill="#f5c542"/><rect x="62" y="-5" width="7" height="10" fill="#c0c4cc"/><rect x="69" y="-5" width="9" height="10" rx="2.5" fill="#f08aa6"/><polygon points="0,-5 0,5 -12,0" fill="#efcf9f"/></g>`:''}
 ${brows(o)}${eyes(o)}
 <path d="M200 240 C211 240 215 252 211 260 C207 266 193 266 189 260 C185 252 189 240 200 240Z" fill="${SKS}"/>
 <ellipse cx="196" cy="249" rx="3" ry="3.6" fill="${SKL}" opacity=".8"/>
 ${GL[o.gl](o.glc)}
 <circle cx="231" cy="272" r="2.3" fill="#6b3a26"/>
 ${mouth(o,id)}</g>${HG1}`}

/* ---------------- outfits ---------------- */
const OUT={
 cardigan:(c)=>`<path d="M48 440 C50 372 92 330 200 326 C308 330 350 372 352 440Z" fill="${c.a}"/><path d="M296 338 C332 356 350 396 352 440 L318 440 C322 400 312 364 296 338Z" fill="${c.b}"/>
  <path d="M200 334 L164 326 C158 340 164 354 180 358Z M200 334 L236 326 C242 340 236 354 220 358Z" fill="#f4efe6"/><path d="M200 334 L220 358 L228 354 L236 326Z" fill="#ddd5c8"/>
  <path d="M182 318 Q200 348 218 318" stroke="#d8a64a" stroke-width="1.8" fill="none"/><g transform="translate(200 348)"><path d="M-3.5 -2 v-3 a3.5 3.5 0 0 1 7 0 v3" stroke="#d8a64a" stroke-width="1.8" fill="none"/><rect x="-6" y="-2.5" width="12" height="10" rx="2.5" fill="#d8a64a"/></g>
  <circle cx="200" cy="384" r="4" fill="${c.k}"/><circle cx="200" cy="412" r="4" fill="${c.k}"/>`,
 blouse:(c)=>`<path d="M48 440 C50 372 92 330 200 326 C308 330 350 372 352 440Z" fill="${c.a}"/><path d="M296 338 C332 356 350 396 352 440 L318 440 C322 400 312 364 296 338Z" fill="${c.b}"/>
  <path d="M176 328 L200 364 L224 328Z" fill="${SKS}"/>${Array.from({length:11},(_,i)=>{const t=i/10;return `<circle cx="${176+48*t}" cy="${330+Math.sin(t*Math.PI)*26}" r="4.2" fill="#f3ece0"/>`}).join('')}
  <path d="M200 364 V440" stroke="${c.b}" stroke-width="3"/>`,
 shawl:(c)=>`<path d="M48 440 C50 372 92 330 200 326 C308 330 350 372 352 440Z" fill="${c.a}"/>
  <path d="M60 440 C62 376 104 330 200 328 C296 330 338 376 340 440 L300 440 C292 400 250 374 200 372 C150 374 108 400 100 440Z" fill="${c.s}"/>
  <path d="M60 440 C62 376 104 330 200 328 C296 330 338 376 340 440 L300 440 C292 400 250 374 200 372 C150 374 108 400 100 440Z" fill="none" stroke="${c.b}" stroke-width="2" stroke-dasharray="2 5"/>
  <path d="M176 330 L200 356 L224 330" stroke="#f3ece0" stroke-width="3" fill="none"/><circle cx="200" cy="378" r="7" fill="#d8a64a"/><circle cx="200" cy="378" r="3" fill="#2fa36f"/>`,
 hoodie:(c)=>`<path d="M48 440 C50 372 92 330 200 326 C308 330 350 372 352 440Z" fill="${c.a}"/>
  <path d="M48 440 C50 372 92 330 200 326 C308 330 350 372 352 440Z" fill="url(#__ID__bodyg)"/>
  <path d="M48 440 C50 372 92 330 200 326 C308 330 350 372 352 440Z" fill="url(#__ID__fleece)"/>
  <path d="M296 338 C332 356 350 396 352 440 L318 440 C322 400 312 364 296 338Z" fill="${c.b}"/>
  <path d="M104 352 C96 380 92 410 92 440 M296 352 C304 380 308 410 308 440" stroke="#1f2026" stroke-width="2" fill="none" opacity=".8"/>
  <path d="M110 354 C102 382 98 410 98 440 M290 354 C298 382 302 410 302 440" stroke="#7b808c" stroke-width="1.4" stroke-dasharray="4 4" fill="none" opacity=".75"/>
  <path d="M120 440 C130 424 150 418 200 418 C250 418 270 424 280 440" fill="${c.b}" opacity=".55"/>
  <path d="M126 440 C136 428 154 424 200 424 C246 424 264 428 274 440" stroke="#7b808c" stroke-width="1.4" stroke-dasharray="4 4" fill="none" opacity=".75"/>
  <path d="M140 334 C150 312 250 312 260 334 C246 352 222 360 200 360 C178 360 154 352 140 334Z" fill="${c.b}"/>
  <path d="M140 334 C150 312 250 312 260 334 C246 352 222 360 200 360 C178 360 154 352 140 334Z" fill="url(#__ID__rib)" opacity=".8"/>
  <path d="M140 334 C150 312 250 312 260 334 C246 352 222 360 200 360 C178 360 154 352 140 334Z" fill="none" stroke="#1c1d22" stroke-width="2.2"/>
  <path d="M152 334 C168 346 232 346 248 334" stroke="#1c1d22" stroke-width="5" fill="none"/><path d="M152 334 C168 346 232 346 248 334" stroke="#e9e6ee" stroke-width="3" fill="none"/>
  <circle cx="182" cy="347" r="3.4" fill="#c9ccd2" stroke="#6a6e78" stroke-width="1.2"/><circle cx="218" cy="347" r="3.4" fill="#c9ccd2" stroke="#6a6e78" stroke-width="1.2"/>
  <path d="M182 350 C180 368 180 384 178 400 M218 350 C220 370 220 384 222 400" stroke="#1c1d22" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  <path d="M182 350 C180 368 180 384 178 400 M218 350 C220 370 220 384 222 400" stroke="#e9e6ee" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M182 352 C180 368 180 384 178 400 M218 352 C220 370 220 384 222 400" stroke="#b9b6c0" stroke-width="1.2" stroke-dasharray="1.5 3" fill="none"/>
  <rect x="174" y="398" width="8" height="12" rx="2" fill="url(#__ID__metal)" stroke="#4a4e57" stroke-width="1"/><rect x="218" y="398" width="8" height="12" rx="2" fill="url(#__ID__metal)" stroke="#4a4e57" stroke-width="1"/>
  <g transform="translate(262 404) rotate(-4)"><rect x="-26" y="-17" width="52" height="30" rx="7" fill="#15161a"/><rect x="-23" y="-14" width="46" height="24" rx="5" fill="none" stroke="#3dff8a" stroke-width="1.3" stroke-dasharray="2.5 2.5" opacity=".7"/>
  <text x="0" y="5" text-anchor="middle" font-family="monospace" font-weight="700" font-size="15" fill="#3dff8a" direction="ltr">&lt;/&gt;</text></g>
  <g transform="translate(120 372) rotate(-12)"><rect x="-9" y="-5" width="18" height="10" rx="1.5" fill="#e5302a"/><rect x="-6" y="-1.2" width="12" height="2.4" fill="#fff" opacity=".85"/></g>`,
};

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
function rivka(o){const id='v'+(UID++);
 const bodySvg=OUT[o.out](o.oc);
 let h=head(o,id).replace('__BODY__',bodySvg);
 const inner=(h+o.arms.map(a=>arm(...a)).join('')+(o.extra||'')).split('__ID__').join(id);
 const sh=o.shadow||[15,5];
 return `<defs>${texDefs(id)}<mask id="${id}sm" maskUnits="userSpaceOnUse" x="-200" y="-200" width="800" height="900"><g transform="translate(${sh[0]} ${sh[1]})" filter="url(#${id}wh)"><use href="#${id}ch"/></g></mask></defs>
 ${o.nobg?'':bg(id,o.glow||[24,64])}
 ${o.glowc===null?'':htGlow(212,236,o.glowR||178,o.glowc||'#e5302a',o.glowOp||.42)}
 <rect x="-200" y="-200" width="800" height="900" fill="url(#${id}ht)" mask="url(#${id}sm)" opacity="${o.shadowOp||.9}"/>
 <g id="${id}ch" filter="url(#${id}tex)">${inner}</g>`}

const SH_L=[128,352],SH_R=[272,352];
const lav={h:'#b3abc8',s:'#d9d4e8',d:'#9d94b8'},silver={h:'#cfcbd6',s:'#f0eef4',d:'#b3aebd'},blue={h:'#a7b3d4',s:'#d3dbef',d:'#8f9cc2'};
const yarn=(x1,y1)=>`<g style="filter:drop-shadow(0 0 3px #5ff0ff)" fill="none" stroke-linecap="round"><path d="M${x1} ${y1} c22 10 30 40 14 60 c-14 16 8 40 28 44" stroke="#5ff0ff" stroke-width="3"/><path d="M${x1} ${y1+6} c18 14 20 40 8 56 c-12 18 8 52 24 68" stroke="#6dff8e" stroke-width="2.4"/></g>`;

const HK={hair:'sweep',hc:{h:'#cfcbd6',s:'#f0eef4',d:'#b3aebd',hood:'#3a3d46',hd:'#50545f'},gl:'green',glc:'#1d1d22',bc:'#8a8595',out:'hoodie',oc:{a:'#3a3d46',b:'#2c2e35'}};
const C1='#3a3d46',C2='#50545f';
const phone=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-17" y="-30" width="34" height="58" rx="6" fill="#141418"/><rect x="-13" y="-24" width="26" height="44" rx="3" fill="#0b2a16"/><path d="M-5 -6 v-4 a5 5 0 0 1 10 0 v4" stroke="#3dff8a" stroke-width="2.4" fill="none"/><rect x="-8" y="-6" width="16" height="12" rx="2" fill="#3dff8a"/></g>`;
const laptop=`<g><path d="M70 440 L330 440 L310 418 L90 418Z" fill="#9aa0aa"/><rect x="104" y="318" width="192" height="104" rx="8" fill="#c9ccd2"/><rect x="104" y="318" width="192" height="104" rx="8" fill="none" stroke="#9aa0aa" stroke-width="2"/>
 <g transform="translate(200 366)"><circle r="20" fill="#1d1d22"/><path d="M-6 -3 v-5 a6 6 0 0 1 12 0 v5" stroke="#3dff8a" stroke-width="2.8" fill="none"/><rect x="-9" y="-3" width="18" height="14" rx="3" fill="#3dff8a"/></g>
 <rect x="128" y="334" width="40" height="16" rx="8" fill="#ff5d8f" transform="rotate(-10 148 342)"/><text x="148" y="346" text-anchor="middle" font-family="monospace" font-weight="700" font-size="10" fill="#fff" transform="rotate(-10 148 342)" direction="ltr">sudo</text>
 <circle cx="264" cy="398" r="11" fill="#ffd34d"/><path d="M259 397 q5 5 10 0" stroke="#5a3a08" stroke-width="2" fill="none"/><circle cx="260" cy="394" r="1.5" fill="#5a3a08"/><circle cx="268" cy="394" r="1.5" fill="#5a3a08"/></g>`;
const mug=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M-6 -44 q6 -8 0 -16 M6 -44 q6 -8 0 -16" stroke="#e9e6ee" stroke-width="2.5" fill="none" opacity=".6" stroke-linecap="round"/><path d="M20 -26 q16 0 16 13 q0 13 -16 13" stroke="#f2efe8" stroke-width="6" fill="none"/><rect x="-22" y="-38" width="44" height="50" rx="7" fill="#f2efe8"/><rect x="-22" y="-38" width="44" height="7" rx="3" fill="#d9d5cc"/><text x="0" y="-6" text-anchor="middle" font-family="monospace" font-weight="700" font-size="13" fill="#2a8f50" direction="ltr">root</text></g>`;


/* scene helper: Rivka as nested svg, no background. pose = array of arm specs */
window.RIVKA=(o,x,y,w)=>`<svg x="${x}" y="${y}" width="${w}" height="${w*1.1}" viewBox="0 0 400 440" overflow="visible">${rivka({...HK,nobg:1,...o})}</svg>`;
