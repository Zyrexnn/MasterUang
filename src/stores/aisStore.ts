import { defineStore } from 'pinia';
import { shallowRef, ref, watch } from 'vue';
import { REGIONS, DEFAULT_REGION, type Region } from '../config/regions';

export interface Vessel {
  mmsi: number;
  name: string;
  position: { lat: number; lng: number };
  sog: number;
  cog: number;
  heading: number;
  lastUpdate: number;
  isSimulated?: boolean;
}

export const useAisStore = defineStore('ais', () => {
  // Use shallowRef for high-performance updates on large vessel datasets
  const vessels = shallowRef<Record<number, Vessel>>({});
  const isConnected = ref(false);
  const isPolling = ref(false);
  const error = ref<string | null>(null);
  const lastUpdate = ref<number>(Date.now());
  const selectedRegion = ref<Region>(DEFAULT_REGION);
  const stats = ref({
    activeCount: 0,
    totalPackets: 0
  });

  // Load from localStorage on init (safe)
  try {
    const savedData = localStorage.getItem('zen_ais_cache');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      vessels.value = parsed.vessels || {};
      stats.value.activeCount = Object.keys(vessels.value).length;
      lastUpdate.value = parsed.lastUpdate || Date.now();

      const savedRegionId = localStorage.getItem('zen_ais_region');
      if (savedRegionId && REGIONS[savedRegionId]) {
        selectedRegion.value = REGIONS[savedRegionId];
      }
    }
  } catch (e) {
    console.warn('Failed to load AIS cache');
  }

  // Persist to localStorage whenever vessels change
  watch(vessels, (newVessels) => {
    try {
      localStorage.setItem('zen_ais_cache', JSON.stringify({
        vessels: newVessels,
        lastUpdate: lastUpdate.value
      }));
    } catch { /* noop */ }
  }, { deep: false });

  // Persist region selection
  watch(selectedRegion, (newRegion) => {
    try { localStorage.setItem('zen_ais_region', newRegion.id); } catch { /* noop */ }
  });

  function updateVesselsBatch(newVessels: Record<number, Vessel>) {
    const updated = { ...vessels.value };
    let changed = false;

    for (const mmsi in newVessels) {
      updated[Number(mmsi)] = newVessels[mmsi];
      changed = true;
    }

    if (changed) {
      vessels.value = updated;
      stats.value.activeCount = Object.keys(updated).length;
      lastUpdate.value = Date.now();
      stats.value.totalPackets += Object.keys(newVessels).length;
    }
  }

  function setVessels(newVessels: Record<number, Vessel>) {
    vessels.value = newVessels;
    stats.value.activeCount = Object.keys(newVessels).length;
    lastUpdate.value = Date.now();
  }

  function setRegion(regionId: string) {
    if (REGIONS[regionId]) {
      selectedRegion.value = REGIONS[regionId];
      // Clear vessels on region change to avoid confusion
      vessels.value = {};
      stats.value.activeCount = 0;
    }
  }

  function clearOldVessels(timeoutMs = 600000) {
    const now = Date.now();
    const updated = { ...vessels.value };
    let changed = false;

    for (const mmsi in updated) {
      if (now - updated[mmsi].lastUpdate > timeoutMs) {
        delete updated[mmsi];
        changed = true;
      }
    }

    if (changed) {
      vessels.value = updated;
      stats.value.activeCount = Object.keys(updated).length;
    }
  }

  function setError(msg: string | null) {
    error.value = msg;
  }

  function setConnectionStatus(status: boolean) {
    isConnected.value = status;
  }

  function updateVessel(mmsi: number, data: any) {
    const updated = { ...vessels.value };

    // Extract data from AIS message
    const lat = data.MetaData?.latitude || data.Metadata?.latitude || data.MetaData?.Latitude || 0;
    const lng = data.MetaData?.longitude || data.Metadata?.longitude || data.MetaData?.Longitude || 0;
    const name = data.MetaData?.ShipName || data.Metadata?.ShipName || `MMSI: ${mmsi}`;

    updated[mmsi] = {
      mmsi,
      name,
      position: { lat, lng },
      sog: data.Message?.PositionReport?.Sog || 0,
      cog: data.Message?.PositionReport?.Cog || 0,
      heading: data.Message?.PositionReport?.TrueHeading || 0,
      lastUpdate: Date.now()
    };

    vessels.value = updated;
    stats.value.activeCount = Object.keys(updated).length;
    stats.value.totalPackets++;
    lastUpdate.value = Date.now();
  }

  return {
    vessels,
    isConnected,
    isPolling,
    error,
    lastUpdate,
    selectedRegion,
    stats,
    setError,
    setConnectionStatus,
    updateVessel,
    updateVesselsBatch,
    setVessels,
    setRegion,
    clearOldVessels
  };
});


