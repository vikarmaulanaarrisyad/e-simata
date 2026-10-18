const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const iconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG Standard Icon (1:1 with rounded corners)
const standardSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="120" y1="100" x2="392" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#ecfdf5"/>
    </linearGradient>
    <filter id="shadow" x="60" y="60" width="392" height="392" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#022c22" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Subtle circular glow -->
  <circle cx="256" cy="180" r="160" fill="#ffffff" fill-opacity="0.08"/>

  <!-- Shield Shape with Shadow -->
  <g filter="url(#shadow)">
    <!-- Shield Outline -->
    <path d="M256 80 C320 80 376 112 376 112 C376 256 256 360 256 360 C256 360 136 256 136 112 C136 112 192 80 256 80 Z" 
          fill="url(#shieldGrad)"/>
    
    <!-- Shield Inner Decorative Border -->
    <path d="M256 98 C308 98 356 124 356 124 C356 244 256 334 256 334 C256 334 156 244 156 124 C156 124 204 98 256 98 Z" 
          stroke="#10b981" stroke-width="4" stroke-opacity="0.3" fill="none"/>

    <!-- Cloud & Checkmark Icon inside Shield -->
    <!-- Cloud base -->
    <path d="M220 230 C208 230 198 220 198 208 C198 197 206 188 217 186 C221 168 237 154 256 154 C275 154 291 168 295 186 C306 188 314 197 314 208 C314 220 304 230 292 230 Z" 
          fill="#059669" fill-opacity="0.15"/>
    
    <!-- Bold Checkmark -->
    <path d="M210 216 L242 248 L302 184" 
          stroke="#059669" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Title Text -->
  <text x="256" y="420" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="46" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
    SIMATA
  </text>
  
  <!-- Subtitle Text -->
  <text x="256" y="456" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="19" font-weight="700" fill="#a7f3d0" text-anchor="middle" letter-spacing="1.5">
    MI BUSTANUL HUDA
  </text>
</svg>
`;

// Maskable Icon (safe zone requires content within center 80% circle, square background)
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradMask" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
    <linearGradient id="shieldGradMask" x1="140" y1="120" x2="372" y2="360" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#ecfdf5"/>
    </linearGradient>
  </defs>

  <!-- Full square background without rounded corners for maskable -->
  <rect width="512" height="512" fill="url(#bgGradMask)"/>
  
  <circle cx="256" cy="230" r="140" fill="#ffffff" fill-opacity="0.08"/>

  <!-- Centered Scaled Shield within Safe Zone -->
  <g transform="translate(40, 20) scale(0.84)">
    <path d="M256 80 C320 80 376 112 376 112 C376 256 256 360 256 360 C256 360 136 256 136 112 C136 112 192 80 256 80 Z" 
          fill="url(#shieldGradMask)"/>
    
    <path d="M256 98 C308 98 356 124 356 124 C356 244 256 334 256 334 C256 334 156 244 156 124 C156 124 204 98 256 98 Z" 
          stroke="#10b981" stroke-width="4" stroke-opacity="0.3" fill="none"/>

    <path d="M220 230 C208 230 198 220 198 208 C198 197 206 188 217 186 C221 168 237 154 256 154 C275 154 291 168 295 186 C306 188 314 197 314 208 C314 220 304 230 292 230 Z" 
          fill="#059669" fill-opacity="0.15"/>
    
    <path d="M210 216 L242 248 L302 184" 
          stroke="#059669" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Title Text within Safe Zone -->
  <text x="256" y="415" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
    SIMATA
  </text>
  
  <text x="256" y="450" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="18" font-weight="700" fill="#a7f3d0" text-anchor="middle" letter-spacing="1.5">
    MI BUSTANUL HUDA
  </text>
</svg>
`;

async function generate() {
  console.log("Generating PWA icons...");

  // 1. icon-512x512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512x512.png"));
  console.log("✓ icon-512x512.png");

  // 2. icon-192x192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192x192.png"));
  console.log("✓ icon-192x192.png");

  // 3. icon-maskable-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512x512.png"));
  console.log("✓ icon-maskable-512x512.png");

  // 4. icon-maskable-192x192.png
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-192x192.png"));
  console.log("✓ icon-maskable-192x192.png");

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png");

  // 6. favicon-32x32.png
  await sharp(Buffer.from(standardSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, "favicon-32x32.png"));
  console.log("✓ favicon-32x32.png");

  console.log("All PWA icons generated successfully!");
}

generate().catch(err => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
