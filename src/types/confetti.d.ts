declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    gravity?: number;
    scalar?: number;
  }

  function confetti(options?: ConfettiOptions): void;
  export default confetti;
}
