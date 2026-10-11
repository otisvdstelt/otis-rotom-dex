/**
 * Where Rotom is looking, as -1..1 offsets from its own position on screen.
 * Plain mutable state shared between the canvas (which writes it from window
 * pointer events) and the model (which reads it every frame); it changes far
 * too often to live in React state.
 */
export const lookTarget = { x: 0, y: 0 }
