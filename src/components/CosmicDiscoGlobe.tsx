import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createStarfield, getIsSoftwareGl } from './CosmicShaders';
import { cyberSound } from './CyberSound';
import { MovieItem, SeriesItem, Channel } from '../data/models';
import { Play, RotateCw, Star, X, MoveHorizontal, Subtitles, Volume2, Sparkles, Layers } from 'lucide-react';

interface CosmicDiscoGlobeProps {
  items: (MovieItem | SeriesItem | Channel)[];
  type: 'movies' | 'series' | 'live';
  onPlayItem: (title: string, streamUrl: string) => void;
}

export const CosmicDiscoGlobe: React.FC<CosmicDiscoGlobeProps> = ({
  items,
  type,
  onPlayItem,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MovieItem | SeriesItem | Channel | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const discoGlobeRef = useRef<THREE.Group | null>(null);
  const tileMeshesRef = useRef<THREE.Mesh[]>([]);

  // 3D Ball Rotation State
  const rotationXRef = useRef<number>(0.1);
  const rotationYRef = useRef<number>(0);
  const targetRotXRef = useRef<number>(0.1);
  const targetRotYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const themeColor =
    type === 'movies' ? 0x00f0ff : type === 'series' ? 0xff0077 : 0x00ff88;
  const themeHexStr =
    type === 'movies' ? '#00F0FF' : type === 'series' ? '#FF0077' : '#00FF88';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isSoftwareGl = getIsSoftwareGl();

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x04060d, 0.03);

    // Camera
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Ambient & Specular Lighting for Disco Ball Facets
    const ambientLight = new THREE.AmbientLight(0x0c1328, 1.8);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    mainKeyLight.position.set(6, 8, 6);
    scene.add(mainKeyLight);

    const specularLight = new THREE.DirectionalLight(themeColor, 3.5);
    specularLight.position.set(-6, -4, 5);
    scene.add(specularLight);

    const centerGlow = new THREE.PointLight(themeColor, 5.0, 15);
    centerGlow.position.set(0, 0, 0);
    scene.add(centerGlow);

    // Starfield Background
    const stars = createStarfield(isSoftwareGl ? 350 : 800);
    scene.add(stars);

    // DISCO GLOBE GROUP (El Globo / Bola de Disco 3D con Cuadritos de Series/Películas)
    const discoGlobe = new THREE.Group();
    discoGlobeRef.current = discoGlobe;
    scene.add(discoGlobe);

    // Inner Metallic Core Sphere (Reflective Mirror Sphere inside)
    const coreGeo = new THREE.SphereGeometry(2.35, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x070c18,
      metalness: 0.95,
      roughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    discoGlobe.add(coreMesh);

    // Neon Equator & Latitude Rings on the Disco Globe
    const equatorGeo = new THREE.RingGeometry(2.4, 2.45, 64);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const equator = new THREE.Mesh(equatorGeo, equatorMat);
    equator.rotation.x = Math.PI / 2;
    discoGlobe.add(equator);

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

    // Distribute content tiles across the globe surface
    const tileMeshes: THREE.Mesh[] = [];
    const count = Math.min(sortedItems.length, 42); // Balanced count for high performance and density
    const globeRadius = 2.45;
    const tileWidth = 0.55;
    const tileHeight = 0.78;

    const tileGeo = new THREE.PlaneGeometry(tileWidth, tileHeight);
    const borderGeo = new THREE.PlaneGeometry(tileWidth + 0.04, tileHeight + 0.04);
    const textureLoader = new THREE.TextureLoader();

    // Generate Fibonacci sphere positions
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / Math.max(1, count - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      positions.push(new THREE.Vector3(x * globeRadius, y * globeRadius, z * globeRadius));
    }

    // Sort positions by distance to the front center (0, 0, globeRadius)
    // This GUARANTEES that the newest/most recent series & movies (indices 0..N)
    // appear right at the center front facets facing the user!
    const frontFocus = new THREE.Vector3(0, 0, globeRadius);
    positions.sort((a, b) => a.distanceTo(frontFocus) - b.distanceTo(frontFocus));

    for (let i = 0; i < count; i++) {
      const item = sortedItems[i % sortedItems.length];
      const pos = positions[i];

      const tileHolder = new THREE.Group();
      tileHolder.position.copy(pos);
      // Orient facet to face outward normal from globe center
      tileHolder.lookAt(pos.clone().multiplyScalar(2));

      // Recent releases get a glowing golden/cyan border
      const itemYear = 'year' in item ? Number(item.year) || 0 : 0;
      const isRecent = itemYear >= 2025 || i < 6;

      const borderMat = new THREE.MeshBasicMaterial({
        color: isRecent ? 0x00f0ff : themeColor,
        transparent: true,
        opacity: isRecent ? 0.9 : 0.5,
      });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.z = -0.005;
      tileHolder.add(border);

      // Card Texture (Poster or Channel Logo)
      const posterUrl = 'poster' in item ? item.poster : 'logo' in item ? (item as Channel).logo : null;
      const titleStr = 'title' in item ? item.title : (item as Channel).name;

      let texture: THREE.Texture;
      if (posterUrl) {
        texture = textureLoader.load(
          posterUrl,
          (t: THREE.Texture) => {
            t.colorSpace = THREE.SRGBColorSpace;
          },
          undefined,
          () => {
            const canvas = document.createElement('canvas');
            canvas.width = 180;
            canvas.height = 240;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#060B18';
            ctx.fillRect(0, 0, 180, 240);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(titleStr.substring(0, 12), 90, 120);
            const fallbackTex = new THREE.CanvasTexture(canvas);
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            (tileMesh.material as THREE.MeshStandardMaterial).map = fallbackTex;
            (tileMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
          }
        );
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 240;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#060B18';
        ctx.fillRect(0, 0, 180, 240);
        ctx.fillStyle = themeHexStr;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(titleStr.substring(0, 12), 90, 120);
        texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
      }

      const tileMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.15,
        metalness: 0.8,
        side: THREE.DoubleSide,
      });

      const tileMesh = new THREE.Mesh(tileGeo, tileMat);
      tileMesh.userData = { index: i, item };
      tileHolder.add(tileMesh);
      tileMeshes.push(tileMesh);

      discoGlobe.add(tileHolder);
    }

    tileMeshesRef.current = tileMeshes;

    // Raycasting for clicking facets
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(tileMeshesRef.current);

      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh;
        const itm = hit.userData.item;
        cyberSound.click();
        setSelectedItem(itm);
      }
    };

    // Drag to spin the Disco Ball in 3D
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      targetRotYRef.current += dx * 0.005;
      targetRotXRef.current += dy * 0.005;
      // Clamp vertical tilt
      targetRotXRef.current = Math.max(-0.8, Math.min(0.8, targetRotXRef.current));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support for TV & Mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMousePosRef.current.x;
      const dy = e.touches[0].clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      targetRotYRef.current += dx * 0.005;
      targetRotXRef.current += dy * 0.005;
      targetRotXRef.current = Math.max(-0.8, Math.min(0.8, targetRotXRef.current));
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

    // Keyboard navigation (D-Pad)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        targetRotYRef.current += 0.3;
        cyberSound.hover();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        targetRotYRef.current -= 0.3;
        cyberSound.hover();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        targetRotXRef.current = Math.min(0.8, targetRotXRef.current + 0.2);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        targetRotXRef.current = Math.max(-0.8, targetRotXRef.current - 0.2);
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

      // Disco Ball auto-rotation
      if (!isDraggingRef.current && autoRotate) {
        targetRotYRef.current += delta * 0.15;
      }

      rotationYRef.current += (targetRotYRef.current - rotationYRef.current) * 0.08;
      rotationXRef.current += (targetRotXRef.current - rotationXRef.current) * 0.08;

      if (discoGlobeRef.current) {
        discoGlobeRef.current.rotation.y = rotationYRef.current;
        discoGlobeRef.current.rotation.x = rotationXRef.current;
      }

      stars.rotation.y += delta * 0.01;

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
      coreGeo.dispose();
      coreMat.dispose();
      equatorGeo.dispose();
      equatorMat.dispose();
      tileGeo.dispose();
      borderGeo.dispose();
    };
  }, [items, type, autoRotate]);

  return (
    <div className="relative h-full w-full bg-[#04060D] overflow-hidden select-none flex flex-col justify-between">
      {/* 3D WebGL Canvas (Globo / Bola de Disco Rotatoria en 3D) */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-10" />

      {/* Top Header HUD */}
      <div className="relative z-20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-none">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: themeHexStr, boxShadow: `0 0 15px ${themeHexStr}` }}
            className="w-3 h-3 rounded-full animate-pulse"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black font-mono tracking-widest text-white uppercase flex items-center gap-2">
                <span>{type === 'movies' ? 'GLOBO CINE' : type === 'series' ? 'DISCO BALL SERIES' : 'GLOBO CANALES'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                  {items.length} CUADRITOS FACETADOS
                </span>
              </h2>
              <span className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-mono font-bold tracking-wider">
                <Sparkles size={11} className="animate-spin" />
                <span>MÁS RECIENTES AL FRENTE</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#9AA3B5] tracking-wider mt-0.5">
              ROTACIÓN 3D INTERACTIVA · HAZ CLIC EN CUALQUIER CUADRITO PARA EXPLORAR
            </p>
          </div>
        </div>

        {/* Orbit Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#2A2F45] text-xs font-mono text-[#9AA3B5]">
            <MoveHorizontal size={14} style={{ color: themeHexStr }} />
            <span>GIRA EL GLOBO CON EL RATÓN / DEDO</span>
          </div>

          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              cyberSound.click();
            }}
            style={{ color: themeHexStr }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0A0D1A]/90 border border-[#2A2F45] text-xs font-mono font-bold cursor-pointer transition-colors"
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
            <span>{autoRotate ? 'GIRO ON' : 'PAUSADO'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Recuadro Pop-Up Card (When clicking a facet on the Disco Ball) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div
            style={{ borderColor: themeHexStr }}
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
                src={
                  'backdrop' in selectedItem && selectedItem.backdrop
                    ? selectedItem.backdrop
                    : 'poster' in selectedItem && selectedItem.poster
                    ? selectedItem.poster
                    : 'logo' in selectedItem && (selectedItem as Channel).logo
                    ? (selectedItem as Channel).logo!
                    : ''
                }
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D1A] via-[#0A0D1A]/70 to-transparent" />

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div
                  style={{ borderColor: themeHexStr }}
                  className="w-20 h-28 rounded-xl overflow-hidden border-2 shadow-xl shrink-0 bg-black"
                >
                  <img
                    src={
                      'poster' in selectedItem && selectedItem.poster
                        ? selectedItem.poster
                        : 'logo' in selectedItem && (selectedItem as Channel).logo
                        ? (selectedItem as Channel).logo!
                        : ''
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {'year' in selectedItem && Number(selectedItem.year) >= 2025 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-black font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(0,240,255,0.6)]">
                        <Sparkles size={11} />
                        <span>ESTRENO RECIENTE</span>
                      </span>
                    )}
                    {'year' in selectedItem && (
                      <span
                        style={{ color: themeHexStr }}
                        className="px-2.5 py-0.5 rounded bg-black/60 font-mono text-xs font-bold border border-white/20"
                      >
                        {selectedItem.year || 2025}
                      </span>
                    )}
                    {'rating' in selectedItem && selectedItem.rating && (
                      <span className="text-xs font-mono text-[#FFD700] font-bold flex items-center gap-1">
                        <Star size={11} fill="currentColor" />
                        <span>{selectedItem.rating}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black font-mono text-white leading-tight">
                    {'title' in selectedItem ? selectedItem.title : (selectedItem as Channel).name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Recuadro Information Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#9AA3B5] leading-relaxed">
                {'synopsis' in selectedItem
                  ? selectedItem.synopsis
                  : 'plot' in selectedItem
                  ? (selectedItem as any).plot
                  : 'Emisión estelar de alta definición con opciones avanzadas de subtítulos multilingües, cambio de idioma de audio y selección de calidad.'}
              </p>

              {/* If Series: Seasons & Episodes */}
              {type === 'series' && (
                <div className="space-y-3 pt-2 border-t border-[#2A2F45]">
                  <div className="flex items-center gap-2">
                    <Layers size={14} style={{ color: themeHexStr }} />
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {[1, 2, 3, 4].map((ep) => (
                      <button
                        key={ep}
                        onClick={() => {
                          cyberSound.warp();
                          const url =
                            (selectedItem as SeriesItem).streamUrl ||
                            'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
                          onPlayItem(
                            `${(selectedItem as SeriesItem).title} - T${selectedSeason}:E0${ep}`,
                            url
                          );
                          setSelectedItem(null);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#101424] hover:bg-[#181A22] border border-[#2A2F45] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Play size={12} style={{ color: themeHexStr }} fill="currentColor" />
                          <span className="text-xs font-mono font-bold text-white">
                            Episodio {ep}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#9AA3B5]">48 min · HD</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Expand & Play with Subtitles/Audio options */}
              <div className="pt-3 border-t border-[#2A2F45] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-[#9AA3B5]">
                  <Subtitles size={14} className="text-[#00F0FF]" />
                  <span>Subtítulos Multilingües</span>
                  <span>·</span>
                  <Volume2 size={14} className="text-[#00FF88]" />
                  <span>Audio Dual</span>
                </div>

                <button
                  onClick={() => {
                    cyberSound.warp();
                    const url =
                      'streamUrl' in selectedItem
                        ? (selectedItem as any).streamUrl
                        : 'url' in selectedItem
                        ? (selectedItem as Channel).url
                        : 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
                    const title =
                      'title' in selectedItem ? selectedItem.title : (selectedItem as Channel).name;
                    onPlayItem(title, url);
                    setSelectedItem(null);
                  }}
                  style={{
                    backgroundColor: themeHexStr,
                    boxShadow: `0 0 25px ${themeHexStr}80`,
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[#07080D] font-mono font-black text-xs tracking-wider transition-all cursor-pointer hover:scale-105"
                >
                  <Play size={15} fill="currentColor" />
                  <span>TRANSMITIR EN GRANDE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
