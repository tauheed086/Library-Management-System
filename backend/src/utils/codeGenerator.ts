// Simple SVG generator for Barcodes and QR Codes to avoid complex native packages
// and ensure absolute portability and clean visual output.

export const generateBarcodeSVG = (text: string): string => {
  // Simple Mock Code 39 / Code 128 vertical bar representation in SVG
  const width = 300;
  const height = 80;
  let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svgContent += `<rect width="100%" height="100%" fill="#ffffff"/>`;
  
  // Render dummy bars based on characters in text hash
  const seed = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let x = 20;
  let index = 0;
  
  while (x < width - 20) {
    const isBar = (index + seed) % 3 !== 0;
    const barWidth = ((index * seed) % 3) + 1; // 1 to 3 px
    if (isBar) {
      svgContent += `<rect x="${x}" y="10" width="${barWidth}" height="45" fill="#000000"/>`;
    }
    x += barWidth + ((index % 2) ? 1 : 2);
    index++;
  }
  
  // Add Text below
  svgContent += `<text x="50%" y="70" font-family="'Inter', sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#111827">${text}</text>`;
  svgContent += `</svg>`;
  return svgContent;
};

export const generateQRCodeSVG = (text: string): string => {
  // Simple Mock QR Code pattern (nested squares and dots)
  const size = 150;
  let svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svgContent += `<rect width="100%" height="100%" fill="#ffffff"/>`;
  
  // Position detection patterns (large squares)
  const renderSquare = (x: number, y: number) => {
    svgContent += `<rect x="${x}" y="${y}" width="30" height="30" fill="#000000"/>`;
    svgContent += `<rect x="${x + 5}" y="${y + 5}" width="20" height="20" fill="#ffffff"/>`;
    svgContent += `<rect x="${x + 10}" y="${y + 10}" width="10" height="10" fill="#000000"/>`;
  };
  
  renderSquare(10, 10);
  renderSquare(size - 40, 10);
  renderSquare(10, size - 40);
  
  // Small center pattern
  svgContent += `<rect x="${size - 40}" y="${size - 40}" width="15" height="15" fill="#000000"/>`;
  svgContent += `<rect x="${size - 35}" y="${size - 35}" width="5" height="5" fill="#ffffff"/>`;
  
  // Fill random blocks to simulate QR pattern
  const seed = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const padding = 10;
  const cellSize = 5;
  const gridCount = (size - padding * 2) / cellSize; // 26 cols
  
  for (let r = 0; r < gridCount; r++) {
    for (let c = 0; c < gridCount; c++) {
      // Skip the corner zones (position detection patterns)
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridCount - 8;
      const inBottomLeft = r >= gridCount - 8 && c < 8;
      const inBottomRight = r >= gridCount - 8 && c >= gridCount - 8;
      
      if (!inTopLeft && !inTopRight && !inBottomLeft && !inBottomRight) {
        const val = ((r * c * seed) + (r * 17) + (c * 23)) % 5;
        if (val === 0 || val === 2) {
          svgContent += `<rect x="${padding + c * cellSize}" y="${padding + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
        }
      }
    }
  }
  
  svgContent += `</svg>`;
  return svgContent;
};
