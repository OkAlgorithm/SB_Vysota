const shapes = {
  route:'<path d="M8 19h8a3 3 0 1 0 0-6H8a3 3 0 1 1 0-6h8"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="7" r="2"/>',
  mountain:'<path d="m2 19 8-13 4.4 7 2.3-3.5L22 19H2Z"/><path d="m7 10.8 3 1.8 2.5-1.7"/>',
  bolt:'<path d="m13.5 2-9 12h6l-.7 8 9.7-12h-6.2l.2-8Z"/>',
  flame:'<path d="M12.4 2c-.3 4.7 4 5.6 4 9.4 1.4-.6 1.8-1.7 2-2.6 1.4 1.8 2.4 3.8 2.4 6 0 4.1-3.6 7.2-8.4 7.2-4.9 0-8-3.2-8-7.2 0-2.6 1.6-5.1 4.4-7.7 0 2.2.6 3 1.3 3.2-.1-3.3 1.1-6.7 2.3-8.3Z"/><path d="M9.6 17.7c0-1.5 1.2-3 2.4-4 1.5 1.6 2.7 2.8 2.7 4.3 0 1.1-1 2.1-2.6 2.1s-2.5-1-2.5-2.4Z"/>',
  trophy:'<path d="M7 3h10v6c0 3.3-1.9 5-5 5s-5-1.7-5-5V3Zm5 11v5m-4 2h8M7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>',
  book:'<path d="M12 6C9.5 3.9 6.5 3.7 3 5v14c3.5-1.3 6.5-1.1 9 1.2 2.5-2.3 5.5-2.5 9-1.2V5c-3.5-1.3-6.5-1.1-9 1Zm0 0v14"/>',
  film:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 4v16m10-16v16M3 9h4m-4 6h4m10-6h4m-4 6h4m-10-6 4 3-4 3V9Z"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2 5.6-5.6 2 2-5.6 5.6-2Z"/>',
  clipboard:'<rect x="5" y="5" width="14" height="16" rx="3"/><rect x="9" y="3" width="6" height="4" rx="1.5"/><path d="m8.5 14 2.6 2.5 4.4-4.5"/>',
  search:'<circle cx="10.3" cy="10.3" r="5.8"/><path d="m14.7 14.7 5.3 5.3m-13-9.7h6.6m-3.3-3.3v6.6"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>',
  flag:'<path d="M5 22V3m0 1c4-3 8 2 14-1v11c-6 3-10-2-14 1"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left:'<path d="M20 12H5m6-6-6 6 6 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  check:'<path d="m4.5 12 5 5 10-10"/>',
  close:'<path d="m6 6 12 12m0-12L6 18"/>',
  star:'<path d="m12 2 3 6.6 7 .8-5.2 5 1.4 7L12 18l-6.2 3.4 1.4-7L2 9.4l7-.8L12 2Z"/>',
  shield:'<path d="M12 2c3 2.2 6.4 3 8.5 3.5v6c0 5.5-3.6 8.2-8.5 10.5C7.1 19.7 3.5 17 3.5 11.5v-6C5.6 5 9 4.2 12 2Z"/><path d="m8.8 12 2 2 4.4-4.2"/>',
  turn:'<path d="M3 11a9 9 0 1 1 3.1 7.7M3 11V5m0 6h6"/>',
  sound:'<path d="M3 9h4l5-4v14l-5-4H3V9Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute:'<path d="M3 9h4l5-4v14l-5-4H3V9Zm13 1 5 5m0-5-5 5"/>',
  boot:'<path d="M5 3h8v11l5 1.7c2 .7 3 2 3 4.3H3v-5l2-4V3Zm0 9h6m-7 4h8"/>',
  fence:'<path d="M4 5v14m16-14v14M4 8h16M4 15h16M8 8l4 7m1-7 4 7"/>',
  link:'<path d="m10 7 2.5-2.5a4.9 4.9 0 0 1 7 7L17 14m-3 3-2.5 2.5a4.9 4.9 0 0 1-7-7L7 10m1 6 8-8"/>',
  rope:'<path d="M6 21c0-7 12-5 12-12 0-3-2.2-5-6-5-3.8 0-6 2-6 5 0 7 12 5 12 12"/>',
  corner:'<path d="M4 19V9a4 4 0 0 1 4-4h12M9 19V10h11m-5 5 5-5"/>',
  tool:'<path d="m13.8 11.2-8 8a2 2 0 1 1-2.8-2.8l8-8a5.8 5.8 0 0 1 7.1-6.1l-3.7 3.5 3.8 3.8 3.5-3.7a5.8 5.8 0 0 1-7.9 5.3Z"/>',
  box:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v10M7.5 5l9 4"/>',
  radio:'<rect x="6" y="8" width="12" height="13" rx="2"/><path d="M9 8V3m1 9h4m-4 4h4m-4 2h4"/>',
  heart:'<path d="M12 21 4.3 13.3a4.9 4.9 0 0 1 7-7l.7.7.7-.7a4.9 4.9 0 0 1 7 7L12 21Z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 3 3v1m0 3h.01"/>'
};

export function icon(name, size = 24) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shapes[name] || shapes.star}</svg>`;
}

const equipment = {
  harness:'<path d="M100 61c-28 8-46 40-43 75l9 37q-18 18-10 32c6 12 23 15 35 5l29-29 29 29c12 10 29 7 35-5q8-14-10-32l9-37c3-35-15-67-43-75l-12 44h-16Z" fill="#eeaf5c" stroke="#492e70" stroke-width="9"/><path d="m63 143 57-22 57 22M72 161l48 22 47-23M88 72l24 59m41-59-20 58" stroke="#6750b3" stroke-width="12" stroke-linecap="round"/><rect x="103" y="114" width="35" height="29" rx="5" fill="#d3e5e8" stroke="#322454" stroke-width="6"/><rect x="115" y="122" width="12" height="13" rx="2" fill="#322454"/>',
  gate:'<path d="M92 75q16-24 46-12l27 13q20 10 15 33l-27 75q-12 32-43 23l-34-12q-29-11-20-38Z" fill="none" stroke="#453069" stroke-width="23"/><path d="M92 75q16-24 46-12l27 13q20 10 15 33l-27 75q-12 32-43 23l-34-12q-29-11-20-38Z" fill="none" stroke="#a7c9d2" stroke-width="14"/><path d="m161 120-19 42" stroke="#586c93" stroke-width="15"/><path d="m151 126 14 6m-18 2 14 6m-18 2 14 6" stroke="#ffc794" stroke-width="4"/>',
  gateOpen:'<path d="M92 75q16-24 46-12l27 13q20 10 15 33l-9 23m-16 33-2 19q-12 32-43 23l-34-12q-29-11-20-38Z" fill="none" stroke="#453069" stroke-width="22"/><path d="M92 75q16-24 46-12l27 13q20 10 15 33l-9 23m-16 33-2 19q-12 32-43 23l-34-12q-29-11-20-38Z" fill="none" stroke="#a7c9d2" stroke-width="13"/><path d="m152 169-30-40" stroke="#586c93" stroke-width="10"/>',
  rope:'<path d="M68 196c83 5 104-24 104-75 0-30-18-52-50-52-35 0-54 21-54 53 0 32 20 53 52 53 26 0 43-17 43-43 0-22-14-39-39-39-23 0-36 14-36 35 0 20 12 29 32 29 17 0 26-9 26-23 0-12-6-18-18-18" fill="none" stroke="#4d356f" stroke-width="15" stroke-linecap="round"/><path d="M68 196c83 5 104-24 104-75 0-30-18-52-50-52-35 0-54 21-54 53 0 32 20 53 52 53 26 0 43-17 43-43 0-22-14-39-39-39-23 0-36 14-36 35 0 20 12 29 32 29 17 0 26-9 26-23 0-12-6-18-18-18" fill="none" stroke="#ffca72" stroke-width="9" stroke-linecap="round" stroke-dasharray="9 3"/>',
  pulley:'<path d="M89 74q30-22 62 0l20 38v52q0 26-25 41H92q-23-12-23-37v-53Z" fill="#8da5d5" stroke="#462f6d" stroke-width="9"/><circle cx="120" cy="135" r="38" fill="#b7ead8" stroke="#462f6d" stroke-width="8"/><circle cx="120" cy="135" r="14" fill="#734ba2"/><circle cx="120" cy="79" r="9" fill="#efe3ff"/>',
  descender:'<path d="M89 67q38-16 65 13l20 40-12 67q-10 21-32 20l-30-8q-22-5-25-30L63 99Z" fill="#9cabea" stroke="#462f6d" stroke-width="9"/><circle cx="120" cy="124" r="27" fill="#d2eae1" stroke="#462f6d" stroke-width="7"/><path d="m144 149 44 31" stroke="#462f6d" stroke-width="13" stroke-linecap="round"/><circle cx="100" cy="83" r="9" fill="#f2e4ff"/>'
};

export function prop(asset, id, zoom) {
  const name = id === 'g3' ? 'gateOpen' : asset;
  const details = id === 'g1' ? '<path d="m88 147 8-11-3 14 9-8" fill="none" stroke="#ae2d3d" stroke-width="4" stroke-linecap="round"/>' : '';
  return `<svg class="prop-art${zoom ? ' zoomed' : ''}" width="238" height="233" viewBox="0 27 240 200" aria-hidden="true">
    <ellipse cx="120" cy="205" rx="79" ry="12" fill="#8464b5" opacity=".10"/>
    ${equipment[name] || equipment.harness}${details}
  </svg>`;
}

export function schematic() {
  return `<svg aria-hidden="true" class="site-drawing" width="760" height="390" viewBox="0 0 760 390" preserveAspectRatio="xMidYMid slice">
    <defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#8882c5" opacity=".27"/></pattern></defs>
    <rect width="760" height="390" fill="#e9eaff"/>
    <rect width="760" height="390" fill="url(#dots)"/>
    <path d="M68 339 312 239l371 61-189 66Z" fill="#d4d4f3" stroke="#c3c4e9" stroke-width="3"/>
    <path d="M189 297v-143l14-3 9 8v140m304 32V142l19-15 10 12v178" fill="#7f70be" stroke="#5c4790" stroke-width="5"/>
    <path d="m175 152 155-66 248 49-126 67Z" fill="#b4d9dc" stroke="#665aaa" stroke-width="5"/>
    <path d="M175 152v19l277 52v-21m0 21 126-68v-20" fill="#8273bf" stroke="#665aaa" stroke-width="5"/>
    <path d="m185 148 2-32 142-62 239 47 2 31m-383-16 261 51 120-66m-120 66v33m-209-74v37m74-23v37m72-24v38m121-55v37m-146-113v29" fill="none" stroke="#4f9a98" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M291 121v-89l124 23m-124-23-21 8m141 15v42m-33-48v47" fill="none" stroke="#654fba" stroke-width="8" stroke-linecap="round"/>
    <path d="M378 95c-6 35-24 52-15 90s5 49 1 78m48-166c6 39-21 64-16 98s13 48 9 79" fill="none" stroke="#c2814a" stroke-width="5" stroke-linecap="round"/>
    <path d="m251 302 113 22 114-32" fill="none" stroke="#dc984c" stroke-dasharray="10 9" stroke-width="5" stroke-linecap="round"/>
    <path d="m254 294 113 20 114-31m-227-5v27m35-21v26m38-20v27m40-22v31m37-36v25m40-38v25m36-37v27" fill="none" stroke="#b7744d" stroke-width="3" stroke-linecap="round"/>
    <path d="m463 148 25-10 22 5-25 11Zm0 0v17l21 6v-17m0 17 26-13v-15" fill="#f3b963" stroke="#7d4a70" stroke-width="3"/>
  </svg>`;
}
