/** Three short beeps (made in the browser, no sound file). Silent if the browser does not allow sound yet. */
export function playBeep(): void {
  try {
    const context = new AudioContext();
    const tone = (offset: number): void => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      oscillator.connect(gain);
      gain.connect(context.destination);
      const start = context.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    };
    tone(0);
    tone(0.35);
    tone(0.7);
    setTimeout(() => void context.close(), 1500);
  } catch {
    // No audio available: the visual message is enough
  }
}
