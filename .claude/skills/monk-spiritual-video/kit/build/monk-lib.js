/* The monk: a Buddhist monk in Savta Rivka's v2 language (chubby, bald, saffron robe, right shoulder bare).
   Load AFTER rivka-lib-v2.js. It reuses P, SK/SKS/SKL/LN/DK, HAND, mouth, texDefs and htGlow.
   window.MONK(o, x, y, w) returns a nested SVG (viewBox 400×440), like window.RIVKA. */

const RB = '#e8892b', RBS = '#c4661a', RBD = '#9a4813', RBL = '#f6ad55', RBO = '#6e300c';   // saffron robe
const MSH_L = [118, 358], MSH_R = [282, 358];

/* hands: side-on flat palm for gassho (palms together), plus the Rivka set */
HAND.flat = () => `<path d="M-12 0 L-12.5 -60 C-12.5 -80 12 -80 12 -62 L12 0Z" fill="${SK}"/>
 <path d="M12 -62 L12 0" stroke="${SKS}" stroke-width="3" opacity=".8"/>
 <path d="M-12.5 -60 C-12.5 -80 12 -80 12 -62" stroke="${LN}" stroke-width="2" fill="none"/>
 <path d="M-4 -44 h12 M-4 -52 h12 M-4 -60 h11" stroke="${LN}" stroke-width="1.4" opacity=".45" stroke-linecap="round"/>
 <path d="M-12 -14 C-22 -18 -24 -34 -14 -40" fill="${SKL}" stroke="${LN}" stroke-width="2"/>`;
HAND.beads = () => `${HAND.fist()}<g transform="translate(0 -20)">${Array.from({ length: 9 }, (_, i) => { const a = Math.PI * .15 + i * Math.PI * .1; return `<circle cx="${(Math.cos(a) * 30 - 2).toFixed(1)}" cy="${(Math.sin(a) * 34 + 8).toFixed(1)}" r="5.4" fill="#6b3a1e"/><circle cx="${(Math.cos(a) * 30 - 3.6).toFixed(1)}" cy="${(Math.sin(a) * 34 + 6.4).toFixed(1)}" r="1.6" fill="#fff" opacity=".55"/>`; }).join('')}<path d="M-2 46 l-5 16 h10z" fill="#d8a64a"/></g>`;

function monkArm(sh, el, wr, hand, extra, bare, mirror, acc = '', abs = null) {
  const ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]) * 180 / Math.PI;
  const bx = el[0] + (wr[0] - el[0]) * .84, by = el[1] + (wr[1] - el[1]) * .84;
  const sa = Math.atan2(el[1] - sh[1], el[0] - sh[0]), nx = -Math.sin(sa), ny = Math.cos(sa), sang = sa * 180 / Math.PI;
  const upper = bare
    ? `<path d="M${P(sh)} L${P(el)}" stroke="${LN}" stroke-width="62" stroke-linecap="round" opacity=".55"/>
 <path d="M${P(sh)} L${P(el)}" stroke="${SK}" stroke-width="58" stroke-linecap="round"/>
 <path d="M${P([sh[0] + nx * 16, sh[1] + ny * 16])} L${P([el[0] + nx * 16, el[1] + ny * 16])}" stroke="${SKS}" stroke-width="14" stroke-linecap="round" opacity=".75"/>
 <path d="M${P([sh[0] - nx * 17, sh[1] - ny * 17])} L${P([el[0] - nx * 17, el[1] - ny * 17])}" stroke="${SKL}" stroke-width="6" stroke-linecap="round" opacity=".7"/>`
    : `<path d="M${P(sh)} L${P(el)}" stroke="${RBO}" stroke-width="64" stroke-linecap="round"/>
 <path d="M${P(sh)} L${P(el)}" stroke="${RB}" stroke-width="59" stroke-linecap="round"/>
 <path d="M${P(sh)} L${P(el)}" stroke="url(#__ID__weave)" stroke-width="59" stroke-linecap="round"/>
 <path d="M${P([sh[0] + nx * 16, sh[1] + ny * 16])} L${P([el[0] + nx * 16, el[1] + ny * 16])}" stroke="${RBS}" stroke-width="13" stroke-linecap="round" opacity=".8"/>
 <path d="M${P([sh[0] - nx * 18, sh[1] - ny * 18])} L${P([el[0] - nx * 18, el[1] - ny * 18])}" stroke="${RBL}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
 <g transform="rotate(${sang - 90} ${P(el)})"><path d="M${el[0] - 36} ${el[1] - 4} Q${el[0]} ${el[1] + 22} ${el[0] + 36} ${el[1] - 4} L${el[0] + 32} ${el[1] - 20} Q${el[0]} ${el[1] - 2} ${el[0] - 32} ${el[1] - 20}Z" fill="${RBL}" stroke="${RBO}" stroke-width="2"/><path d="M${el[0] - 30} ${el[1] - 9} Q${el[0]} ${el[1] + 11} ${el[0] + 30} ${el[1] - 9}" stroke="${RBS}" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/></g>`;
  const rot = abs === null ? ang + 90 + extra : abs;
  return `<g>${upper}
 <path d="M${P(el)} L${P(wr)}" stroke="${LN}" stroke-width="38" stroke-linecap="round" opacity=".55"/>
 <path d="M${P(el)} L${P(wr)}" stroke="${SK}" stroke-width="35" stroke-linecap="round"/>
 <path d="M${P([el[0] + 7, el[1]])} L${P([wr[0] + 7, wr[1]])}" stroke="${SKS}" stroke-width="9" stroke-linecap="round" opacity=".8"/>
 <path d="M${P([el[0] - 8, el[1]])} L${P([wr[0] - 8, wr[1]])}" stroke="${SKL}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
 ${bare ? `<g transform="rotate(${ang + 90} ${bx} ${by})"><rect x="${bx - 21}" y="${by - 4}" width="42" height="8" rx="4" fill="#3a1f10"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${bx - 15 + i * 5}" cy="${by}" r="3" fill="${i % 2 ? '#7a4524' : '#5c3119'}"/><circle cx="${bx - 15.8 + i * 5}" cy="${by - 1}" r=".9" fill="#fff" opacity=".6"/>`).join('')}</g>` : ''}
 <g transform="translate(${P(wr)}) rotate(${rot}) scale(${mirror ? -1 : 1} 1)">${HAND[hand]()}</g>${acc}</g>`;
}

/* ---------------- face (v2: after the laughing Budai porcelain ref — pear head, apple cheeks, crescent eyes, wide grin, long lobes) ---------------- */
function mEyes(o) {
  const lk = o.look || [0, 0], X = [168, 232];
  if (o.eyes === 'calm') return X.map(x => `<path d="M${x - 14} 232 Q${x} 242 ${x + 14} 232" stroke="${DK}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M${x - 16} 240 Q${x} 250 ${x + 16} 241" stroke="${LN}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>`).join('');
  const laughEye = x => `<path d="M${x - 15} 238 Q${x} 222 ${x + 15} 238" stroke="${DK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${x - 15} 238 Q${x} 230 ${x + 15} 238Z" fill="${DK}" opacity=".18"/><path d="M${x - 17} 245 Q${x} 254 ${x + 17} 245" stroke="${LN}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>${[-1, 1].map(k => `<path d="M${x + k * 18} 236 l${k * 7} -3 M${x + k * 18} 240 l${k * 7} 2" stroke="${LN}" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>`).join('')}`;
  if (o.exp === 'laugh') return X.map(laughEye).join('');
  if (o.eyes === 'wink') return `${laughEye(232)}<ellipse cx="168" cy="234" rx="10" ry="4.6" fill="#fff"/><circle cx="${168 + lk[0]}" cy="${233 + lk[1]}" r="3.8" fill="${DK}"/><path d="M155 234 Q168 224 181 233" stroke="${DK}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M152 244 Q168 252 184 244" stroke="${LN}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>`;
  const big = o.exp === 'o' ? 1.35 : 1;
  return X.map(x => `<ellipse cx="${x}" cy="234" rx="${10 * big}" ry="${4.6 * big}" fill="#fff"/><circle cx="${x + lk[0]}" cy="${233 + lk[1]}" r="${3.8 * big}" fill="${DK}"/><circle cx="${x + lk[0] - 1.3}" cy="${231.6 + lk[1]}" r="1.1" fill="#fff"/><path d="M${x - 13} ${234 - (big - 1) * 7} Q${x} ${224 - (big - 1) * 9} ${x + 13} ${233 - (big - 1) * 7}" stroke="${DK}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M${x - 15} 243 Q${x} 252 ${x + 15} 243" stroke="${LN}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".55"/>`).join('');
}
function mBrows(o) {
  const t = { normal: [0, 0, 0, 0], up: [-7, -7, -5, 5], skeptic: [2, -8, 5, 7], worry: [-5, -5, -11, 11], calm: [2, 2, 3, -3] }[o.brows || 'normal'];
  return `<path d="M148 ${206 + t[0]} q14 ${-12 + t[2] * .4} 32 ${-3 + t[2] * .3}" stroke="#4a3326" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M220 ${203 + t[1]} q18 ${-9 - t[3] * .2} 32 ${3 + t[3] * .3}" stroke="#4a3326" stroke-width="4.6" fill="none" stroke-linecap="round"/>`;
}
function mMouth(o, id) {
  const lip = '#a8454f', m = o.mouth || o.exp;
  const grin = (w, h, up) => { const d = `M${200 - w} 286 Q200 ${286 + h} ${200 + w} 286 Q200 ${286 + up} ${200 - w} 286Z`;
    return `<clipPath id="${id}m"><path d="${d}"/></clipPath><path d="${d}" fill="#5e1a1e"/><g clip-path="url(#${id}m)"><rect x="${200 - w}" y="282" width="${w * 2}" height="${8 + h * .12}" fill="#fff"/><path d="M${200 - w * .6} 282 v${8 + h * .12} M${200 - w * .2} 282 v${8 + h * .12} M${200 + w * .2} 282 v${8 + h * .12} M${200 + w * .6} 282 v${8 + h * .12}" stroke="#d8d2c8" stroke-width="1.2"/><ellipse cx="200" cy="${286 + h * .62}" rx="${w * .5}" ry="${h * .26}" fill="#c4555e"/></g><path d="${d}" fill="none" stroke="${lip}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${200 - w - 6} 282 q4 4 6 5 M${200 + w + 6} 282 q-4 4 -6 5" stroke="${LN}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`; };
  if (m === 'laugh') return grin(32, 36, 2);
  if (m === 'open') return grin(28, 26, 2);
  if (m === 'smile') return `<path d="M170 284 Q200 306 230 284" stroke="${lip}" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M164 279 q4 5 8 6 M236 279 q-4 5 -8 6" stroke="${LN}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`;
  if (m === 'smirk') return `<path d="M176 290 Q200 302 228 284" stroke="${lip}" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M232 280 q-3 5 -7 6" stroke="${LN}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`;
  if (m === 'shush') return `<ellipse cx="200" cy="292" rx="9" ry="5.5" fill="${lip}"/>`;
  if (m === 'o') return `<ellipse cx="200" cy="294" rx="10" ry="12" fill="#5e1a1e" stroke="${lip}" stroke-width="2.2"/>`;
  return mouth(o, id);
}
const SKULL = 'M200 106 C254 106 282 142 287 192 C291 232 304 266 294 296 C282 328 244 340 200 340 C156 340 118 328 106 296 C96 266 109 232 113 192 C118 142 146 106 200 106Z';
function mHead(o, id) {
  return `<path d="M168 300 L166 342 Q200 354 234 342 L232 300Z" fill="${SKS}"/>__BODY__${HG0}<g transform="translate(200 326) scale(1.13) translate(-200 -326)">
 <clipPath id="${id}sk"><path d="${SKULL}"/></clipPath>
 ${[110, 290].map((x, i) => { const k = i ? 1 : -1; return `<path d="M${x} 196 C${x + k * 16} 190 ${x + k * 22} 214 ${x + k * 20} 236 C${x + k * 18} 256 ${x + k * 16} 274 ${x + k * 18} 292 C${x + k * 20} 312 ${x + k * 8} 324 ${x - k * 2} 316 C${x - k * 8} 306 ${x - k * 4} 290 ${x - k * 4} 276Z" fill="${SKS}"/><path d="M${x + k * 6} 206 C${x + k * 13} 214 ${x + k * 14} 232 ${x + k * 9} 246" stroke="${LN}" stroke-width="1.8" fill="none" opacity=".6" stroke-linecap="round"/><ellipse cx="${x + k * 9}" cy="300" rx="8" ry="11" fill="${SKL}" opacity=".45"/>`; }).join('')}
 <path d="${SKULL}" fill="${SK}"/>
 <path d="${SKULL}" fill="url(#__ID__faceg)"/>
 <g clip-path="url(#${id}sk)"><rect x="96" y="100" width="208" height="96" fill="url(#__ID__shave)"/><rect x="96" y="100" width="208" height="96" fill="url(#__ID__stub)" mask="url(#${id}fm)"/></g>
 <ellipse cx="168" cy="140" rx="32" ry="14" fill="#fff" opacity=".28" transform="rotate(-24 168 140)"/><ellipse cx="156" cy="133" rx="10" ry="4.6" fill="#fff" opacity=".6" transform="rotate(-24 156 133)"/>
 <path d="M282 196 C300 238 300 282 276 310 C260 328 236 336 216 338 C246 320 270 290 276 258 C280 236 280 214 282 196Z" fill="${SKS}" opacity=".7"/>
 <path d="M172 166 q28 -8 56 0 M178 178 q22 -6 44 0" stroke="${LN}" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".42"/>
 <circle cx="146" cy="272" r="27" fill="${SKL}" opacity=".5"/><circle cx="254" cy="272" r="27" fill="${SKL}" opacity=".5"/>
 <ellipse cx="144" cy="276" rx="22" ry="13" fill="#e07d6c" opacity=".34" filter="url(#__ID__soft)"/><ellipse cx="256" cy="276" rx="22" ry="13" fill="#e07d6c" opacity=".34" filter="url(#__ID__soft)"/>
 <ellipse cx="138" cy="262" rx="8" ry="4.5" fill="#fff" opacity=".35"/><ellipse cx="248" cy="262" rx="8" ry="4.5" fill="#fff" opacity=".35"/>
 <path d="M176 262 C160 272 156 294 168 310 M224 262 C240 272 244 294 232 310" stroke="${SKS}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
 <path d="M164 324 C184 336 216 336 236 324" stroke="${SKS}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>
 <path d="M150 334 C176 346 224 346 250 334 C226 340 174 340 150 334Z" fill="${SKS}" opacity=".7"/>
 <g stroke="#2a130a" stroke-width="1.2" opacity=".4">${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${294 - i * 2.6}" y1="${250 + i * 8}" x2="${301 - i * 2.6}" y2="${242 + i * 8}"/>`).join('')}</g>
 ${mBrows(o)}${mEyes(o)}
 <path d="M200 240 C218 240 228 256 222 266 C216 274 184 274 178 266 C172 256 182 240 200 240Z" fill="${SKS}"/>
 <ellipse cx="186" cy="266" rx="6" ry="4" fill="${LN}" opacity=".35"/><ellipse cx="214" cy="266" rx="6" ry="4" fill="${LN}" opacity=".35"/>
 <ellipse cx="195" cy="251" rx="4" ry="4.4" fill="${SKL}" opacity=".8"/>
 ${mMouth(o, id)}</g>${HG1}`;
}

/* ---------------- robe (kasaya): over the left shoulder, right shoulder bare ---------------- */
const TORSO = 'M26 440 C28 364 82 326 200 322 C318 326 372 364 374 440Z';
const ROBE = 'M214 328 C272 330 338 346 362 386 C370 404 374 420 374 440 L56 440 C102 404 166 368 214 328Z';
function robe(o, id) {
  const beads = o.mala ? (() => { let s = ''; for (let i = 0; i <= 22; i++) { const t = i / 22, x = (1 - t) ** 2 * 166 + 2 * (1 - t) * t * 200 + t * t * 236, y = (1 - t) ** 2 * 330 + 2 * (1 - t) * t * 476 + t * t * 330; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.6" fill="${i % 2 ? '#6b3a1e' : '#5a2f16'}"/><circle cx="${(x - 1.6).toFixed(1)}" cy="${(y - 1.8).toFixed(1)}" r="1.6" fill="#fff" opacity=".5"/>`; } return `${s}<circle cx="200" cy="408" r="8" fill="#d8a64a"/><path d="M196 414 l-4 22 h16 l-4 -22z" fill="#c9952f"/><path d="M198 418 v16 M202 418 v16" stroke="#9a6d1c" stroke-width="1"/>`; })() : '';
  return `<path d="${TORSO}" fill="${SK}"/><path d="${TORSO}" fill="url(#__ID__skg)"/>
 <path d="M112 356 C136 348 158 350 178 344" stroke="${SKS}" stroke-width="3" fill="none" stroke-linecap="round"/>
 <path d="M84 404 C104 418 128 420 150 412" stroke="${SKS}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
 <path d="M214 328 C166 368 102 404 56 440" stroke="${SKS}" stroke-width="16" fill="none" opacity=".55" transform="translate(-7 -6)"/>
 <clipPath id="${id}rb"><path d="${ROBE}"/></clipPath>
 <path d="${ROBE}" fill="${RB}"/>
 <g clip-path="url(#${id}rb)"><rect x="0" y="300" width="400" height="160" fill="url(#__ID__weave)"/><rect x="0" y="300" width="400" height="160" fill="url(#__ID__robeg)"/>
  <g stroke="${RBD}" stroke-width="1.6" stroke-dasharray="3.5 3" fill="none" opacity=".55"><path d="M250 322 L170 446 M304 334 L234 446 M352 362 L300 446 M120 404 C200 380 290 372 380 386 M180 368 C240 350 300 348 370 360"/></g>
  <g fill="none" stroke-linecap="round"><path d="M300 344 C262 372 214 404 172 440" stroke="${RBS}" stroke-width="3" opacity=".8"/><path d="M336 362 C302 390 266 418 240 440" stroke="${RBS}" stroke-width="3" opacity=".8"/><path d="M354 394 C336 412 320 428 310 440" stroke="${RBS}" stroke-width="2.6" opacity=".7"/>
   <path d="M290 346 C254 372 208 402 166 432" stroke="${RBL}" stroke-width="2.2" opacity=".7"/><path d="M328 366 C296 392 262 416 236 434" stroke="${RBL}" stroke-width="2" opacity=".6"/></g></g>
 <path d="M214 328 C166 368 102 404 56 440" stroke="${RBO}" stroke-width="20" fill="none"/>
 <path d="M214 328 C166 368 102 404 56 440" stroke="${RBL}" stroke-width="16" fill="none"/>
 <path d="M214 328 C166 368 102 404 56 440" stroke="url(#__ID__weave)" stroke-width="16" fill="none"/>
 <path d="M220 334 C172 374 110 410 66 444" stroke="${RBS}" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>
 <path d="M210 324 C162 364 98 400 52 436" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>
 <path d="M296 340 C330 358 352 392 356 440 L326 440 C326 402 316 368 296 340Z" fill="${RBS}" opacity=".6"/>
 ${beads}`;
}
function mDefs(id) {
  return `<pattern id="${id}weave" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><rect width="6" height="1.2" fill="#000" opacity=".12"/><rect y="3" width="6" height=".8" fill="#fff" opacity=".12"/><rect width=".8" height="6" fill="#000" opacity=".06"/></pattern>
 <pattern id="${id}stub" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".55" fill="#4a3326" opacity=".35"/><circle cx="3" cy="3" r=".45" fill="#4a3326" opacity=".25"/></pattern>
 <linearGradient id="${id}shave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6c5c" stop-opacity=".22"/><stop offset=".75" stop-color="#8a6c5c" stop-opacity=".08"/><stop offset="1" stop-color="#8a6c5c" stop-opacity="0"/></linearGradient>
 <linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <mask id="${id}fm" maskUnits="userSpaceOnUse" x="96" y="96" width="208" height="100"><rect x="96" y="96" width="208" height="100" fill="url(#${id}fade)"/></mask>
 <linearGradient id="${id}robeg" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd08a" stop-opacity=".35"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5a2208" stop-opacity=".3"/></linearGradient>
 <linearGradient id="${id}skg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKL}" stop-opacity=".3"/><stop offset="1" stop-color="#8a5a3a" stop-opacity=".35"/></linearGradient>`;
}

function monk(o) {
  const id = 'm' + (UID++);
  const h = mHead(o, id).replace('__BODY__', robe(o, id));
  const inner = (h + o.arms.map(a => monkArm(...a)).join('') + (o.extra || '')).split('__ID__').join(id);
  const sh = o.shadow || [15, 5];
  return `<defs>${texDefs(id)}${mDefs(id)}<mask id="${id}sm" maskUnits="userSpaceOnUse" x="-200" y="-200" width="800" height="900"><g transform="translate(${sh[0]} ${sh[1]})" filter="url(#${id}wh)"><use href="#${id}ch"/></g></mask></defs>
 ${o.glowc === null ? '' : htGlow(212, 236, o.glowR || 182, o.glowc || '#e8a317', o.glowOp || .42)}
 <rect x="-200" y="-200" width="800" height="900" fill="url(#${id}ht)" mask="url(#${id}sm)" opacity="${o.shadowOp || .9}"/>
 <g id="${id}ch" filter="url(#${id}tex)">${inner}</g>`;
}

/* poses: arm = [shoulder, elbow, wrist, hand, extraRot, bare, mirror, accessory, absRot]
   his right arm (viewer's left, MSH_L) is bare; his left arm (MSH_R) is under the robe */
const MPOSE = {
  calm: { eyes: 'calm', brows: 'calm', exp: 'smile', mala: 1, arms: [[MSH_L, [104, 438], [188, 408], 'flat', 0, 1, 0, '', 0], [MSH_R, [296, 438], [212, 408], 'flat', 0, 0, 1, '', 0]] },
  explain: { exp: 'laugh', mouth: 'open', brows: 'up', arms: [[MSH_L, [56, 334], [50, 264], 'open', -25, 1, 0], [MSH_R, [344, 334], [350, 264], 'open', 25, 0, 1]] },
  point: { exp: 'smirk', brows: 'skeptic', look: [-3, 0], mala: 1, arms: [[MSH_R, [344, 326], [326, 266], 'point', 4, 0, 1]] },
  laugh: { exp: 'laugh', mouth: 'laugh', brows: 'up', mala: 1, arms: [] },
  shock: { exp: 'o', brows: 'up', arms: [[MSH_L, [62, 424], [104, 334], 'open', 8, 1, 0], [MSH_R, [338, 424], [296, 334], 'open', -8, 0, 1]] },
  phone: { exp: 'open', brows: 'skeptic', arms: [[MSH_L, [90, 414], [148, 358], 'fist', 0, 1, 0, phone(148, 318, -8)], [MSH_R, [344, 328], [326, 268], 'point', 4, 0, 1]] },
  thumb: { eyes: 'wink', exp: 'laugh', mouth: 'laugh', brows: 'up', mala: 1, arms: [[MSH_R, [344, 330], [324, 272], 'thumb', 0, 0, 1]] },
  beads: { eyes: 'calm', brows: 'calm', exp: 'smile', arms: [[MSH_L, [80, 424], [140, 372], 'beads', 10, 1, 0]] },
  worry: { exp: 'o', brows: 'worry', look: [-3, 1], mala: 1, arms: [] },
  laptop: { exp: 'smirk', brows: 'skeptic', look: [0, 3], arms: [], extra: laptop },
};

window.MONK = (o, x, y, w) => `<svg x="${x}" y="${y}" width="${w}" height="${w * 1.1}" viewBox="0 0 400 440" overflow="visible">${monk({ arms: [], ...o })}</svg>`;
window.MPOSE = MPOSE;

/* ================= FULL BODY (2026-11-18) =================
   Same head + robe language, whole figure. kind: 'stand' (viewBox 0 0 400 800) or 'sit' (cross-legged like the
   porcelain ref, viewBox -60 0 520 720). window.MONKFULL(o, x, y, w) → nested svg. Arms use monkArm (same spec). */
const EDGE = 'M214 328 C166 368 102 404 56 440 C44 450 36 458 28 468';
const TRUNK = 'M200 324 C250 324 290 340 304 356 C344 380 360 430 362 492 C364 560 334 604 200 610 C66 604 36 560 38 492 C40 430 56 380 96 356 C110 340 150 324 200 324Z';
function belly(id, bottom = 610) {
  return `<clipPath id="${id}tr"><path d="${TRUNK}"/></clipPath>
 <path d="${TRUNK}" fill="${SK}"/><path d="${TRUNK}" fill="url(#__ID__skg)"/>
 <path d="M112 356 C136 348 158 350 178 344" stroke="${SKS}" stroke-width="3" fill="none" stroke-linecap="round"/>
 <path d="M214 328 C166 368 102 404 56 440" stroke="${SKS}" stroke-width="16" fill="none" opacity=".55" transform="translate(-7 -6)"/>
 <g clip-path="url(#${id}tr)">
  <path d="${EDGE} L0 700 L420 700 L420 300 L214 300Z" fill="${RB}"/>
  <path d="${EDGE} L0 700 L420 700 L420 300 L214 300Z" fill="url(#__ID__weave)"/>
  <path d="${EDGE} L0 700 L420 700 L420 300 L214 300Z" fill="url(#__ID__robeg)"/>
  <ellipse cx="236" cy="476" rx="96" ry="70" fill="${RBL}" opacity=".35"/>
  <ellipse cx="248" cy="458" rx="40" ry="22" fill="#fff" opacity=".16" transform="rotate(-20 248 458)"/>
  <g fill="none" stroke-linecap="round">
   <path d="M60 520 C110 596 290 596 340 520" stroke="${RBS}" stroke-width="3.2" opacity=".85"/>
   <path d="M84 556 C140 610 260 610 316 556" stroke="${RBS}" stroke-width="2.6" opacity=".7"/>
   <path d="M300 344 C262 372 214 404 172 440" stroke="${RBS}" stroke-width="3" opacity=".8"/>
   <path d="M340 380 C320 420 316 470 330 520" stroke="${RBS}" stroke-width="3" opacity=".75"/>
   <path d="M120 470 C150 440 200 420 250 420" stroke="${RBL}" stroke-width="2.4" opacity=".7"/>
  </g>
  <g stroke="${RBD}" stroke-width="1.6" stroke-dasharray="3.5 3" fill="none" opacity=".5"><path d="M250 322 L170 520 M310 340 L250 600 M110 500 C200 470 300 470 370 486"/></g>
 </g>
 <path d="${EDGE}" stroke="${RBO}" stroke-width="20" fill="none"/><path d="${EDGE}" stroke="${RBL}" stroke-width="16" fill="none"/><path d="${EDGE}" stroke="url(#__ID__weave)" stroke-width="16" fill="none"/>
 <path d="M220 334 C172 374 110 410 66 444" stroke="${RBS}" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>
 <path d="M210 324 C162 364 98 400 52 436" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>`;
}
const SASH = (y) => `<path d="M64 ${y} C140 ${y + 22} 260 ${y + 22} 336 ${y} L338 ${y + 18} C262 ${y + 40} 138 ${y + 40} 62 ${y + 18}Z" fill="${RBD}"/><path d="M64 ${y} C140 ${y + 22} 260 ${y + 22} 336 ${y}" stroke="${RBL}" stroke-width="2" fill="none" opacity=".6"/>
 <g transform="translate(262 ${y + 24})"><path d="M0 0 C-8 18 -6 40 -12 58 L2 58 C4 40 6 20 0 0Z M0 0 C10 16 14 34 16 50 L28 48 C22 30 14 14 0 0Z" fill="${RBS}" stroke="${RBO}" stroke-width="1.6"/><ellipse cx="0" cy="0" rx="12" ry="8" fill="${RBD}" stroke="${RBO}" stroke-width="1.6"/></g>`;
const foot = (x, y, k = 1, sole = 1) => `<g transform="translate(${x} ${y}) scale(${k} 1)">${sole ? `<ellipse cx="0" cy="14" rx="34" ry="8" fill="#4a2d1a"/><ellipse cx="0" cy="11" rx="33" ry="7" fill="#7a4a2a"/>` : ''}
 <path d="M-30 8 C-32 -10 -14 -18 6 -16 C24 -14 34 -4 32 8Z" fill="${SK}"/><path d="M-30 8 C-32 -10 -14 -18 6 -16" stroke="${SKL}" stroke-width="3" fill="none" opacity=".7"/>
 ${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${-6 + i * 8.6}" cy="${4 - Math.abs(i - 1) * .6}" rx="${i ? 4.2 : 5.6}" ry="${i ? 5 : 6}" fill="${SKL}" stroke="${LN}" stroke-width="1.4"/>`).join('')}
 ${sole ? `<path d="M-2 -4 L8 -16 M8 -16 L22 -6" stroke="#4a2d1a" stroke-width="5" stroke-linecap="round" fill="none"/>` : ''}</g>`;
function standBody(o, id) {
  return `<path d="M88 596 C82 660 90 712 102 748 L298 748 C310 712 318 660 312 596Z" fill="${RB}"/>
 <path d="M88 596 C82 660 90 712 102 748 L298 748 C310 712 318 660 312 596Z" fill="url(#__ID__weave)"/>
 <path d="M88 596 C82 660 90 712 102 748 L298 748 C310 712 318 660 312 596Z" fill="url(#__ID__robeg)"/>
 <g stroke="${RBS}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"><path d="M140 616 C134 660 136 704 142 744 M200 620 C198 666 200 706 202 744 M258 616 C264 660 262 704 256 744"/></g>
 <path d="M102 734 C160 744 240 744 298 734 L298 748 L102 748Z" fill="${RBD}"/>
 ${foot(158, 756, -1)}${foot(242, 756, 1)}
 ${belly(id)}${SASH(586)}`;
}
function sitBody(o, id) {
  const LAP = 'M-34 640 C-44 598 -4 560 80 552 C140 546 260 546 320 552 C404 560 444 598 434 640 C428 676 380 690 200 690 C20 690 -28 676 -34 640Z';
  return `<path d="${LAP}" fill="${RB}"/><path d="${LAP}" fill="url(#__ID__weave)"/><path d="${LAP}" fill="url(#__ID__robeg)"/>
 <ellipse cx="22" cy="628" rx="58" ry="40" fill="${RBL}" opacity=".35"/><ellipse cx="378" cy="628" rx="58" ry="40" fill="${RBS}" opacity=".35"/>
 <g stroke="${RBS}" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".8"><path d="M-10 662 C60 684 140 680 190 664 M210 664 C260 680 340 684 410 662 M40 590 C80 610 110 640 120 680 M360 590 C320 610 290 640 280 680"/></g>
 <path d="M-34 640 C-28 676 20 690 200 690 C380 690 428 676 434 640 C420 664 380 676 200 676 C20 676 -20 664 -34 640Z" fill="${RBD}" opacity=".7"/>
 <g transform="translate(150 650) rotate(-8)"><path d="M-40 6 C-44 -14 -18 -26 12 -24 C38 -22 50 -8 46 8 C40 22 -36 24 -40 6Z" fill="${SK}"/><path d="M-30 4 C-20 -10 10 -14 34 -4" stroke="${SKS}" stroke-width="3" fill="none"/>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${48}" cy="${-14 + i * 6.6}" rx="5" ry="3.6" fill="${SKL}" stroke="${LN}" stroke-width="1.3"/>`).join('')}</g>
 <g transform="translate(262 646) rotate(10) scale(-1 1)"><path d="M-40 6 C-44 -14 -18 -26 12 -24 C38 -22 50 -8 46 8 C40 22 -36 24 -40 6Z" fill="${SK}"/><ellipse cx="0" cy="-2" rx="26" ry="11" fill="#e8a88a" opacity=".5"/>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${48}" cy="${-14 + i * 6.6}" rx="5" ry="3.6" fill="${SKL}" stroke="${LN}" stroke-width="1.3"/>`).join('')}</g>
 ${belly(id)}${SASH(572)}`;
}
function monkFull(o) {
  const id = 'f' + (UID++);
  const h = mHead(o, id).replace('__BODY__', o.kind === 'sit' ? sitBody(o, id) : standBody(o, id));
  const inner = (h + o.arms.map(a => monkArm(...a)).join('') + (o.extra || '')).split('__ID__').join(id);
  const sh = o.shadow || [15, 6];
  return `<defs>${texDefs(id)}${mDefs(id)}<mask id="${id}sm" maskUnits="userSpaceOnUse" x="-300" y="-200" width="1000" height="1200"><g transform="translate(${sh[0]} ${sh[1]})" filter="url(#${id}wh)"><use href="#${id}ch"/></g></mask></defs>
 ${o.glowc === null ? '' : htGlow(212, 236, o.glowR || 182, o.glowc || '#e8a317', o.glowOp || .42)}
 <rect x="-300" y="-200" width="1000" height="1200" fill="url(#${id}ht)" mask="url(#${id}sm)" opacity="${o.shadowOp || .9}"/>
 <g id="${id}ch" filter="url(#${id}tex)">${inner}</g>`;
}
/* full-body poses: same arm spec as MPOSE */
const FPOSE = {
  stand: { kind: 'stand', exp: 'smile', arms: [[MSH_L, [70, 452], [132, 506], 'open', 0, 1, 0, '', 112], [MSH_R, [330, 452], [268, 506], 'open', 0, 0, 1, '', -112]] },
  wave: { kind: 'stand', exp: 'laugh', mouth: 'open', brows: 'up', arms: [[MSH_L, [50, 330], [56, 252], 'open', -20, 1, 0], [MSH_R, [330, 452], [268, 506], 'open', 0, 0, 1, '', -112]] },
  pray: { kind: 'stand', eyes: 'calm', brows: 'calm', exp: 'smile', arms: [[MSH_L, [104, 438], [188, 408], 'flat', 0, 1, 0, '', 0], [MSH_R, [296, 438], [212, 408], 'flat', 0, 0, 1, '', 0]] },
  belly: { kind: 'stand', exp: 'laugh', mouth: 'laugh', brows: 'up', arms: [[MSH_L, [60, 470], [128, 560], 'open', 80, 1, 0], [MSH_R, [340, 470], [272, 560], 'open', -80, 0, 1]] },
  sit: { kind: 'sit', exp: 'laugh', mouth: 'laugh', brows: 'up', arms: [[MSH_L, [46, 488], [14, 586], 'open', 0, 1, 0, '', 178], [MSH_R, [352, 494], [318, 600], 'beads', 0, 0, 1, '', 172]] },
  meditate: { kind: 'sit', eyes: 'calm', brows: 'calm', exp: 'smile', arms: [[MSH_L, [60, 480], [150, 584], 'open', 100, 1, 0], [MSH_R, [340, 480], [250, 584], 'open', -100, 0, 1]] },
};
window.MONKFULL = (o, x, y, w) => { const vb = o.kind === 'sit' ? [-60, 0, 520, 720] : [0, 0, 400, 800]; return `<svg x="${x}" y="${y}" width="${w}" height="${w * vb[3] / vb[2]}" viewBox="${vb.join(' ')}" overflow="visible">${monkFull({ arms: [], ...o })}</svg>`; };
window.FPOSE = FPOSE;
