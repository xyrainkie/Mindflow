export const buildAlarmWav = (): Buffer => {
  const sampleRate = 44100;
  const durationBeep = 0.5;
  const durationSilence = 0.2;
  const repeats = 3;
  const freq = 1000;
  const totalSamples = Math.floor(repeats * (durationBeep + durationSilence) * sampleRate);
  const data = new Int16Array(totalSamples);
  let t = 0;
  for (let r = 0; r < repeats; r++) {
    const beepSamples = Math.floor(durationBeep * sampleRate);
    const silenceSamples = Math.floor(durationSilence * sampleRate);
    for (let i = 0; i < beepSamples; i++) {
      const s = Math.sin(2 * Math.PI * freq * (i / sampleRate));
      data[t++] = Math.max(-1, Math.min(1, s)) * 32767;
    }
    for (let i = 0; i < silenceSamples; i++) {
      data[t++] = 0;
    }
  }
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const subchunk2Size = data.length * 2;
  const chunkSize = 36 + subchunk2Size;
  const buffer = Buffer.alloc(44 + subchunk2Size);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(subchunk2Size, 40);
  for (let i = 0; i < data.length; i++) {
    const val = Number(data[i] ?? 0);
    buffer.writeInt16LE(val, 44 + i * 2);
  }
  return buffer;
};
