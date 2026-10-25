import * as THREE from 'three';

// Detect software WebGL to ensure smooth 60fps on smart TVs, mobiles and low-end GPUs
export function getIsSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

// Procedural Planet Texture Generator (Zero external images, fast, high-res)
export function createPlanetTexture(type: 'cyan' | 'magenta' | 'emerald' | 'gold'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base background
  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  if (type === 'cyan') {
    grad.addColorStop(0, '#040b17');
    grad.addColorStop(0.5, '#0a2342');
    grad.addColorStop(1, '#02070f');
  } else if (type === 'magenta') {
    grad.addColorStop(0, '#190312');
    grad.addColorStop(0.5, '#3d0a2d');
    grad.addColorStop(1, '#0c0209');
  } else if (type === 'emerald') {
    grad.addColorStop(0, '#02140c');
    grad.addColorStop(0.5, '#093622');
    grad.addColorStop(1, '#010c07');
  } else {
    grad.addColorStop(0, '#1a1002');
    grad.addColorStop(0.5, '#422a07');
    grad.addColorStop(1, '#0f0801');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Swirling energy bands / atmospheric currents
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    const y = (i / 18) * 256 + Math.sin(i) * 12;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(150, y + 25, 350, y - 25, 512, y);
    ctx.strokeStyle =
      type === 'cyan'
        ? `rgba(0, 240, 255, ${0.15 + (i % 3) * 0.1})`
        : type === 'magenta'
        ? `rgba(255, 0, 119, ${0.15 + (i % 3) * 0.1})`
        : type === 'emerald'
        ? `rgba(0, 255, 128, ${0.15 + (i % 3) * 0.1})`
        : `rgba(255, 187, 0, ${0.15 + (i % 3) * 0.1})`;
    ctx.lineWidth = 14 + (i % 5) * 6;
    ctx.stroke();
  }

  // Continental glowing energy nodes
  for (let j = 0; j < 35; j++) {
    const cx = (j * 73) % 512;
    const cy = (j * 47) % 256;
    const rad = 6 + (j % 8);
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    radGrad.addColorStop(0, '#FFFFFF');
    radGrad.addColorStop(0.4, type === 'cyan' ? '#00F0FF' : type === 'magenta' ? '#FF0077' : '#00FF88');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Starfield Particle System
export function createStarfield(count: number = 600): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const palette = [
    new THREE.Color('#00F0FF'),
    new THREE.Color('#FF0077'),
    new THREE.Color('#8B00FF'),
    new THREE.Color('#FFFFFF'),
    new THREE.Color('#00FF88'),
  ];

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const r = 25 + Math.random() * 45;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);

    const c = palette[i % palette.length];
    colors[idx] = c.r;
    colors[idx + 1] = c.g;
    colors[idx + 2] = c.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
  });

  return new THREE.Points(geo, mat);
}

// Procedural Glowing Nebula Clouds (Nubes cósmicas luminosas y claras de fondo)
export function createNebulaClouds(): THREE.Group {
  const group = new THREE.Group();

  const colors = [
    { color: '#00F0FF', x: -8, y: 4, z: -18, scale: 14, opacity: 0.22 },
    { color: '#7B2CBF', x: 8, y: -4, z: -20, scale: 16, opacity: 0.25 },
    { color: '#FF0077', x: 4, y: 6, z: -16, scale: 13, opacity: 0.18 },
    { color: '#00B4D8', x: -6, y: -5, z: -22, scale: 15, opacity: 0.20 },
  ];

  // Procedural soft cloud texture
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.6)');
  grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  colors.forEach((cfg) => {
    const mat = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(cfg.color),
      transparent: true,
      opacity: cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(cfg.x, cfg.y, cfg.z);
    sprite.scale.set(cfg.scale, cfg.scale, 1);
    group.add(sprite);
  });

  return group;
}

