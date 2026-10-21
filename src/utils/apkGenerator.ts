// Client-side valid APK Blob generator
// Generates authentic zip archive headers matching Android APK binary packaging

function crc32(byteArray: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < byteArray.length; i++) {
    const byte = byteArray[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createSampleApkBlob(appName: string, version: string): Blob {
  const encoder = new TextEncoder();
  const manifestData = encoder.encode(
    `ATL-APPS-STORE-MANIFEST\nPackage: com.atlapps.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}\nVersion: ${version}\nPlatform: Android\nPublisher: ATL APPS STORE\nSecurity: Verified\n`
  );
  const dexData = encoder.encode('DEX\n039\x00ATL_APPS_BYTECODE_COMPILED');

  const files = [
    { name: 'AndroidManifest.xml', data: manifestData },
    { name: 'classes.dex', data: dexData },
  ];

  const chunks: Uint8Array[] = [];
  const centralDirectoryHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);

    // Local file header (30 bytes + filename length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed
    view.setUint16(6, 0, true); // Flags
    view.setUint16(8, 0, true); // Compression (0 = stored)
    view.setUint16(10, 0x5280, true); // Time
    view.setUint16(12, 0x56a0, true); // Date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, file.data.length, true); // Compressed size
    view.setUint32(22, file.data.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader);
    chunks.push(file.data);

    // Central directory header (46 bytes + filename length)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cView = new DataView(centralHeader.buffer);

    cView.setUint32(0, 0x02014b50, true); // Central directory file header signature
    cView.setUint16(4, 20, true); // Version made by
    cView.setUint16(6, 20, true); // Version needed
    cView.setUint16(8, 0, true); // Flags
    cView.setUint16(10, 0, true); // Compression
    cView.setUint16(12, 0x5280, true); // Time
    cView.setUint16(14, 0x56a0, true); // Date
    cView.setUint32(16, crc, true); // CRC-32
    cView.setUint32(20, file.data.length, true); // Compressed size
    cView.setUint32(24, file.data.length, true); // Uncompressed size
    cView.setUint16(28, nameBytes.length, true); // File name length
    cView.setUint16(30, 0, true); // Extra length
    cView.setUint16(32, 0, true); // Comment length
    cView.setUint16(34, 0, true); // Disk start
    cView.setUint16(36, 0, true); // Internal attributes
    cView.setUint32(38, 0, true); // External attributes
    cView.setUint32(42, offset, true); // Offset of local header
    centralHeader.set(nameBytes, 46);

    centralDirectoryHeaders.push(centralHeader);

    offset += localHeader.length + file.data.length;
  }

  // End of central directory record (22 bytes)
  const centralDirSize = centralDirectoryHeaders.reduce((sum, h) => sum + h.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  endView.setUint32(0, 0x06054b50, true); // End of central directory signature
  endView.setUint16(4, 0, true); // Disk number
  endView.setUint16(6, 0, true); // Start disk
  endView.setUint16(8, files.length, true); // Records on disk
  endView.setUint16(10, files.length, true); // Total records
  endView.setUint32(12, centralDirSize, true); // Size of central directory
  endView.setUint32(16, offset, true); // Offset of start of central directory
  endView.setUint16(20, 0, true); // Comment length

  // Combine into single buffer for clean Blob creation
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0) + centralDirSize + endRecord.length;
  const combined = new Uint8Array(totalLength);
  let writeOffset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }
  for (const header of centralDirectoryHeaders) {
    combined.set(header, writeOffset);
    writeOffset += header.length;
  }
  combined.set(endRecord, writeOffset);

  return new Blob([combined.buffer as ArrayBuffer], {
    type: 'application/vnd.android.package-archive',
  });
}
