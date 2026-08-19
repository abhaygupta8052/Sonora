import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to create a valid uncompressed PNG file of width x height with solid/gradient color
function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 70, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(2, 9); // Truecolor (RGB)
  ihdrData.writeUInt8(0, 10); // Deflate
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Gradient effect
      const grad = Math.floor((y / height) * 40);
      rawData[pixelOffset] = Math.min(255, r + grad);
      rawData[pixelOffset + 1] = Math.max(0, g - grad);
      rawData[pixelOffset + 2] = Math.min(255, b + grad * 2);
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = chunk.subarray(4, 8 + len);
  const crcVal = crc32(crcTarget);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Brand Violet RGB (124, 58, 237)
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, 192, 124, 58, 237));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, 512, 124, 58, 237));
console.log('PNG Icons successfully written!');
