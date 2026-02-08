<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, shallowRef } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useAisStore } from '../stores/aisStore';

const props = defineProps<{
  center?: [number, number];
  zoom?: number;
}>();

const store = useAisStore();
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let clusterGroup: any = null;
const markers = new Map<number, L.Marker>();

// Shallow reference for the local copy to avoid deep reactive overhead
const visibleMmsis = shallowRef<Set<number>>(new Set());

const createShipIcon = (heading: number, name: string) => {
  const rotation = heading || 0;
  return L.divIcon({
    className: 'ship-marker-container',
    html: `
      <div class="ship-icon-wrapper">
        <div style="transform: rotate(${rotation}deg)" class="ship-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L18 20L12 16L6 20L12 2Z" fill="#FB4D02" stroke="#FFB74D" stroke-width="1.5"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

const initMap = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
    worldCopyJump: true
  }).setView(props.center || [-2.5489, 118.0149], props.zoom || 5);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Initialize Cluster Group with Bloomberg styling
  clusterGroup = (L as any).markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: (cluster: any) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="zen-cluster"><span>${count}</span></div>`,
        className: 'custom-cluster-icon',
        iconSize: [32, 32],
      });
    }
  });
  map.addLayer(clusterGroup);

  map.on('moveend', () => syncMarkers());
  map.on('zoomend', () => syncMarkers());
  
  // Auto-fit bounds on region change
  watch(() => store.selectedRegion, (newRegion) => {
    if (map && newRegion.bbox) {
       map.fitBounds(newRegion.bbox);
       // Reset cluster group to prevent old markers ghosting
       clusterGroup.clearLayers();
       markers.clear();
    }
  }, { immediate: true });
};

const syncMarkers = () => {
  if (!map || !clusterGroup) return;

  const vessels = store.vessels;
  const bounds = map.getBounds().pad(0.1);
  const currentMmsis = Object.keys(vessels).map(Number);
  
  // Viewport Culling + Limit displayed vessels (top 500)
  const toDisplay = currentMmsis
    .filter(mmsi => bounds.contains([vessels[mmsi].position.lat, vessels[mmsi].position.lng]))
    .slice(0, 500);

  const displaySet = new Set(toDisplay);

  // 1. Remove old markers
  for (const [mmsi, marker] of markers.entries()) {
    if (!displaySet.has(mmsi)) {
      clusterGroup.removeLayer(marker);
      markers.delete(mmsi);
    }
  }

  // 2. Update/Add new ones
  toDisplay.forEach(mmsi => {
    const vessel = vessels[mmsi];
    const pos: [number, number] = [vessel.position.lat, vessel.position.lng];

    if (markers.has(mmsi)) {
      const marker = markers.get(mmsi)!;
      marker.setLatLng(pos);
      marker.setIcon(createShipIcon(vessel.heading || vessel.cog, vessel.name));
    } else {
      const marker = L.marker(pos, {
        icon: createShipIcon(vessel.heading || vessel.cog, vessel.name)
      });

      marker.bindPopup(`
        <div class="zen-ship-popup">
          <div class="popup-header"><h3>${vessel.name}</h3></div>
          <div class="popup-grid">
            <div class="grid-item"><label>MMSI</label><span>${vessel.mmsi}</span></div>
            <div class="grid-item"><label>SPEED</label><span>${vessel.sog} KTS</span></div>
            <div class="grid-item"><label>COURSE</label><span>${vessel.cog}°</span></div>
            <div class="grid-item"><label>LAST SYNC</label><span>${Math.round((Date.now() - vessel.lastUpdate) / 1000)}s ago</span></div>
          </div>
        </div>
      `, { className: 'zen-popup', minWidth: 200 });

      clusterGroup.addLayer(marker);
      markers.set(mmsi, marker);
    }
  });
};

// Throttle marker updates to every 5 seconds for stability
let syncTimer: any = null;
watch(() => store.lastUpdate, () => {
  if (syncTimer) return;
  syncTimer = setTimeout(() => {
    syncMarkers();
    syncTimer = null;
  }, 5000);
});

onMounted(() => {
  initMap();
  syncMarkers();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="w-full h-full relative bg-[#0F1117]">
    <div ref="mapContainer" class="w-full h-full z-10"></div>
    
    <!-- No vessels empty state overlay -->
    <div v-if="store.stats.activeCount === 0 && !store.isPolling" 
         class="absolute inset-0 z-20 flex items-center justify-center bg-[#0F1117]/60 backdrop-blur-sm pointer-events-none">
       <div class="text-center">
          <p class="text-amber-500 font-mono text-xs uppercase tracking-widest mb-2">No active vessels in zone</p>
          <p class="text-neutral-500 text-[10px] uppercase">Try manual refresh or adjusting filters</p>
       </div>
    </div>
  </div>
</template>

<style>
.zen-cluster {
  background: rgba(251, 77, 2, 0.2);
  border: 1px solid #FB4D02;
  color: #FFB74D;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 900;
  backdrop-filter: blur(4px);
}

.ship-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ship-arrow {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.zen-ship-popup {
  padding: 12px;
  background: #161A23;
  min-width: 200px;
}

.popup-header h3 {
  font-size: 11px;
  font-weight: 900;
  color: #FB4D02;
  text-transform: uppercase;
  margin: 0 0 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
}

.popup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.grid-item label {
  font-size: 7px;
  color: #525252;
  text-transform: uppercase;
  display: block;
}

.grid-item span {
  font-size: 10px;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
}

.zen-popup .leaflet-popup-content-wrapper {
  background: #161A23 !important;
  border-radius: 8px !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  padding: 0 !important;
}

.zen-popup .leaflet-popup-content {
  margin: 0 !important;
}

.zen-popup .leaflet-popup-tip {
  background: #161A23 !important;
}
</style>
