const solarSystem = document.getElementById('solar-system');
const viewport = document.querySelector('.viewport');
const starfield = document.getElementById('starfield');
const celestialItems = [...document.querySelectorAll('.celestial')];
const panelContent = document.querySelector('.mission-card__content');
const panelEyebrow = document.getElementById('panel-eyebrow');
const panelIndex = document.getElementById('panel-index');
const panelTitle = document.getElementById('panel-title');
const panelDescription = document.getElementById('panel-description');
const panelDetails = document.getElementById('panel-details');
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
  panelContent.classList.remove('is-changing');
  void panelContent.offsetWidth;
  panelContent.classList.add('is-changing');
}

celestialItems.forEach((item) => {
  item.addEventListener('click', () => selectItem(item));
});

const sceneMotion = {
  currentX: 0,
  currentY: 0,
  targetX: 0,
  targetY: 0,
  frame: 0,
};

function renderSceneMotion() {
  solarSystem.style.setProperty('--near-x', `${sceneMotion.currentX.toFixed(2)}px`);
  solarSystem.style.setProperty('--near-y', `${sceneMotion.currentY.toFixed(2)}px`);
  solarSystem.style.setProperty('--far-x', `${(sceneMotion.currentX * 0.4).toFixed(2)}px`);
  solarSystem.style.setProperty('--far-y', `${(sceneMotion.currentY * 0.4).toFixed(2)}px`);
}

function animateSceneMotion() {
  sceneMotion.frame = 0;
  sceneMotion.currentX += (sceneMotion.targetX - sceneMotion.currentX) * 0.14;
  sceneMotion.currentY += (sceneMotion.targetY - sceneMotion.currentY) * 0.14;

  const remainingX = Math.abs(sceneMotion.targetX - sceneMotion.currentX);
  const remainingY = Math.abs(sceneMotion.targetY - sceneMotion.currentY);
  if (remainingX < 0.01) sceneMotion.currentX = sceneMotion.targetX;
  if (remainingY < 0.01) sceneMotion.currentY = sceneMotion.targetY;

  renderSceneMotion();
  if (remainingX >= 0.01 || remainingY >= 0.01) {
    sceneMotion.frame = requestAnimationFrame(animateSceneMotion);
  }
}

function scheduleSceneMotion() {
  if (!sceneMotion.frame) sceneMotion.frame = requestAnimationFrame(animateSceneMotion);
}

function resetSceneView(immediate = false) {
  sceneMotion.targetX = 0;
  sceneMotion.targetY = 0;

  if (immediate) {
    cancelAnimationFrame(sceneMotion.frame);
    sceneMotion.frame = 0;
    sceneMotion.currentX = 0;
    sceneMotion.currentY = 0;
    renderSceneMotion();
    return;
  }

  scheduleSceneMotion();
}

viewport.addEventListener('pointermove', (event) => {
  if (reducedMotion.matches || event.pointerType === 'touch') return;

  const bounds = viewport.getBoundingClientRect();
  let horizontal = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  let vertical = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
  const magnitude = Math.hypot(horizontal, vertical);

  // A circular clamp prevents diagonal corners from amplifying the movement.
  if (magnitude > 1) {
    horizontal /= magnitude;
    vertical /= magnitude;
  }

  const maximumOffset = Math.min(8, Math.max(4, bounds.width * 0.012));
  sceneMotion.targetX = horizontal * maximumOffset;
  sceneMotion.targetY = vertical * maximumOffset;
  scheduleSceneMotion();
});

viewport.addEventListener('pointerleave', () => resetSceneView());

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
  if (reducedMotion.matches) resetSceneView(true);
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
