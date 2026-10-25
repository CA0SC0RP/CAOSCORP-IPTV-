import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createPlanetTexture, createStarfield, getIsSoftwareGl } from './CosmicShaders';
import { cyberSound } from './CyberSound';
import { MovieItem, SeriesItem } from '../data/models';
import { Play, RotateCw, Star, Info, MoveHorizontal, X, Clapperboard, Film } from 'lucide-react';

interface PlanetaryContentSphereProps {
  items: (MovieItem | SeriesItem)[];
  type: 'movies' | 'series';
  onPlayItem: (title: string, streamUrl: string) => void;
  onBack: () => void;
}

export const PlanetaryContentSphere: React.FC<PlanetaryContentSphereProps> = ({
  items,
  type,
  onPlayItem,
  onBack,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MovieItem | SeriesItem | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetGroupRef = useRef<THREE.Group | null>(null);
  const satellitesGroupRef = useRef<THREE.Group | null>(null);
  const cardMeshesRef = useRef<THREE.Mesh[]>([]);

  const targetRotationYRef = useRef<number>(0);
  const currentRotationYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isSoftwareGl = getIsSoftwareGl();

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x05060b, 0.03);

    // Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 7.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Cosmic Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1020, 1.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainLight.position.set(6, 6, 6);
    scene.add(mainLight);

    const themeColor = type === 'movies' ? 0x00f0ff : 0xff0077;
    const planetGlow = new THREE.PointLight(themeColor, 4.5, 14);
    planetGlow.position.set(-3, -2, 4);
    scene.add(planetGlow);

    // Starfield
    const stars = createStarfield(isSoftwareGl ? 300 : 600);
    scene.add(stars);

    // Central Planet Assembly
    const planetGroup = new THREE.Group();
    planetGroupRef.current = planetGroup;
    scene.add(planetGroup);

    const planetGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const planetTex = createPlanetTexture(type === 'movies' ? 'cyan' : 'magenta');
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.3,
      metalness: 0.7,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    // Atmospheric Glowing Rings
    const ringGeo = new THREE.RingGeometry(2.1, 2.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.2;
    planetGroup.add(ringMesh);

    // Satellites Group (The orbital posters orbiting the planet!)
    const satellitesGroup = new THREE.Group();
    satellitesGroupRef.current = satellitesGroup;
    scene.add(satellitesGroup);

    const count = Math.max(items.length, 1);
    const orbitRadius = 3.6;
    const cardMeshes: THREE.Mesh[] = [];

    const cardWidth = 0.95;
    const cardHeight = 1.4;
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const borderGeo = new THREE.PlaneGeometry(cardWidth + 0.05, cardHeight + 0.05);

    const textureLoader = new THREE.TextureLoader();

    items.forEach((item, i) => {
      // Stagger posters across 2 orbital tiers (equator and slight elevation)
      const tier = i % 2 === 0 ? 0 : (i % 4 === 1 ? 0.6 : -0.6);
      const angle = (i / count) * Math.PI * 2;
      const x = Math.sin(angle) * orbitRadius;
      const z = Math.cos(angle) * orbitRadius;
      const y = tier;

      const cardHolder = new THREE.Group();
      cardHolder.position.set(x, y, z);
      cardHolder.rotation.y = angle;

      // Glow border plate
      const borderMat = new THREE.MeshBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: 0.5,
      });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.z = -0.01;
      cardHolder.add(borderMesh);

      // Card Texture
      let texture: THREE.Texture;
      if (item.poster) {
        texture = textureLoader.load(
          item.poster,
          (t: THREE.Texture) => {
            t.colorSpace = THREE.SRGBColorSpace;
          },
          undefined,
          () => {
            // Error fallback
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 360;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#080F1E';
            ctx.fillRect(0, 0, 256, 360);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(item.title.substring(0, 15), 128, 180);
            const fallbackTex = new THREE.CanvasTexture(canvas);
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            (cardMesh.material as THREE.MeshStandardMaterial).map = fallbackTex;
            (cardMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
          }
        );
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 360;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#080F1E';
        ctx.fillRect(0, 0, 256, 360);
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.title.substring(0, 15), 128, 180);
        texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
      }

      const cardMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.2,
        side: THREE.DoubleSide,
      });

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.userData = { index: i, item };
      cardHolder.add(cardMesh);
      cardMeshes.push(cardMesh);

      satellitesGroup.add(cardHolder);
    });

    cardMeshesRef.current = cardMeshes;

    // Raycasting for card selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(cardMeshesRef.current);

      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh;
        const item = hit.userData.item;
        const idx = hit.userData.index;

        cyberSound.click();
        setSelectedItem(item);

        // Smoothly rotate item to front
        const targetAngle = -(idx / count) * Math.PI * 2;
        targetRotationYRef.current = targetAngle;
      }
    };

    // Drag to rotate handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMouseXRef.current;
      prevMouseXRef.current = e.clientX;
      targetRotationYRef.current += deltaX * 0.005;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseXRef.current = e.touches[0].clientX;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseXRef.current;
      prevMouseXRef.current = e.touches[0].clientX;
      targetRotationYRef.current += deltaX * 0.005;
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('click', onPointerClick);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    // Resize
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
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      // Planet rotation
      if (planetGroupRef.current) {
        planetGroupRef.current.rotation.y += delta * 0.12;
      }

      // Orbital rotation with auto-rotate or drag inertia
      if (!isDraggingRef.current && autoRotate) {
        targetRotationYRef.current += delta * 0.1;
      }

      currentRotationYRef.current +=
        (targetRotationYRef.current - currentRotationYRef.current) * 0.08;

      if (satellitesGroupRef.current) {
        satellitesGroupRef.current.rotation.y = currentRotationYRef.current;
      }

      stars.rotation.y += delta * 0.01;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container) {
        container.removeEventListener('click', onPointerClick);
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onTouchEnd);
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      planetGeo.dispose();
      planetMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      cardGeo.dispose();
      borderGeo.dispose();
    };
  }, [items, type, autoRotate]);

  return (
    <div className="relative h-full w-full bg-[#05060B] overflow-hidden select-none flex flex-col justify-between">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-10" />

      {/* Top HUD Bar */}
      <div className="relative z-20 p-6 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => {
            cyberSound.click();
            onBack();
          }}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0D1A]/90 border border-[#2A2F45] hover:border-[#00F0FF] text-white text-xs font-mono font-bold transition-all shadow-lg cursor-pointer"
        >
          <span>◄ REGRESAR AL LAUNCHER</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#2A2F45] text-xs font-mono text-[#9AA3B5]">
            <MoveHorizontal size={14} className="text-[#00F0FF]" />
            <span>ARRASTRA PARA GIRAR EL PLANETA</span>
          </div>

          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              cyberSound.click();
            }}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0D1A]/90 border border-[#2A2F45] text-xs font-mono text-[#00F0FF] cursor-pointer"
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
            <span>{autoRotate ? 'ROTACIÓN ON' : 'PAUSA'}</span>
          </button>
        </div>
      </div>

      {/* Focus Item Detail Card (Docked at Bottom) */}
      {selectedItem && (
        <div className="relative z-30 pb-6 px-6 max-w-2xl mx-auto w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="relative bg-[#0A0D1A]/95 border-2 border-[#00F0FF] rounded-2xl p-5 shadow-[0_0_35px_rgba(0,240,255,0.3)] backdrop-blur-xl flex items-center gap-5">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-[#9AA3B5] hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Poster */}
            <div className="w-20 h-28 rounded-xl overflow-hidden border border-[#00F0FF]/50 bg-black shrink-0 shadow-lg">
              {selectedItem.poster ? (
                <img
                  src={selectedItem.poster}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#00F0FF]">
                  {type === 'movies' ? <Film size={28} /> : <Clapperboard size={28} />}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] font-bold border border-[#00F0FF]/30">
                  {selectedItem.year || 2025}
                </span>
                {selectedItem.rating && (
                  <span className="text-xs font-mono text-[#FFD700] font-bold flex items-center gap-1">
                    <Star size={12} fill="currentColor" />
                    <span>{selectedItem.rating}</span>
                  </span>
                )}
                <span className="text-xs font-mono text-[#9AA3B5] truncate">
                  {selectedItem.genre || (type === 'movies' ? 'Cine HD' : 'Serie Completa')}
                </span>
              </div>

              <h3 className="text-xl font-bold font-mono text-white truncate">
                {selectedItem.title}
              </h3>

              <p className="text-xs text-[#9AA3B5] line-clamp-2 mt-1">
                {'synopsis' in selectedItem
                  ? selectedItem.synopsis
                  : 'plot' in selectedItem
                  ? (selectedItem as any).plot
                  : 'Transmisión estelar de alta definición.'}
              </p>

              {/* Play Button */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => {
                    cyberSound.warp();
                    const url =
                      selectedItem.streamUrl ||
                      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
                    onPlayItem(selectedItem.title, url);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0066FF] hover:from-[#38F9D7] hover:to-[#00F0FF] text-[#07080D] font-mono font-black text-xs tracking-wider shadow-[0_0_20px_#00F0FF] transition-all cursor-pointer hover:scale-105"
                >
                  <Play size={14} fill="currentColor" />
                  <span>TRANSMITIR AHORA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
