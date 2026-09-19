# D68 playback investigation and synthetic fixture correction

Scope: ordinary authorized proctor playback of the final QA exam 143, candidate `44799c41-8cfd-4ab8-a90b-13632121949a`, attempt 368. The result remains 47/50. No new candidate attempt, physical capture, or security testing is involved.

## Synthetic fixture issue (not a product codec/storage defect)

The original single 8-second 320×240 VP8/Opus clip was generated locally from a test pattern and tone. Upload/finalize/read checks succeeded, but those checks did not establish MediaSource playback compatibility. The real browser rejected the first chunk with `CHUNK_DEMUXER_ERROR_APPEND_FAILED: Got a block with a timecode before the previous block.`

The authenticated backend and frontend chunk proxy each returned all 230170 original bytes with SHA-256 `18280e28f169ab5e542b4dd8cc1e743f3cae918cd571c7c0f126db68c3485961`. The proxy diagnostic passed 4/4 checks (`harness/d68-video-proxy.json`). Delivery did not corrupt the clip.

A local EBML block-order inspection found 39 timestamp reversals among 521 blocks across 9 clusters. For example, an audio block timestamped 201 ms preceded a video block timestamped 200 ms. A lossless remux with `-c copy -bsf:v setts=dts=DTS-7` reordered the physical blocks: the corrected file has 521 blocks and no timestamp reversals. Its encoded streams remain VP8 and Opus; FFprobe reports 8.028 seconds. See `harness/d68-remux.json` for the actual arguments and before/after block evidence.

The initial harness checked FFmpeg's zero exit status and called that a successful local decode. FFmpeg also emitted an Opus packet-header diagnostic with a zero exit status for both versions; that assertion must not be read as clean audio acceptance. Real-browser playback is separate evidence, and no physical microphone capture is claimed.

## Preserved evidence and corrected version

Only the recognized own QA `chunk_000000.webm` in attempt 368 was replaced, after checking the exact original hash and candidate ownership. The old source and downloaded source files remain in `harness/phase12-video-assets/`. The original stored chunk, manifests and JSON evidence were also copied to `harness/phase12-video-assets/before-d68-remux/` before replacement. Historical `harness/phase12-video-manifest.json` remains unchanged.

The corrected local file is `harness/phase12-video-assets/synthetic-vp8-opus-attempt-368-video-dts-minus7ms.webm`; its downloaded stored counterpart ends in `-ordered.webm`. Both have 230169 bytes and SHA-256 `1b4a27e475a7356f5f218237893709542543d137574c5a3b4ff0b480580f12d1`. One intentional finalize call created successor evidence 703. The API still reports exactly one VP8/Opus chunk. Replacement checks passed 7/7 in `harness/d68-replace-fixture.json`; corrected state is `harness/d68-replacement-manifest.json`.

Evidence 702 is historical metadata for the original version; its shared chunk path now addresses the explicitly replaced QA bytes. The archived original is the source for reproducing its failure. Re-running the original phase12 verification against its original hash would correctly fail after this deliberate version change; use the replacement manifest to verify the current version.

## Player event handling

Source inspection found that the `VideoChunkPlayer` event-listener effect uses an empty dependency array and runs while the initial loading branch renders no video element. It returns before attaching time/play/pause/ended/duration handlers. This is a separate product defect from the synthetic mux issue.

**Real-browser before reproduction:** after the corrected clip rendered, the root agent clicked play. The video DOM reached `ended=true`, `paused=true`, `currentTime=duration=8.021`, `readyState=4`, with no media error. The animated test pattern rendered, but the visible timer stayed `0:00 / 0:08` and the seek slider stayed at zero. This confirms browser decoding and the stale player UI under the original event effect.

The minimal production fix in `components/ui/video-chunk-player.tsx` attaches time/play/pause/end/duration handlers directly to the rendered video element, so they also attach after loading and retry. The play button exposes its changing Play/Pause label. Concise first-failure messages distinguish load/read/append/decode failures; structured console diagnostics retain the technical detail. The temporary 50 ms diagnostic delay was removed. No codec, API, capture or buffering algorithm was changed.

TypeScript typecheck, targeted ESLint and targeted diff check pass.

**Real-browser after verification:** Play changed to Pause; at the end the video DOM and visible UI both reached 8 seconds (`currentTime=duration=8.021`, UI `0:08`). Replay followed by pause stopped at 0.165 seconds. Three ArrowRight presses on the seek slider moved to 1.5 seconds and UI `0:01`. Forward 10 seconds clamped to the real end (8.021 seconds, UI `0:08`); Back 10 seconds clamped to zero; playback resumed. The root agent owns the browser screenshots and playback evidence. This verifies actual rendered video and controls for a synthetic clip, not physical camera/microphone capture or a claim of audible tone verification.

## Limits of this media check

This is one short synthetic VP8/Opus chunk. Long recordings, continuity across multiple chunks, other codecs, audible quality, audio/video synchronization, capture final-flush behavior and deployment storage behavior remain unverified. Recording metadata `duration=1480` is elapsed attempt-to-finalization time in seconds, not the synthetic media duration. The browser's actual decoded media duration is 8.021 seconds; FFprobe's container duration is 8.028 seconds. Neither value validates the elapsed-time metadata as media duration.
