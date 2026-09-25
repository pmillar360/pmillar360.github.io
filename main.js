const solarSystem = document.getElementById('solar-system');
const starfield = document.getElementById('starfield');
const celestialItems = [...document.querySelectorAll('.celestial')];
const panelContent = document.querySelector('.mission-card__content');
const panelEyebrow = document.getElementById('panel-eyebrow');
const panelIndex = document.getElementById('panel-index');
const panelTitle = document.getElementById('panel-title');
const panelDescription = document.getElementById('panel-description');
const panelDetails = document.getElementById('panel-details');
const panelLink = document.getElementById('panel-link');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function selectItem(item) {
  if (!item || item.classList.contains('is-selected')) return;

  celestialItems.forEach((candidate) => {
    const selected = candidate === item;
    candidate.classList.toggle('is-selected', selected);
    candidate.setAttribute('aria-pressed', String(selected));
  });

  const details = (item.dataset.details || '')
    .split('|')
    .map((detail) => detail.trim())
    .filter(Boolean);

  panelEyebrow.textContent = `Selected · ${item.dataset.type || 'System'}`;
  panelIndex.textContent = item.dataset.index || '00';
  panelTitle.textContent = item.dataset.title || 'Portfolio';
  panelDescription.textContent = item.dataset.description || '';
  panelDetails.replaceChildren(
    ...details.map((detail) => {
      const listItem = document.createElement('li');
      listItem.textContent = detail;
      return listItem;
    }),
  );
  panelLink.href = item.dataset.linkUrl || '#';
  panelLink.querySelector('span').textContent = item.dataset.linkText || 'Explore';

  panelContent.classList.remove('is-changing');
  void panelContent.offsetWidth;
  panelContent.classList.add('is-changing');
}

celestialItems.forEach((item) => {
  item.addEventListener('click', () => selectItem(item));
});

let tiltFrame = 0;

solarSystem.addEventListener('pointermove', (event) => {
  if (reducedMotion.matches || event.pointerType === 'touch') return;
  const bounds = solarSystem.getBoundingClientRect();
  const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
  const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

  cancelAnimationFrame(tiltFrame);
  tiltFrame = requestAnimationFrame(() => {
    solarSystem.style.setProperty('--tilt-x', `${(-vertical * 3.5).toFixed(2)}deg`);
    solarSystem.style.setProperty('--tilt-y', `${(horizontal * 4.5).toFixed(2)}deg`);
  });
});

solarSystem.addEventListener('pointerleave', () => {
  solarSystem.style.setProperty('--tilt-x', '0deg');
  solarSystem.style.setProperty('--tilt-y', '0deg');
});

const starContext = starfield.getContext('2d', { alpha: true });
let stars = [];
let animationFrame = 0;
let lastFrame = 0;

function resizeStarfield() {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = window.innerWidth;
  const height = window.innerHeight;
  starfield.width = Math.round(width * ratio);
  starfield.height = Math.round(height * ratio);
  starfield.style.width = `${width}px`;
  starfield.style.height = `${height}px`;
  starContext.setTransform(ratio, 0, 0, ratio, 0, 0);

  const starCount = Math.min(150, Math.max(48, Math.round((width * height) / 10500)));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.15 + 0.2,
    alpha: Math.random() * 0.55 + 0.18,
    speed: Math.random() * 0.006 + 0.002,
    phase: Math.random() * Math.PI * 2,
  }));
  drawStars(0);
}

function drawStars(time) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  starContext.clearRect(0, 0, width, height);

  stars.forEach((star) => {
    const flicker = reducedMotion.matches ? star.alpha : star.alpha + Math.sin(time * star.speed + star.phase) * 0.16;
    starContext.beginPath();
    starContext.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    starContext.fillStyle = `rgba(225, 235, 255, ${Math.max(0.08, flicker)})`;
    starContext.fill();
  });
}

function animateStars(time) {
  if (time - lastFrame > 66) {
    drawStars(time);
    lastFrame = time;
  }
  animationFrame = requestAnimationFrame(animateStars);
}

function updateMotionPreference() {
  cancelAnimationFrame(animationFrame);
  if (reducedMotion.matches) drawStars(0);
  else animationFrame = requestAnimationFrame(animateStars);
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeStarfield, 120);
});

reducedMotion.addEventListener('change', updateMotionPreference);
document.getElementById('year').textContent = new Date().getFullYear();
resizeStarfield();
updateMotionPreference();
