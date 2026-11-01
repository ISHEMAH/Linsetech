"use client";
import { Component, type ReactNode } from "react";

/**
 * Keeps the page up when a scene cannot get a WebGL context (the browser's per-page cap, a lost GPU): three.js throws
 * while creating its renderer, and without a boundary that took the whole page down. Renders `fallback` (default:
 * nothing — the section's own background shows) instead of the canvas.
 */
export default class CanvasBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
