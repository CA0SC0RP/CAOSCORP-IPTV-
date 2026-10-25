import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createPlanetTexture, createStarfield, getIsSoftwareGl } from './CosmicShaders';
import { cyberSound } from './CyberSound';
import { Orbit, Play, Film, Clapperboard, Radio, SearchCheck, MoveHorizontal, Sparkles } from 'lucide-react';

interface CosmicLauncher3DProps {
  onEnterPortal: (portal: 'movies' | 'series' | 'live' | 'scanner') => void;
  channelCount: number;
  movieCount: number;
  seriesCount: number;
}

export const CosmicLauncher3D: React.FC<CosmicLauncher3DProps> = ({
  onEnterPortal,
  channelCount,
  movieCount,
  seriesCount,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activePortalIndex, setActivePortalIndex] = useState<number>(0);
  const [isWarping, setIsWarping] = useState<boolean>(false);

  const portalsData = [
    {
      id: 'movies',
      name: 'PLANETA CINE // PELÍCULAS',
      subtitle: 'Mundo 3D Orbital con Catálogo VOD',
      badge: `${movieCount || '250+'} TÍTULOS EN ÓRBITA`,
      color: '#00F0FF',
      icon: Film,
      description: 'Ingresa al planeta de películas donde los títulos giran en un cinturón 3D holográfico interactivo.',
    },
    {
      id: 'series',
      name: 'NEXUS ESTELAR // SERIES',
      subtitle: 'Estación Orbital de Temporadas',
      badge: `${seriesCount || '80+'} SERIES COMPLETAS`,
      color: '#FF0077',
      icon: Clapperboard,
      description: 'Viaja a la estación espacial de series para explorar capítulos y temporadas en gravedad cero.',
    },
    {
      id: 'live',
      name: 'PÚLSAR CUÁNTICO // IPTV EN VIVO',
      subtitle: 'Frecuencia Directa de Televisión',
      badge: `${channelCount || '120+'} SEÑALES EN VIVO`,
      color: '#00FF88',
      icon: Radio,
      description: 'Sintoniza emisiones en tiempo real sin búfer con zapping instantáneo y telemetría de transmisión.',
    },
    {
      id: 'scanner',
      name: 'VÓRTICE WORMHOLE // ESCÁNER',
      subtitle: 'Multi-Checker Masivo de Listas',
      badge: 'PROCESAMIENTO PARALELO',
      color: '#FFB703',
      icon: SearchCheck,
      description: 'Canaliza múltiples listas M3U y servidores Xtream simultáneamente a través del agujero de gusano.',
    },
  ] as const;

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitalRingRef = useRef<THREE.Group | null>(null);
  const portalMeshesRef = useRef<THREE.Mesh[]>([]);
  const corePlanetRef = useRef<THREE.Mesh | null>(null);

  const targetOrbitAngleRef = useRef<number>(0);
  const currentOrbitAngleRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isSoftwareGl = getIsSoftwareGl();

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x05060b, 0.025);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 8.8);
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
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x080f1e, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const cyanGlow = new THREE.PointLight(0x00f0ff, 5.0, 15);
    cyanGlow.position.set(-4, -1, 3);
    scene.add(cyanGlow);

    const pinkGlow = new THREE.PointLight(0xff0077, 4.5, 15);
    pinkGlow.position.set(4, -1, 3);
    scene.add(pinkGlow);

    // Add Cosmic Starfield
    const stars = createStarfield(isSoftwareGl ? 350 : 700);
    scene.add(stars);

    // CENTRAL CORE PLANET (Procedural atmospheric sphere)
    const planetGeo = new THREE.SphereGeometry(1.65, 32, 32);
    const planetTex = createPlanetTexture('cyan');
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.35,
      metalness: 0.65,
      bumpScale: 0.05,
    });
    const corePlanet = new THREE.Mesh(planetGeo, planetMat);
    corePlanetRef.current = corePlanet;
    scene.add(corePlanet);

    // Planet Atmospheric Halo Rings
    const ringGeo1 = new THREE.RingGeometry(2.1, 2.35, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    scene.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(2.5, 2.55, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff0077,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 1.9;
    scene.add(ring2);

    // ORBITAL CAROUSEL GROUP (Contains the 4 Portals in 3D Space)
    const orbitalGroup = new THREE.Group();
    orbitalRingRef.current = orbitalGroup;
    scene.add(orbitalGroup);

    const orbitRadius = 4.4;
    const portalMeshes: THREE.Mesh[] = [];

    const portalColors = [0x00f0ff, 0xff0077, 0x00ff88, 0xffb703];
    const portalTextures = [
      createPlanetTexture('cyan'),
      createPlanetTexture('magenta'),
      createPlanetTexture('emerald'),
      createPlanetTexture('gold'),
    ];

    portalsData.forEach((p, i) => {
      const angle = (i / portalsData.length) * Math.PI * 2;
      const x = Math.sin(angle) * orbitRadius;
      const z = Math.cos(angle) * orbitRadius;

      const portalHolder = new THREE.Group();
      portalHolder.position.set(x, 0, z);

      // Planet / Celestial Orb for this portal
      const orbGeo = new THREE.SphereGeometry(0.72, 28, 28);
      const orbMat = new THREE.MeshStandardMaterial({
        map: portalTextures[i],
        roughness: 0.25,
        metalness: 0.6,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.userData = { index: i, id: p.id };
      portalHolder.add(orb);
      portalMeshes.push(orb);

      // Neon Orbital Halo for each portal
      const haloGeo = new THREE.TorusGeometry(0.95, 0.02, 16, 64);
      const haloMat = new THREE.MeshBasicMaterial({
        color: portalColors[i],
        transparent: true,
        opacity: 0.8,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2.2;
      portalHolder.add(halo);

      // Energy Vertical Beam
      const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.8, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: portalColors[i],
        transparent: true,
        opacity: 0.35,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      portalHolder.add(beam);

      orbitalGroup.add(portalHolder);
    });

    portalMeshesRef.current = portalMeshes;

    // Raycasting for pointer selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(portalMeshesRef.current);

      if (hits.length > 0) {
        const hitOrb = hits[0].object as THREE.Mesh;
        const idx = hitOrb.userData.index;
        selectPortalIndex(idx);
      }
    };

    // Drag to rotate handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseXRef.current = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - lastMouseXRef.current;
      lastMouseXRef.current = e.clientX;
      targetOrbitAngleRef.current += deltaX * 0.005;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      // Snap to closest portal index
      snapToClosestIndex();
    };

    // Touch support for mobiles / tablets / touch TVs
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastMouseXRef.current = e.touches[0].clientX;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - lastMouseXRef.current;
      lastMouseXRef.current = e.touches[0].clientX;
      targetOrbitAngleRef.current += deltaX * 0.005;
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      snapToClosestIndex();
    };

    container.addEventListener('click', onPointerClick);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    const snapToClosestIndex = () => {
      const step = (Math.PI * 2) / portalsData.length;
      let raw = -targetOrbitAngleRef.current / step;
      let normalized = Math.round(raw) % portalsData.length;
      if (normalized < 0) normalized += portalsData.length;
      setActivePortalIndex(normalized);
      targetOrbitAngleRef.current = -normalized * step;
      cyberSound.hover();
    };

    // Keyboard navigation (D-Pad compatibility for TVs)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        rotateByStep(+1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        rotateByStep(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerWarp(activePortalIndex);
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

      // Continuous rotation of the central planet
      if (corePlanetRef.current) {
        corePlanetRef.current.rotation.y += delta * 0.15;
      }
      ring1.rotation.z += delta * 0.08;
      ring2.rotation.z -= delta * 0.05;
      stars.rotation.y += delta * 0.015;

      // Smooth interpolation of orbital angle
      currentOrbitAngleRef.current +=
        (targetOrbitAngleRef.current - currentOrbitAngleRef.current) * 0.08;

      if (orbitalRingRef.current) {
        orbitalRingRef.current.rotation.y = currentOrbitAngleRef.current;
      }

      // Rotate each sub-orb
      portalMeshesRef.current.forEach((m) => {
        m.rotation.y += delta * 0.25;
      });

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
  }, []);

  const selectPortalIndex = (idx: number) => {
    setActivePortalIndex(idx);
    const step = (Math.PI * 2) / portalsData.length;
    targetOrbitAngleRef.current = -idx * step;
    cyberSound.click();
  };

  const rotateByStep = (delta: number) => {
    const nextIdx = (activePortalIndex + delta + portalsData.length) % portalsData.length;
    selectPortalIndex(nextIdx);
  };

  const triggerWarp = (idx: number) => {
    cyberSound.warp();
    setIsWarping(true);

    // Zoom camera into portal
    const target = portalsData[idx].id as 'movies' | 'series' | 'live' | 'scanner';
    setTimeout(() => {
      onEnterPortal(target);
    }, 750);
  };

  const activePortal = portalsData[activePortalIndex];
  const Icon = activePortal.icon;

  return (
    <div className="relative h-full w-full bg-[#05060B] overflow-hidden select-none flex flex-col justify-between">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className={`absolute inset-0 cursor-grab active:cursor-grabbing z-10 transition-transform duration-700 ${
          isWarping ? 'scale-150 opacity-0 blur-md' : 'scale-100 opacity-100'
        }`}
      />

      {/* Warp Speed Hyperspace Overlay when entering a world */}
      {isWarping && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-t-[#00F0FF] border-r-[#FF0077] border-b-transparent border-l-transparent animate-spin" />
            <h3 className="text-2xl font-black font-mono tracking-widest text-white uppercase">
              SALTANDO HIPERESPACIO // WORMHOLE ACTIVADO
            </h3>
            <p className="text-xs font-mono text-[#00F0FF]">Sincronizando coordenadas cuánticas...</p>
          </div>
        </div>
      )}

      {/* Top Cosmic Header HUD */}
      <div className="relative z-20 p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00F0FF] shadow-[0_0_15px_#00F0FF] animate-pulse" />
          <div>
            <h1 className="text-[20px] font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF0077] leading-none uppercase">
              CAOS ASTRAL // COSMOS IPTV
            </h1>
            <p className="text-[10px] font-mono text-[#9AA3B5] tracking-widest mt-0.5">
              SISTEMA MULTIMEDIA INTERGALÁCTICO 3D
            </p>
          </div>
        </div>

        {/* Orbit hint */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] pointer-events-auto">
          <MoveHorizontal size={14} />
          <span>GIRA EL COSMOS O USA LAS FLECHAS ◄ ►</span>
        </div>
      </div>

      {/* Active Portal Focused HUD Card (Bottom Center) */}
      <div className="relative z-20 pb-8 px-6 max-w-2xl mx-auto w-full pointer-events-auto">
        <div
          style={{ borderColor: activePortal.color }}
          className="relative bg-[#0A0D1A]/95 border-2 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,240,255,0.25)] backdrop-blur-xl transition-all duration-300"
        >
          {/* Top indicator & badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                style={{ backgroundColor: activePortal.color }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#07080D] shadow-md font-bold"
              >
                <Icon size={18} />
              </div>
              <span className="text-[12px] font-mono font-bold tracking-wider uppercase text-white">
                {activePortal.subtitle}
              </span>
            </div>

            <span
              style={{ color: activePortal.color, borderColor: `${activePortal.color}50` }}
              className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-black/50"
            >
              {activePortal.badge}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wide">
            {activePortal.name}
          </h2>

          <p className="text-sm text-[#9AA3B5] mt-2 leading-relaxed">
            {activePortal.description}
          </p>

          {/* Action Row */}
          <div className="mt-5 pt-4 border-t border-[#2A2F45] flex items-center justify-between gap-4">
            {/* Quick Portal Switcher Pills */}
            <div className="flex items-center gap-2">
              {portalsData.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => selectPortalIndex(i)}
                  className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                    activePortalIndex === i
                      ? 'scale-125 shadow-[0_0_10px_#00F0FF]'
                      : 'opacity-40 hover:opacity-80'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
            </div>

            {/* Enter Portal Button */}
            <button
              onClick={() => triggerWarp(activePortalIndex)}
              style={{
                backgroundColor: activePortal.color,
                boxShadow: `0 0 25px ${activePortal.color}80`,
              }}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[#07080D] font-mono font-black text-sm tracking-wider transition-all cursor-pointer hover:brightness-110 active:scale-95"
            >
              <Play size={16} fill="currentColor" />
              <span>ENTRAR AL MUNDO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
