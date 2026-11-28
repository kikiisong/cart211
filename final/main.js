// Placeholder pictures. To use your own art, set a scene's image to a file path or URL.
function art(sky, ground, orb, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
    <rect width="640" height="360" rx="16" fill="${sky}"/><circle cx="480" cy="100" r="48" fill="${orb}"/>
    <path d="M0 260 Q170 180 340 260 T640 240 V344 Q640 360 624 360 H16 Q0 360 0 344Z" fill="${ground}"/>
    <text x="24" y="40" font-family="sans-serif" font-size="20" fill="${orb}">${label}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const story = {
  A: [
    { type:'title', leftImage:'assets/title-a-left.png', leftAlt:'text', rightImage:'assets/title-a-right.png', rightAlt:'drawing' },
    { type:'duo', text:'Girl 1 and girl 2 met. Girl 2 was new to the city.',
  leftImage:'assets/p1-a-left.png', leftAlt:'girl 1',
  rightImage:'assets/p1-a-right.png', rightAlt:'girl 2' },
    { type:'bubbles',
  text:'Girl 1 introduced girl 2 to everything she liked.',
  bubbles:[
    { prompt:'click to reveal the memory', memory:'Her favorite cafe is Rabbit House' },
    { prompt:'', memory:'Her favorite movie is Scream' },
    { prompt:'', memory:'Her favorite artist is toe' }
  ] },
  { type:'duo', fadeLeft:true,
  text:'Girl 1 says she needs to focus on school, so they stop hanging out so often.',
  leftImage:'assets/p1-a-left.png', leftAlt:'girl 1',
  rightImage:'assets/p1-a-right.png', rightAlt:'girl 2' },
  { type:'chat',
  text:'Girl 2 love bombs girl 1 with info and hangout plans that are catered to her taste.',
  messages:[
    { image:'assets/p4-a-bubble1.png', alt:'cafe' },
    { image:'assets/p4-a-bubble2.png', alt:'movie' },
    { image:'assets/p4-a-bubble3.png', alt:'concert' }
  ] },
    { type:'end',   image:art('#e7a6a1','#5b4a63','#ffe9b0','A · Last scene'), text:'That is how I remember it. Is there another side to this?' }
  ],
  B: [
    { type:'title', leftImage:'assets/a-left.png', leftAlt:'text', rightImage:'assets/a-right.png', rightAlt:'drawing' },
    { type:'scene', image:art('#2d3566','#1f4a44','#e8ecff','B · Scene 1'), text:'The morning was clear when I was followed. The path ahead looked too easy.' },
    { type:'scene', image:art('#3a2c5c','#2c2a38','#f2c14e','B · Scene 2'), text:'By nightfall I reached the hills. Everything seemed out of place.' },
    { type:'end',   image:art('#14162e','#3b2438','#f27e6b','B · Last scene'), text:'That is what really happened. Or would you rather believe the first one?' }
  ]
};

const QUIET_MS = 200;   // wheel must pause this long before a new scroll counts
const DURATION = 0.8;   // seconds per scene transition

const $ = id => document.getElementById(id);
const stage = $('stage');
let version = 'A', index = 0, busy = false, scenes = [];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function render() {
  document.body.dataset.version = version;
  stage.innerHTML = story[version].map(s =>  {
    if (s.type === 'title') {
      return `<section class="scene title-scene">
        <div class="title-left">
          <img class="item" src="${s.leftImage}" alt="${s.leftAlt}">
        </div>
        <img class="title-right" src="${s.rightImage}" alt="${s.rightAlt}">
      </section>`;
    }
    else if (s.type === 'duo') {
      return `<section class="scene duo-scene">
        <div class="duo-text"><p class="item">${s.text}</p></div>
        <div class="duo-images">
           <img class="${s.fadeLeft ? 'fade-away' : ''}" src="${s.leftImage}" alt="${s.leftAlt}">
          <img src="${s.rightImage}" alt="${s.rightAlt}">
        </div>
      </section>`;
    }
    else if (s.type === 'bubbles') {
      return `<section class="scene bubble-scene">
        <div class="bubble-text"><p class="item">${s.text}</p></div>
        <div class="bubbles item">
          ${s.bubbles.map((b, i) => `<button type="button" class="bubble" data-memory="${b.memory}" aria-live="polite" aria-label="${b.prompt || 'Reveal memory ' + (i + 1)}">${b.prompt}</button>`).join('')}
        </div>
      </section>`;
    }
    if (s.type === 'chat') {
      return `<section class="scene chat-scene">
        <div class="chat-text"><p class="item">${s.text}</p></div>
        <button type="button" class="chat-stack">
          ${s.messages.map((m, i) => `<img class="chat-msg ${i === 0 ? 'shown' : ''}" style="--i:${i}" src="${m.image}" alt="${m.alt}">`).join('')}
        </button>
      </section>`;
    }
    return `<section class="scene">
      ${s.image ? `<img class="art item" src="${s.image}" alt="${s.alt || 'Placeholder scenery'}">` : ''}
      ${s.text ? `<p class="item">${s.text}</p>` : ''}
      ${s.type === 'end' ? `<button class="switch item" role="switch" aria-checked="${version === 'B'}" aria-label="Show version B">
        <span>A</span><span class="track"><span class="knob"></span></span><span>B</span></button>` : ''}
    </section>`;
  }).join('');
  scenes = [...stage.children];
  gsap.set(scenes, { autoAlpha:0 });
  gsap.set(scenes[index], { autoAlpha:1 });
  const toggle = stage.querySelector('.switch');
  toggle.addEventListener('click', () => switchVersion(toggle));
}

function updateUI() {
     document.body.classList.toggle('on-title', index === 0);
  $('where').textContent = `Version ${version} · Page ${index + 1}/${story[version].length}`;
  $('state').textContent = busy ? 'locked' : 'ready';
  $('prev').disabled = index === 0;
  $('next').disabled = index === story[version].length - 1;
}

function animateIn(scene) {
  return gsap.fromTo(scene.querySelectorAll('.item'),
    { y: reduced ? 0 : 24, opacity:0 },
    { y:0, opacity:1, duration: reduced ? .2 : .5, stagger: reduced ? 0 : .12, delay: reduced ? 0 : .35 });
}

function goTo(target) {
  if (busy || target === index || target < 0 || target >= scenes.length) return;
  busy = true;
  const dir = target > index ? 1 : -1;
  const from = scenes[index], to = scenes[target];
  index = target;
  const fading = to.querySelector('.fade-away');
  if (fading) {                       // show it again on every visit
    gsap.killTweensOf(fading);
    gsap.set(fading, { opacity:1 });
  }
  updateUI();
  const tl = gsap.timeline({ onComplete: () => {
    gsap.set(from, { autoAlpha:0 });
    busy = false; updateUI();
     if (fading) gsap.to(fading, { opacity:0, delay:0.5, duration:3, ease:'power1.inOut' });
  }});
  gsap.set(to, { autoAlpha: reduced ? 0 : 1, yPercent: reduced ? 0 : 100 * dir, zIndex:2 });
  gsap.set(from, { zIndex:1 });
  if (reduced) tl.to(to, { autoAlpha:1, duration:.2 }, 0);
  else {
    tl.to(to, { yPercent:0, duration:DURATION, ease:'power3.inOut' }, 0)
      .to(from, { yPercent:-30 * dir, duration:DURATION, ease:'power3.inOut' }, 0);
  }
  tl.add(animateIn(to), 0);
}

function switchVersion(toggle) {
  if (busy) return;
  busy = true; updateUI();
  toggle.setAttribute('aria-checked', String(version === 'A'));
  gsap.timeline()
    .to('#wipe', { autoAlpha:1, duration:.45, delay:.35 })
    .call(() => {            // swap content while the screen is covered
      version = version === 'A' ? 'B' : 'A';
      index = 0;
      render(); updateUI();
    })
    .to('#wipe', { autoAlpha:0, duration:.6, delay:.15,
      onComplete: () => { busy = false; updateUI(); } })
    .call(() => animateIn(scenes[0]), null, '<');
}

const next = () => goTo(index + 1);
const prev = () => goTo(index - 1);

// One gesture = one page. A gesture is "armed" when it starts and used up by its first move.
let lastWheel = -Infinity, wheelArmed = false, touchArmed = false;
window.addEventListener('wheel', () => {
  const now = performance.now();
  if (now - lastWheel > QUIET_MS) wheelArmed = true;  // fresh scroll after a pause
  lastWheel = now;
}, { capture:true, passive:true });

function gesture(self, move) {
  const isWheel = self.event.type === 'wheel';
  if (isWheel ? !wheelArmed : !touchArmed) return;
  if (isWheel) wheelArmed = false; else touchArmed = false;  // used up even if locked
  move();
}

gsap.registerPlugin(Observer);
render(); updateUI();

Observer.create({
  target: window,
  type: 'wheel,touch',
  wheelSpeed: -1,        // makes wheel and swipe directions match
  tolerance: 30,
  preventDefault: true,
  lockAxis: true,
  onPress: () => { touchArmed = true; },
  onUp:   self => gesture(self, next),   // swipe up / scroll down
  onDown: self => gesture(self, prev)
});

$('next').addEventListener('click', next);
$('prev').addEventListener('click', prev);

window.addEventListener('keydown', e => {
  if (e.repeat) return;
  if (e.key === ' ' && e.target.closest('button')) return;  // let Space press the button
  if (['ArrowDown','PageDown',' '].includes(e.key)) { e.preventDefault(); next(); }
  if (['ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
});

stage.addEventListener('click', e => {
  const bubble = e.target.closest('.bubble');
  if (!bubble) return;
  bubble.textContent = bubble.dataset.memory;
  bubble.setAttribute('aria-label', bubble.dataset.memory);
});

// Click anywhere on the chat page to show the next message
stage.addEventListener('click', e => {
  const chat = e.target.closest('.chat-scene');
  if (!chat) return;
  const hidden = chat.querySelector('.chat-msg:not(.shown)');
  if (hidden) hidden.classList.add('shown');
});