import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MovieItem, SeriesItem } from '../data/models';
import { cyberSound } from './CyberSound';
import { RotateCw, Play, Info, Sparkles, MoveHorizontal } from 'lucide-react';

interface Cyber3DWorldProps {
  items: (MovieItem | SeriesItem)[];
  onSelectItem: (item: MovieItem | SeriesItem) => void;
  title?: string;
}

export const Cyber3DWorld: React.FC<Cyber3DWorldProps> = ({
  items,
  onSelectItem,
  title = 'MUNDO HOLOGRÁFICO 3D',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<MovieItem | SeriesItem | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carouselGroupRef = useRef<THREE.Group | null>(null);
  const cardMeshesRef = useRef<THREE.Mesh[]>([]);

  // Smooth rotation state
  const rotationYRef = useRef<number>(0);
  const targetRotationYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);
  const dragVelocityRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
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
    })();

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x07080d, 0.045);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.8);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting rig (cyberpunk style: warm magenta + electric cyan + key fill)
    const ambientLight = new THREE.AmbientLight(0x0e1526, 1.5);
    scene.add(ambientLight);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 4.0, 15);
    cyanPoint.position.set(4, 3, 3);
    scene.add(cyanPoint);

    const magentaPoint = new THREE.PointLight(0xff0077, 4.0, 15);
    magentaPoint.position.set(-4, -2, 3);
    scene.add(magentaPoint);

    // Holographic Base Platform
    const platformGroup = new THREE.Group();
    const diskGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.15, 64);
    const diskMat = new THREE.MeshStandardMaterial({
      color: 0x0c101c,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false,
    });
    const platform = new THREE.Mesh(diskGeo, diskMat);
    platform.position.y = -1.6;
    platformGroup.add(platform);

    // Glowing Neon Rings
    const ringGeo = new THREE.TorusGeometry(4.25, 0.025, 16, 100);
    const ringMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ringMatPink = new THREE.MeshBasicMaterial({ color: 0xff0055 });

    const topRing = new THREE.Mesh(ringGeo, ringMatCyan);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 1.4;
    platformGroup.add(topRing);

    const bottomRing = new THREE.Mesh(ringGeo, ringMatPink);
    bottomRing.rotation.x = Math.PI / 2;
    bottomRing.position.y = -1.5;
    platformGroup.add(bottomRing);

    // Cyber Floating Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = (Math.random() - 0.5) * 6;
      particlePositions[i + 2] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.04,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    scene.add(platformGroup);

    // Carousel 3D Cards Group
    const carouselGroup = new THREE.Group();
    carouselGroupRef.current = carouselGroup;
    scene.add(carouselGroup);

    // Create cards around the cylinder
    const cardMeshes: THREE.Mesh[] = [];
    const count = Math.max(items.length, 1);
    const radius = Math.max(3.2, (count * 0.95) / (2 * Math.PI));

    const cardWidth = 1.15;
    const cardHeight = 1.65;
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const borderGeo = new THREE.PlaneGeometry(cardWidth + 0.04, cardHeight + 0.04);

    items.forEach((item, i) => {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      // Card Container
      const cardHolder = new THREE.Group();
      cardHolder.position.set(x, 0, z);
      cardHolder.rotation.y = angle;

      // Card Backing Plate
      const backPlate = new THREE.Mesh(
        borderGeo,
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x00f0ff : 0xff0055,
          transparent: true,
          opacity: 0.4,
        })
      );
      backPlate.position.z = -0.01;
      cardHolder.add(backPlate);

      // Card Front Texture (Procedural fallback or loaded image)
      const textureLoader = new THREE.TextureLoader();
      let cardTexture: THREE.Texture;

      if (item.poster) {
        cardTexture = textureLoader.load(
          item.poster,
          (t: THREE.Texture) => {
            t.colorSpace = THREE.SRGBColorSpace;
          },
          undefined,
          () => {
            // Error fallback: procedural canvas
            applyFallbackTexture(cardMesh, item.title, i);
          }
        );
      } else {
        cardTexture = createProceduralPoster(item.title, i);
      }

      const cardMat = new THREE.MeshStandardMaterial({
        map: cardTexture,
        roughness: 0.3,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.userData = { index: i, item };
      cardHolder.add(cardMesh);
      cardMeshes.push(cardMesh);

      carouselGroup.add(cardHolder);
    });

    cardMeshesRef.current = cardMeshes;

    // Helper to generate futuristic fallback poster
    function createProceduralPoster(text: string, idx: number): THREE.CanvasTexture {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 460;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 320, 460);
      grad.addColorStop(0, idx % 2 === 0 ? '#0B1528' : '#280B1E');
      grad.addColorStop(1, '#07080D');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 460);

      // Cyber Grid
      ctx.strokeStyle = idx % 2 === 0 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 85, 0.2)';
      ctx.lineWidth = 1;
      for (let y = 0; y < 460; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(320, y);
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      const words = text.split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).length > 18) {
          lines.push(cur);
          cur = w;
        } else {
          cur = cur ? cur + ' ' + w : w;
        }
      }
      if (cur) lines.push(cur);

      lines.forEach((l, index) => {
        ctx.fillText(l, 160, 210 + index * 26);
      });

      // Neon Badge
      ctx.fillStyle = idx % 2 === 0 ? '#00F0FF' : '#FF0055';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('CYBER STREAM · HD', 160, 420);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    function applyFallbackTexture(mesh: THREE.Mesh, text: string, idx: number) {
      const tex = createProceduralPoster(text, idx);
      (mesh.material as THREE.MeshStandardMaterial).map = tex;
      (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }

    // Raycasting for mouse inspection & selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cardMeshesRef.current);

      if (intersects.length > 0) {
        const topHit = intersects[0].object as THREE.Mesh;
        const item = topHit.userData.item;
        setHoveredItem(item);
      } else {
        setHoveredItem(null);
      }
    };

    const onClick = (e: MouseEvent) => {
      // If was dragging significantly, ignore click
      if (Math.abs(dragVelocityRef.current) > 0.005) return;

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cardMeshesRef.current);

      if (intersects.length > 0) {
        const topHit = intersects[0].object as THREE.Mesh;
        const item = topHit.userData.item;
        const idx = topHit.userData.index;
        setSelectedIndex(idx);
        cyberSound.click();

        // Rotate selected card to center front
        const targetAngle = -(idx / count) * Math.PI * 2;
        targetRotationYRef.current = targetAngle;

        onSelectItem(item);
      }
    };

    // Drag to rotate handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
      dragVelocityRef.current = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      onPointerMove(e);
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMouseXRef.current;
      prevMouseXRef.current = e.clientX;
      const speed = deltaX * 0.0045;
      targetRotationYRef.current += speed;
      dragVelocityRef.current = speed;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch handlers for mobile / tablet
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseXRef.current = e.touches[0].clientX;
        dragVelocityRef.current = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseXRef.current;
      prevMouseXRef.current = e.touches[0].clientX;
      const speed = deltaX * 0.0045;
      targetRotationYRef.current += speed;
      dragVelocityRef.current = speed;
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    // Window Resize
    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      // Smooth inertia rotation interpolation
      if (!isDraggingRef.current && autoRotate) {
        targetRotationYRef.current += delta * 0.12;
      }

      rotationYRef.current += (targetRotationYRef.current - rotationYRef.current) * 0.08;

      if (carouselGroupRef.current) {
        carouselGroupRef.current.rotation.y = rotationYRef.current;
      }

      // Gentle floating animation of particles & platform
      particles.rotation.y += delta * 0.03;
      topRing.rotation.z += delta * 0.15;
      bottomRing.rotation.z -= delta * 0.15;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onMouseUp);
      if (container) {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('click', onClick);
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onTouchEnd);
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      diskGeo.dispose();
      diskMat.dispose();
      ringGeo.dispose();
      ringMatCyan.dispose();
      ringMatPink.dispose();
      cardGeo.dispose();
      borderGeo.dispose();
    };
  }, [items, autoRotate, onSelectItem]);

  return (
    <div className="relative w-full h-full min-h-[560px] flex items-center justify-center overflow-hidden bg-[#07080D] select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-10" />

      {/* Top Cyberpunk HUD Header */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full shadow-[0_0_10px_#00F0FF]" />
          <h3 className="text-[15px] font-mono tracking-widest text-[#00F0FF] uppercase font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
            {title}
          </h3>
          <span className="text-[12px] font-mono text-[#9AA3B5] px-2 py-0.5 rounded bg-[#181A22]/80 border border-[#2A2F45]">
            {items.length} TÍTULOS EN ÓRBITA 3D
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              cyberSound.click();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
              autoRotate
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                : 'bg-[#181A22] text-[#9AA3B5] border-[#2A2F45]'
            }`}
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
            <span>{autoRotate ? 'ROTACIÓN ON' : 'ROTACIÓN PAUSADA'}</span>
          </button>
        </div>
      </div>

      {/* Centered Drag Indicator Hint */}
      <div className="absolute top-16 inset-x-0 flex justify-center z-20 pointer-events-none opacity-60">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-[#00F0FF]/20 text-[12px] font-mono text-[#00F0FF]">
          <MoveHorizontal size={14} />
          <span>ARRASTRA CON EL RATÓN / DEDO PARA GIRAR EL MUNDO 3D</span>
        </div>
      </div>

      {/* Bottom Holographic Focus Card (Active or Hovered Item Preview) */}
      {hoveredItem && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-20 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-[#101424]/95 border-2 border-[#00F0FF] rounded-xl p-4 shadow-[0_0_25px_rgba(0,240,255,0.25)] backdrop-blur-md flex items-center gap-4">
            {/* Poster Preview */}
            <div className="w-16 h-22 rounded-lg overflow-hidden bg-[#07080D] border border-[#2A2F45] shrink-0">
              {hoveredItem.poster ? (
                <img
                  src={hoveredItem.poster}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#00F0FF]">
                  <Sparkles size={24} />
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                  {hoveredItem.year || 2025}
                </span>
                {hoveredItem.rating && (
                  <span className="text-[11px] font-mono text-[#FFD700] font-bold">
                    ★ {hoveredItem.rating}
                  </span>
                )}
                {hoveredItem.genre && (
                  <span className="text-[12px] text-[#9AA3B5] truncate">
                    {hoveredItem.genre}
                  </span>
                )}
              </div>

              <h4 className="text-[18px] font-bold text-[#F2F4F8] truncate mt-1">
                {'title' in hoveredItem ? hoveredItem.title : (hoveredItem as any).name}
              </h4>

              <p className="text-[12px] text-[#9AA3B5] line-clamp-1 mt-0.5">
                {'synopsis' in hoveredItem
                  ? hoveredItem.synopsis
                  : 'plot' in hoveredItem
                  ? (hoveredItem as any).plot
                  : 'Transmitiendo señal en directo de alta definición.'}
              </p>
            </div>

            {/* Play Button */}
            <button
              onClick={() => {
                cyberSound.click();
                onSelectItem(hoveredItem);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00F0FF] hover:bg-[#38F9D7] text-[#07080D] rounded-lg font-bold text-[14px] font-mono tracking-wide transition-all shadow-[0_0_15px_#00F0FF] shrink-0 cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              <span>VER</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
