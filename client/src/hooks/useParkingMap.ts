import { useState } from "react";

export function useParkingMap() {
  const [zoom, setZoom] = useState(1);

  return {
    zoom,
    zoomIn: () => setZoom((value) => Math.min(1.4, value + 0.1)),
    zoomOut: () => setZoom((value) => Math.max(0.8, value - 0.1)),
    resetZoom: () => setZoom(1),
  };
}
