// Local-only inspection/remux of the synthetic QA clip; originals are preserved.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { here } from './client.mjs';
const ffmpeg = 'C:/Users/abdal/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const dir = path.join(here, 'phase12-video-assets');
const source = path.join(dir, 'synthetic-vp8-opus-attempt-368.webm');
function vint(data, offset, id = false) {
  let length = 1, mask = 0x80;
  while (length <= 8 && !(data[offset] & mask)) { length++; mask >>= 1; }
  if (length > 8) throw Error(`Invalid EBML VINT at ${offset}`);
  let value = id ? data[offset] : data[offset] & (mask - 1);
  for (let i = 1; i < length; i++) value = value * 256 + data[offset + i];
  return { value, length };
}
function elements(data, start, end) {
  const result = [];
  for (let offset = start; offset < end;) {
    const id = vint(data, offset, true), size = vint(data, offset + id.length);
    const payload = offset + id.length + size.length, stop = Math.min(end, payload + size.value);
    result.push({ id: id.value, offset, payload, stop }); offset = stop;
  }
  return result;
}
function uint(data, node) { let value = 0; for (let i = node.payload; i < node.stop; i++) value = value * 256 + data[i]; return value; }
export function inspect(file) {
  const data = fs.readFileSync(file), top = elements(data, 0, data.length);
  const segment = top.find(x => x.id === 0x18538067);
  if (!segment) throw Error('No WebM Segment');
  const clusters = elements(data, segment.payload, segment.stop).filter(x => x.id === 0x1f43b675);
  const backwards = [], blocks = [];
  for (const cluster of clusters) {
    const children = elements(data, cluster.payload, cluster.stop);
    const base = uint(data, children.find(x => x.id === 0xe7));
    let previous = null;
    for (let block of children) {
      if (block.id === 0xa0) block = elements(data, block.payload, block.stop).find(x => x.id === 0xa1);
      if (!block || (block.id !== 0xa3 && block.id !== 0xa1)) continue;
      const track = vint(data, block.payload);
      const timestamp = base + data.readInt16BE(block.payload + track.length);
      const value = { track: track.value, timestampMs: timestamp, offset: block.offset, cluster: cluster.offset };
      if (previous && timestamp < previous.timestampMs) backwards.push({ previous, current: value });
      blocks.push(value); previous = value;
    }
  }
  return { file: path.basename(file), bytes: data.length, clusters: clusters.length, blocks: blocks.length,
    backwardsCount: backwards.length, firstBackwards: backwards.slice(0, 5), firstBlocks: blocks.slice(0, 18) };
}
const report = { classification: 'Synthetic mux diagnostic only; no HTTP or browser execution', original: inspect(source), variants: [] };
for (const [name, extra] of [
  ['audio-preload-minus7ms', ['-audio_preload', '-7000']],
  ['video-dts-minus7ms', ['-bsf:v', 'setts=dts=DTS-7']],
]) {
  const file = path.join(dir, `synthetic-vp8-opus-attempt-368-${name}.webm`);
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-i', source, '-map', '0:v:0', '-map', '0:a:0', '-c', 'copy', ...extra,
    '-cluster_time_limit', '1000', '-f', 'webm', file];
  const result = fs.existsSync(file) ? { status: 0 } : spawnSync(ffmpeg, args, { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  report.variants.push(result.status === 0 ? { name, args, ...inspect(file) } : { name, status: result.status, error: result.stderr });
}
fs.writeFileSync(path.join(here, 'd68-remux.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
