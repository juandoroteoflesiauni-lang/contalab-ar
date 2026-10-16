import React, { memo } from 'react';

/**
 * Fondo ambiental monocromo.
 * - Puramente decorativo (aria-hidden, sin eventos de puntero).
 * - Sin estado ni efectos: se renderiza una sola vez (memo) y toda la
 *   animación ocurre en CSS sobre transform/opacity (compositor de GPU).
 * - Respeta prefers-reduced-motion desde index.css.
 */
export const AmbientBackground: React.FC = memo(() => (
  <div className="ambient" aria-hidden="true">
    <div className="ambient__glow ambient__glow--a" />
    <div className="ambient__glow ambient__glow--b" />
    <div className="ambient__glow ambient__glow--c" />
    <div className="ambient__grid" />
    <div className="ambient__beam" />
    <div className="ambient__noise" />
    <div className="ambient__vignette" />
  </div>
));

AmbientBackground.displayName = 'AmbientBackground';
