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
              /* High contrast filter to make green markers pop against dark base */
              filter: invert(0.9) hue-rotate(170deg) brightness(0.9) contrast(1.4) saturate(1.8);
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
  <div class="vesselfinder-wrapper w-full h-full bg-[#0B0E11] relative overflow-hidden">
    <!-- Container with negative margin top to hide the VesselFinder.com breadcrumb/header -->
    <div ref="iframeContainer" class="w-full h-full absolute inset-0 -top-[30px]" style="height: calc(100% + 30px)"></div>
    
    <!-- Branding Overlay for Bloomberg Aesthetic -->
    <div class="absolute top-4 left-4 z-50 pointer-events-none">
       <div class="px-3 py-1 bg-bloomberg-amber text-black text-[9px] font-black uppercase tracking-widest rounded shadow-lg flex items-center gap-2">
         <div class="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></div>
         Uplink Active: Sovereign Marine Stream
       </div>
    </div>
  </div>
</template>

<style scoped>
.vesselfinder-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
