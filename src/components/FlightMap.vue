<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Aircraft, MapBounds } from '../composables/useFlightTracking';

const props = defineProps<{
  aircraft: Aircraft[];
  selectedAircraft: Aircraft | null;
  isFollowing: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const markers = new Map<string, L.Marker>();
const currentBounds = ref<MapBounds | null>(null);

// Optimized Plane Icon
const createIcon = (heading: number, isSelected: boolean) => {
  const color = isSelected ? '#FB4D02' : '#FFFFFF';
  const size = isSelected ? 22 : 14;
  const shadow = isSelected ? 'drop-shadow(0 0 8px rgba(251, 77, 2, 0.5))' : 'none';
  
  return L.divIcon({
    className: 'plane-node',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.5s linear; filter: ${shadow};">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}">
          <path d="M21,16L21,14L13,9L13,3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5L10,9L2,14L2,16L10,13.5L10,19L8,20.5L8,22L11.5,21L15,22L15,20.5L13,19L13,13.5L21,16Z" fill="${color}" stroke="#000" stroke-width="0.5"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Update bounds when map moves (for client-side filtering)
const updateBounds = () => {
  if (!map) return;
  const b = map.getBounds();
  currentBounds.value = {
    south: b.getSouth(),
    west: b.getWest(),
    north: b.getNorth(),
    east: b.getEast()
  };
};

// Client-side filter: only show aircraft in viewport
const visibleAircraft = computed(() => {
  if (!currentBounds.value) return props.aircraft.slice(0, 200);
  
  const bounds = currentBounds.value;
  return props.aircraft.filter(ac => 
    ac.lat >= bounds.south && 
    ac.lat <= bounds.north && 
    ac.lng >= bounds.west && 
    ac.lng <= bounds.east
  ).slice(0, 300); // Limit for performance
});

const initMap = () => {
  if (!mapContainer.value || map) return;

  map = L.map(mapContainer.value, {
    zoomControl: false,
    preferCanvas: true,
    worldCopyJump: true,
    attributionControl: false
  }).setView([5, 115], 5);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Listen for map movement to update client-side filter
  map.on('moveend', updateBounds);
  map.on('zoomend', updateBounds);
  
  // Initial bounds
  setTimeout(updateBounds, 300);
};

const syncAircraft = () => {
  if (!map) return;

  const currentIds = new Set(visibleAircraft.value.map(a => a.icao24));
  
  // Remove markers not in visible set
  markers.forEach((m, id) => {
    if (!currentIds.has(id)) {
      m.remove();
      markers.delete(id);
    }
  });

  // Update or add aircraft with smooth animation
  visibleAircraft.value.forEach(ac => {
    const isSelected = props.selectedAircraft?.icao24 === ac.icao24;
    const pos: [number, number] = [ac.lat, ac.lng];

    if (markers.has(ac.icao24)) {
      const m = markers.get(ac.icao24)!;
      // Smooth position update
      const currentPos = m.getLatLng();
      if (Math.abs(currentPos.lat - ac.lat) > 0.0001 || Math.abs(currentPos.lng - ac.lng) > 0.0001) {
        m.setLatLng(pos);
      }
      m.setIcon(createIcon(ac.heading, isSelected));
      m.setZIndexOffset(isSelected ? 2000 : 0);
    } else {
      const m = L.marker(pos, {
        icon: createIcon(ac.heading, isSelected)
      })
      .on('click', () => emit('select', ac.icao24))
      .addTo(map!);
      markers.set(ac.icao24, m);
    }
  });

  // Auto-follow selected aircraft
  if (props.selectedAircraft && props.isFollowing && map) {
    map.panTo([props.selectedAircraft.lat, props.selectedAircraft.lng], { 
      animate: true,
      duration: 1
    });
  }
};

// Watch for aircraft changes and sync markers
watch(() => props.aircraft, syncAircraft, { deep: false });
watch(visibleAircraft, syncAircraft);
watch(() => props.selectedAircraft, syncAircraft);
watch(() => props.isFollowing, (newVal) => {
  if (newVal && props.selectedAircraft && map) {
    map.panTo([props.selectedAircraft.lat, props.selectedAircraft.lng], { animate: true });
  }
});

// Periodic sync for interpolation animation
let animationTimer: number;

onMounted(() => {
  initMap();
  syncAircraft();
  // Sync every 2 seconds to show interpolated positions
  animationTimer = window.setInterval(syncAircraft, 2000);
});

onUnmounted(() => {
  clearInterval(animationTimer);
  if (map) map.remove();
});
</script>

<template>
  <div class="map-root w-full h-full bg-[#0B0E11] relative">
    <div ref="mapContainer" class="w-full h-full"></div>
    <div class="absolute inset-0 pointer-events-none opacity-5 bg-bloomberg-amber mix-blend-overlay"></div>
    
    <!-- Viewport count indicator -->
    <div class="absolute bottom-4 left-4 z-10">
      <div class="px-3 py-1.5 bg-black/80 border border-white/5 rounded-full">
        <span class="text-[8px] font-black text-neutral-400 uppercase tracking-widest">
          {{ visibleAircraft.length }} in viewport
        </span>
      </div>
    </div>
  </div>
</template>

<style>
.plane-node { background: transparent !important; border: none !important; }
.leaflet-container { background: #0B0E11 !important; outline: none; }
</style>
