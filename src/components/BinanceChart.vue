<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useBinanceStore } from '../stores/binanceStore';
import { Activity, Zap, RefreshCw, BarChart3 } from 'lucide-vue-next';

const props = defineProps<{
    symbol: string;
    interval: string;
}>();

const binanceStore = useBinanceStore();
const isLoading = ref(true);
const chartData = ref<any[]>([]);

const fetchHistory = async () => {
    isLoading.value = true;
    const data = await binanceStore.fetchKlines(props.symbol, props.interval);
    if (data && data.length > 0) {
        // ApexCharts format: { x: timestamp, y: [open, high, low, close] }
        chartData.value = data.map((d: any) => ({
            x: d.time, // d.time is already MS from my store update
            y: [d.open, d.high, d.low, d.close]
        }));
    }
    isLoading.value = false;
};

const series = computed(() => [{
    name: 'Price Candlestick',
    data: chartData.value
}]);

const chartOptions = computed(() => ({
    chart: {
        type: 'candlestick',
        height: '100%',
        width: '100%',
        background: 'transparent',
        toolbar: {
            show: false,
        },
        sparkline: {
            enabled: false
        },
        animations: {
            enabled: true,
            speed: 400,
            dynamicAnimation: {
                enabled: true,
                speed: 200
            }
        }
    },
    plotOptions: {
        candlestick: {
            colors: {
                upward: '#0ECB81',
                downward: '#F6465D'
            },
            wick: {
                useFillColor: true
            }
        }
    },
    grid: {
        show: true,
        borderColor: 'rgba(255, 255, 255, 0.02)',
        strokeDashArray: 2,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20
        }
    },
    xaxis: {
        type: 'datetime',
        labels: {
            style: {
                colors: '#4A5568',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600
            },
            offsetY: 0
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: {
        labels: {
            style: {
                colors: '#4A5568',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600
            },
            formatter: (val: number) => val.toLocaleString()
        },
        opposite: true
    },
    tooltip: {
        enabled: true,
        theme: 'dark',
        x: { format: 'HH:mm dd MMM' },
        style: {
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif'
        },
        custom: function({ seriesIndex, dataPointIndex, w }: any) {
            const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
            const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
            const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
            const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
            return `
                <div class="px-4 py-3 bg-[#0B0E11]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
                    <div class="flex items-center gap-3 mb-2 border-b border-white/5 pb-2">
                        <div class="w-2 h-2 rounded-full ${c >= o ? 'bg-zen-green' : 'bg-zen-red'}"></div>
                        <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">${w.globals.labels[dataPointIndex]}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-1">
                        <div class="text-[10px] font-bold text-neutral-500 uppercase">Open</div>
                        <div class="text-[10px] font-mono font-bold text-white text-right">${o.toLocaleString()}</div>
                        <div class="text-[10px] font-bold text-neutral-500 uppercase">High</div>
                        <div class="text-[10px] font-mono font-bold text-zen-green text-right">${h.toLocaleString()}</div>
                        <div class="text-[10px] font-bold text-neutral-500 uppercase">Low</div>
                        <div class="text-[10px] font-mono font-bold text-zen-red text-right">${l.toLocaleString()}</div>
                        <div class="text-[10px] font-bold text-neutral-500 uppercase">Close</div>
                        <div class="text-[10px] font-mono font-bold text-white text-right">${c.toLocaleString()}</div>
                    </div>
                </div>
            `
        }
    }
}));

onMounted(() => {
    fetchHistory();
});

watch([() => props.symbol, () => props.interval], () => {
    fetchHistory();
});

const retryConnection = () => {
    fetchHistory();
};
</script>

<template>
    <div class="w-full h-full relative bg-[#0B0E11] flex flex-col overflow-hidden group select-none">
        
        <!-- Premium Bloomberg Header -->
        <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pointer-events-none">
            <div class="flex items-center gap-3">
                <div class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 shadow-2xl">
                        <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
                        <span class="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none">Apex Nexus v2.0</span>
                    </div>
                    <div class="px-2 py-1 bg-white/[0.02] border border-white/5 rounded-md text-[8px] font-black text-neutral-600 self-start uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 class="w-2.5 h-2.5" />
                        AOS Feed: {{ props.symbol }} - {{ props.interval }}
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                <button 
                    @click="retryConnection" 
                    class="p-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg text-neutral-500 hover:text-bloomberg-amber hover:border-bloomberg-amber/20 transition-all"
                    title="Refresh Nexus"
                >
                    <RefreshCw class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" />
                </button>
            </div>
        </div>

        <!-- Apex Chart Container -->
        <div class="flex-grow w-full h-full relative">
            <div v-if="!isLoading && chartData.length > 0" class="w-full h-full p-2 pt-16">
                <apexchart
                    type="candlestick"
                    width="100%"
                    height="100%"
                    :options="chartOptions"
                    :series="series"
                />
            </div>

            <!-- Enhanced Loading State -->
            <div v-if="isLoading" class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0B0E11]">
                <div class="relative w-20 h-20">
                    <div class="absolute inset-0 border-2 border-bloomberg-amber/5 rounded-full scale-125 opacity-20 animate-ping"></div>
                    <div class="absolute inset-0 border-t-2 border-bloomberg-amber rounded-full animate-spin"></div>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <Zap class="w-8 h-8 text-bloomberg-amber animate-pulse" />
                    </div>
                </div>
                <div class="mt-8 text-center">
                    <p class="text-[11px] font-black text-bloomberg-amber uppercase tracking-[0.5em] animate-pulse">Establishing Nexus Uplink</p>
                    <div class="mt-3 flex items-center justify-center gap-1.5">
                        <div v-for="i in 3" :key="i" class="w-1 h-1 rounded-full bg-white/10 animate-bounce" :style="{ animationDelay: `${i * 0.1}s` }"></div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Empty/Error State -->
            <div v-if="!isLoading && chartData.length === 0" 
                 class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0B0E11]/90 backdrop-blur-sm p-6 text-center">
                <div class="w-24 h-24 bg-red-500/5 rounded-full flex items-center justify-center border border-red-500/10 mb-6 shadow-2xl shadow-red-500/5">
                    <Activity class="w-10 h-10 text-red-500/20" />
                </div>
                <div class="space-y-4 max-w-xs">
                    <h3 class="text-red-500 font-black text-sm uppercase tracking-[0.4em]">Nexus Disconnected</h3>
                    <p class="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        Data nodes at <span class="text-white">COORDINATE: {{ props.symbol }}</span> are currently unresponsive. All fallback uplinks exhausted.
                    </p>
                    <button 
                        @click="retryConnection" 
                        class="w-full mt-6 bg-bloomberg-amber text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.05] active:scale-[0.95] shadow-xl shadow-bloomberg-amber/20"
                    >
                        Repair Nexus Uplink
                    </button>
                </div>
            </div>
        </div>

        <!-- Footer Stats -->
        <div class="absolute bottom-4 left-4 z-20 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
            <div class="flex items-center gap-4 text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                <div class="flex items-center gap-1.5">
                    <div class="w-1 h-1 rounded-full bg-zen-green"></div>
                    Latency: Verified
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="w-1 h-1 rounded-full bg-blue-500"></div>
                    Feed: AOS Global
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="w-1 h-1 rounded-full bg-white/20"></div>
                    Engine: Apex V2
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.apexcharts-canvas) {
    user-select: none !important;
}

:deep(.apexcharts-tooltip) {
    background: rgba(11, 14, 17, 0.9) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
}

:deep(.apexcharts-xaxis-label), :deep(.apexcharts-yaxis-label) {
    font-weight: 800 !important;
    letter-spacing: 0.05em !important;
}

:deep(.apexcharts-gridline) {
    stroke-width: 0.5px !important;
}

:deep(.apexcharts-candlestick-area) {
    stroke-width: 1px !important;
}
</style>
