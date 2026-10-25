import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createPlanetTexture, createStarfield, getIsSoftwareGl } from './CosmicShaders';
import { cyberSound } from './CyberSound';
import { MovieItem, SeriesItem } from '../data/models';
import { Play, RotateCw, Star, Layers, X, MoveHorizontal, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CosmicPlanetaryCarouselProps {
  items: (MovieItem | SeriesItem)[];
  type: 'movies' | 'series';
  onPlayItem: (title: string, streamUrl: string) => void;
}

export const CosmicPlanetaryCarousel: React.FC<CosmicPlanetaryCarouselProps> = ({
  items,
  type,
  onPlayItem,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<MovieItem | SeriesItem | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetGroupRef = useRef<THREE.Group | null>(null);
  const orbitBeltGroupRef = useRef<THREE.Group | null>(null);
  const cardMeshesRef = useRef<THREE.Mesh[]>([]);

  // Smooth rotation state
  const targetAngleRef = useRef<number>(0);
  const currentAngleRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);

  const themeHex = type === 'movies' ? 0x00f0ff : 0xff0077;
  const themeColorStr = type === 'movies' ? '#00F0FF' : '#FF0077';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isSoftwareGl = getIsSoftwareGl();

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(type === 'movies' ? 0x040812 : 0x0d0314, 0.028);

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
    renderer.toneMappingExposure = 1.35;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Cosmic Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1024, 1.8);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainKeyLight.position.set(6, 8, 6);
    scene.add(mainKeyLight);

    const planetGlowLight = new THREE.PointLight(themeHex, 6.0, 16);
    planetGlowLight.position.set(-3.5, -2, 4);
    scene.add(planetGlowLight);

    // Starfield
    const stars = createStarfield(isSoftwareGl ? 350 : 800);
    scene.add(stars);

    // CENTRAL PLANET GROUP (Planeta Girando en el Centro)
    const planetGroup = new THREE.Group();
    planetGroupRef.current = planetGroup;
    scene.add(planetGroup);

    const planetGeo = new THREE.SphereGeometry(1.6, 36, 36);
    const planetTex = createPlanetTexture(type === 'movies' ? 'cyan' : 'magenta');
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.28,
      metalness: 0.65,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    // Planetary Atmosphere Halo
    const atmosphereGeo = new THREE.SphereGeometry(1.68, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: themeHex,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    planetGroup.add(atmosphere);

    // Luminous Planetary Rings (Saturn-like Rings)
    const ringGeo1 = new THREE.RingGeometry(2.3, 2.55, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: themeHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    planetGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(2.7, 2.8, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2.3;
    planetGroup.add(ring2);

    // ORBITAL CAROUSEL BELT (Todos los iconos de series/películas girando alrededor)
    const orbitBeltGroup = new THREE.Group();
    orbitBeltGroupRef.current = orbitBeltGroup;
    // Ensure items are sorted with most recent releases first (2026, 2025, 2024...)
    const sortedItems = [...items].sort((a: any, b: any) => {
      const getYear = (it: any) => {
        if (typeof it.year === 'number') return it.year;
        if (it.year) {
          const match = String(it.year).match(/\b(19\d\d|20\d\d)\b/);
          if (match) return parseInt(match[1], 10);
        }
        return 0;
      };
      return getYear(b) - getYear(a);
    });

    const count = Math.max(sortedItems.length, 1);
    const orbitRadius = 4.2;
    const cardMeshes: THREE.Mesh[] = [];

    const cardWidth = 1.05;
    const cardHeight = 1.55;
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const borderGeo = new THREE.PlaneGeometry(cardWidth + 0.06, cardHeight + 0.06);

    const textureLoader = new THREE.TextureLoader();

    sortedItems.forEach((item, i) => {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.sin(angle) * orbitRadius;
      const z = Math.cos(angle) * orbitRadius;

      const cardHolder = new THREE.Group();
      cardHolder.position.set(x, 0, z);
      cardHolder.rotation.y = angle;

      const isRecent = ('year' in item && Number(item.year) >= 2025) || i < 4;

      // Glow border
      const borderMat = new THREE.MeshBasicMaterial({
        color: isRecent ? 0x00f0ff : themeHex,
        transparent: true,
        opacity: isRecent ? 0.9 : 0.6,
      });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.z = -0.01;
      cardHolder.add(borderMesh);

      // Card Face
      let texture: THREE.Texture;
      if (item.poster) {
        texture = textureLoader.load(
          item.poster,
          (t: THREE.Texture) => {
            t.colorSpace = THREE.SRGBColorSpace;
          },
          undefined,
          () => {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 440;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = type === 'movies' ? '#071526' : '#26071F';
            ctx.fillRect(0, 0, 300, 440);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(item.title.substring(0, 16), 150, 220);
            const fallbackTex = new THREE.CanvasTexture(canvas);
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            (cardMesh.material as THREE.MeshStandardMaterial).map = fallbackTex;
            (cardMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
          }
        );
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 440;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = type === 'movies' ? '#071526' : '#26071F';
        ctx.fillRect(0, 0, 300, 440);
        ctx.fillStyle = themeColorStr;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.title.substring(0, 16), 150, 220);
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

      orbitBeltGroup.add(cardHolder);
    });

    cardMeshesRef.current = cardMeshes;

    // Raycasting for clicking cards
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
        setActiveItemIndex(idx);
        setSelectedItem(item);

        // Rotate belt to position clicked card at center front
        const targetAngle = -(idx / count) * Math.PI * 2;
        targetAngleRef.current = targetAngle;
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
      targetAngleRef.current += deltaX * 0.005;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      snapToClosestCard();
    };

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
      targetAngleRef.current += deltaX * 0.005;
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      snapToClosestCard();
    };

    const snapToClosestCard = () => {
      const step = (Math.PI * 2) / count;
      let raw = -targetAngleRef.current / step;
      let normalized = Math.round(raw) % count;
      if (normalized < 0) normalized += count;
      setActiveItemIndex(normalized);
      targetAngleRef.current = -normalized * step;
      cyberSound.hover();
    };

    container.addEventListener('click', onPointerClick);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    // Keyboard navigation (D-Pad for Smart TVs)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepOrbit(+1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepOrbit(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cur = items[activeItemIndex];
        if (cur) {
          setSelectedItem(cur);
          cyberSound.click();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

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
        planetGroupRef.current.rotation.y += delta * 0.15;
      }
      ring1.rotation.z += delta * 0.08;
      ring2.rotation.z -= delta * 0.06;
      stars.rotation.y += delta * 0.012;

      // Auto-rotation of the orbital belt
      if (!isDraggingRef.current && autoRotate) {
        targetAngleRef.current += delta * 0.1;
      }

      // Smooth damping interpolation
      currentAngleRef.current +=
        (targetAngleRef.current - currentAngleRef.current) * 0.08;

      if (orbitBeltGroupRef.current) {
        orbitBeltGroupRef.current.rotation.y = currentAngleRef.current;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
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
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
    };
  }, [items, type, autoRotate]);

  const stepOrbit = (delta: number) => {
    const count = Math.max(items.length, 1);
    const nextIdx = (activeItemIndex + delta + count) % count;
    setActiveItemIndex(nextIdx);
    const step = (Math.PI * 2) / count;
    targetAngleRef.current = -nextIdx * step;
    cyberSound.hover();
  };

  const currentFrontItem = items[activeItemIndex] || items[0];

  return (
    <div className="relative h-full w-full bg-[#05060B] overflow-hidden select-none flex flex-col justify-between">
      {/* 3D WebGL Canvas (Planeta central girando y cinturón orbital alrededor) */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-10" />

      {/* Top Telemetry Header HUD */}
      <div className="relative z-20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-none">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: themeColorStr, boxShadow: `0 0 15px ${themeColorStr}` }}
            className="w-3 h-3 rounded-full animate-pulse"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black font-mono tracking-widest text-white uppercase">
                {type === 'movies' ? 'PLANETA CINE // CARRUSEL 3D' : 'NEXUS SERIES // ÓRBITA 3D'}
              </h2>
              <span className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-mono font-bold tracking-wider">
                <Sparkles size={11} className="animate-spin" />
                <span>MÁS RECIENTES AL FRENTE</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#9AA3B5] tracking-wider mt-0.5">
              {items.length} TÍTULOS EN GRAVEDAD CERO ALREDEDOR DEL PLANETA
            </p>
          </div>
        </div>

        {/* Orbit Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#2A2F45] text-xs font-mono text-[#9AA3B5]">
            <MoveHorizontal size={14} style={{ color: themeColorStr }} />
            <span>ARRASTRA PARA GIRAR O USA FLECHAS ◄ ►</span>
          </div>

          <button
            onClick={() => {
              cyberSound.click();
              stepOrbit(-1);
            }}
            className="p-2 rounded-xl bg-[#0A0D1A]/90 border border-[#2A2F45] hover:border-white text-white transition-colors cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => {
              cyberSound.click();
              stepOrbit(+1);
            }}
            className="p-2 rounded-xl bg-[#0A0D1A]/90 border border-[#2A2F45] hover:border-white text-white transition-colors cursor-pointer"
            title="Siguiente"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              cyberSound.click();
            }}
            style={{ color: themeColorStr }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0A0D1A]/90 border border-[#2A2F45] text-xs font-mono font-bold cursor-pointer transition-colors"
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
            <span>{autoRotate ? 'ROTACIÓN ON' : 'PAUSADO'}</span>
          </button>
        </div>
      </div>

      {/* Front Item Summary Dock (Pinned at Bottom Center) */}
      {!selectedItem && currentFrontItem && (
        <div className="relative z-20 pb-6 px-6 max-w-2xl mx-auto w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            style={{ borderColor: themeColorStr }}
            className="bg-[#0A0D1A]/95 border-2 rounded-2xl p-4 sm:p-5 shadow-[0_0_35px_rgba(0,240,255,0.25)] backdrop-blur-xl flex items-center gap-5"
          >
            {/* Poster Thumbnail */}
            <div className="w-16 h-24 rounded-xl overflow-hidden border border-[#2A2F45] bg-black shrink-0 shadow-lg">
              {currentFrontItem.poster ? (
                <img
                  src={currentFrontItem.poster}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  style={{ color: themeColorStr }}
                  className="w-full h-full flex items-center justify-center font-mono font-bold text-xs"
                >
                  HD
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {Number(currentFrontItem.year) >= 2025 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-black font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(0,240,255,0.6)]">
                    <Sparkles size={11} />
                    <span>ESTRENO RECIENTE</span>
                  </span>
                )}
                <span
                  style={{ color: themeColorStr, borderColor: `${themeColorStr}40` }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-black/50 font-bold"
                >
                  {currentFrontItem.year || 2025}
                </span>
                {currentFrontItem.rating && (
                  <span className="text-xs font-mono text-[#FFD700] font-bold flex items-center gap-1">
                    <Star size={11} fill="currentColor" />
                    <span>{currentFrontItem.rating}</span>
                  </span>
                )}
                <span className="text-xs font-mono text-[#9AA3B5] truncate">
                  {currentFrontItem.genre || (type === 'movies' ? 'Cine HD' : 'Serie Completa')}
                </span>
              </div>

              <h3 className="text-xl font-bold font-mono text-white truncate">
                {currentFrontItem.title}
              </h3>

              <p className="text-xs text-[#9AA3B5] line-clamp-1 mt-1">
                {'synopsis' in currentFrontItem
                  ? currentFrontItem.synopsis
                  : 'plot' in currentFrontItem
                  ? (currentFrontItem as any).plot
                  : 'Transmisión estelar de alta definición.'}
              </p>
            </div>

            {/* Inspect / Play Button */}
            <button
              onClick={() => {
                cyberSound.click();
                setSelectedItem(currentFrontItem);
              }}
              style={{
                backgroundColor: themeColorStr,
                boxShadow: `0 0 20px ${themeColorStr}70`,
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[#07080D] font-mono font-black text-xs tracking-wider transition-all cursor-pointer hover:brightness-110 active:scale-95 shrink-0"
            >
              <Play size={15} fill="currentColor" />
              <span>EXPLORAR</span>
            </button>
          </div>
        </div>
      )}

      {/* Holographic Detail Modal (When an item is clicked) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div
            style={{ borderColor: themeColorStr }}
            className="relative w-full max-w-2xl bg-[#0A0D1A] border-2 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.35)] overflow-hidden"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-[#FF0055] text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Banner Header */}
            <div className="relative h-56 w-full bg-[#05060B] overflow-hidden">
              <img
                src={selectedItem.backdrop || selectedItem.poster || ''}
                alt=""
                className="w-full h-full object-cover opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D1A] via-[#0A0D1A]/70 to-transparent" />

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div
                  style={{ borderColor: themeColorStr }}
                  className="w-20 h-28 rounded-xl overflow-hidden border-2 shadow-xl shrink-0 bg-black"
                >
                  <img
                    src={selectedItem.poster || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {Number(selectedItem.year) >= 2025 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-black font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(0,240,255,0.6)]">
                        <Sparkles size={11} />
                        <span>ESTRENO RECIENTE</span>
                      </span>
                    )}
                    <span
                      style={{ color: themeColorStr }}
                      className="px-2.5 py-0.5 rounded bg-black/60 font-mono text-xs font-bold border border-white/20"
                    >
                      {selectedItem.year || 2025}
                    </span>
                    {selectedItem.rating && (
                      <span className="text-xs font-mono text-[#FFD700] font-bold flex items-center gap-1">
                        <Star size={11} fill="currentColor" />
                        <span>{selectedItem.rating}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black font-mono text-white leading-tight">
                    {selectedItem.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#9AA3B5] leading-relaxed">
                {'synopsis' in selectedItem
                  ? selectedItem.synopsis
                  : 'plot' in selectedItem
                  ? (selectedItem as any).plot
                  : 'Transmisión estelar de alta definición sin cortes ni interrupciones mediante CAOSCORP.'}
              </p>

              {/* If it's a series: Season / Episode Selector */}
              {type === 'series' && (
                <div className="space-y-3 pt-2 border-t border-[#2A2F45]">
                  <div className="flex items-center gap-2">
                    <Layers size={14} style={{ color: themeColorStr }} />
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      TEMPORADAS:
                    </span>
                    {[1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSeason(s)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-colors ${
                          selectedSeason === s
                            ? 'bg-white text-black border-white'
                            : 'bg-[#101424] text-[#9AA3B5] border-[#2A2F45]'
                        }`}
                      >
                        T{s}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {[1, 2, 3, 4, 5, 6].map((ep) => (
                      <button
                        key={ep}
                        onClick={() => {
                          cyberSound.warp();
                          const url =
                            (selectedItem as SeriesItem).streamUrl ||
                            'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
                          onPlayItem(`${selectedItem.title} - T${selectedSeason}:E0${ep}`, url);
                          setSelectedItem(null);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#101424] hover:bg-[#181A22] border border-[#2A2F45] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Play size={12} style={{ color: themeColorStr }} fill="currentColor" />
                          <span className="text-xs font-mono font-bold text-white">
                            Episodio {ep}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#9AA3B5]">45 min · HD</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* If it's a movie: Direct Play Button */}
              {type === 'movies' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      cyberSound.warp();
                      const url =
                        (selectedItem as MovieItem).streamUrl ||
                        'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
                      onPlayItem(selectedItem.title, url);
                      setSelectedItem(null);
                    }}
                    style={{
                      backgroundColor: themeColorStr,
                      boxShadow: `0 0 25px ${themeColorStr}80`,
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-[#07080D] font-mono font-black text-xs tracking-wider transition-all cursor-pointer hover:scale-105"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>REPRODUCIR PELÍCULA AHORA</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
