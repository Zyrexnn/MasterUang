<script setup lang="ts">
import { onMounted, ref } from 'vue';

const iframeContainer = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (!iframeContainer.value) return;

  // Configuration for Global Real-Time Tracking
  const config = `
    var width="100%";
    var height="100%";
    var latitude="10.00";      // Centered more towards global view
    var longitude="100.00";    // Centered towards Asia/Global
    var zoom="3";
    var names=true;            // Show ship names for better visibility
    var show_track=false;
    // Removed fleet and specific ship filters to show ALL global traffic
    var mmsi=""; 
    var imo="";
    var fleet="";
  `;

  // Create an iframe to sandbox the document.write script
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  iframeContainer.value.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.open();
    // Using a more robust config and adding a darkening layer to the inner body
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html { 
              margin: 0; 
              padding: 0; 
              width: 100%; 
              height: 100%; 
              overflow: hidden; 
              background: #0B0E11; 
            }
            /* Map and Marker Styling */
            iframe { 
              width: 100% !important; 
              height: 100% !important; 
              border: none !important;
              /* Balanced Midnight Filter: dark, readable, non-inverted icons */
              filter: invert(0.9) hue-rotate(180deg) brightness(0.9) contrast(1.1) saturate(1.1);
              background: #0B0E11 !important;
            }
          </style>
        </head>
        <body>
          <script type="text/javascript">${config}<\/script>
          <script type="text/javascript" src="https://www.vesselfinder.com/aismap.js"><\/script>
        </body>
      </html>
    `);
    iframeDoc.close();
  }
});
</script>

<template>
  <div class="w-full h-full bg-[#0B0E11] relative overflow-hidden">
    <!-- Main Iframe Container -->
    <div 
      ref="iframeContainer" 
      class="w-full h-full absolute inset-0 -top-[35px] scale-[1.01]" 
      style="height: calc(100% + 35px)"
    ></div>
    
    <!-- Shadow Gradient Overlays for Depth -->
    <div class="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10 transition-opacity"></div>
    <div class="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-[#0B0E11] to-transparent z-10"></div>
    <div class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0B0E11] to-transparent z-10"></div>
  </div>
</template>

<style scoped>
.vesselfinder-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
