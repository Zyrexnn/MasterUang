<script setup lang="ts">
import { onMounted, watch, ref, onUnmounted } from 'vue';

const props = defineProps<{
  symbol: string;
  interval: string;
  advanced?: boolean;
}>();

const widgetId = 'tradingview_widget_binance';
const container = ref<HTMLElement | null>(null);

const mapInterval = (interval: string) => {
  const map: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W'
  };
  return map[interval] || '60';
};

const initWidget = () => {
  if (!container.value) return;

  const existingContainer = document.getElementById(widgetId);
  if (existingContainer) {
    existingContainer.innerHTML = '';
  }

  if ((window as any).TradingView) {
    createWidget();
  } else {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = createWidget;
    document.head.appendChild(script);
  }
};

const createWidget = () => {
  if (typeof (window as any).TradingView !== 'undefined' && container.value) {
    new (window as any).TradingView.widget({
      "autosize": true,
      "symbol": "BINANCE:" + props.symbol,
      "interval": mapInterval(props.interval),
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#0B0E11",
      "enable_publishing": false,
      "hide_top_toolbar": !props.advanced,
      "hide_legend": false,
      "save_image": false,
      "container_id": widgetId,
      "backgroundColor": "#0B0E11",
      "gridColor": "rgba(42, 46, 57, 0.03)",
      "withdateranges": props.advanced,
      "hide_side_toolbar": !props.advanced,
      "details": false,
      "hotlist": false,
      "calendar": false,
      "show_popup_button": true,
      "allow_symbol_change": true,
      "disabled_features": props.advanced ? [
        "use_localstorage_for_settings"
      ] : [
        "use_localstorage_for_settings",
        "header_symbol_search",
        "symbol_info",
        "header_interval_dialog_button",
        "header_chart_type",
        "header_settings",
        "header_indicators",
        "header_compare",
        "header_undo_redo",
        "header_screenshot",
        "header_fullscreen_button"
      ],
      "enabled_features": props.advanced ? [
        "study_templates",
        "header_indicators",
        "header_settings"
      ] : [
        "hide_left_toolbar_by_default"
      ],
      "overrides": {
        "mainSeriesProperties.candleStyle.upColor": "#0ECB81",
        "mainSeriesProperties.candleStyle.downColor": "#F6465D",
        "mainSeriesProperties.candleStyle.drawWick": true,
        "mainSeriesProperties.candleStyle.drawBorder": true,
        "mainSeriesProperties.candleStyle.borderColor": "#485c7b",
        "mainSeriesProperties.candleStyle.borderUpColor": "#0ECB81",
        "mainSeriesProperties.candleStyle.borderDownColor": "#F6465D",
        "mainSeriesProperties.candleStyle.wickUpColor": "#0ECB81",
        "mainSeriesProperties.candleStyle.wickDownColor": "#F6465D",
        "paneProperties.background": "#0B0E11",
        "paneProperties.vertGridProperties.color": "rgba(42, 46, 57, 0.03)",
        "paneProperties.horzGridProperties.color": "rgba(42, 46, 57, 0.03)",
        "scalesProperties.textColor": "#616873"
      }
    });
  }
};

onMounted(() => {
  initWidget();
});

watch([() => props.symbol, () => props.interval, () => props.advanced], () => {
  initWidget();
});

onUnmounted(() => {
  const existingContainer = document.getElementById(widgetId);
  if (existingContainer) existingContainer.innerHTML = '';
});
</script>

<template>
  <div class="w-full h-full bg-[#0B0E11] relative overflow-hidden" ref="container">
    <div :id="widgetId" class="w-full h-full border-none"></div>
  </div>
</template>

<style scoped>
:deep(iframe) {
    border: none !important;
    display: block !important;
}
</style>
