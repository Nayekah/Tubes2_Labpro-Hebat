"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import Navbar from "../components/navbar.jsx";

// Dynamically import KonvaCanvas to avoid SSR issues with window
const KonvaCanvas = dynamic(() => import("./components/canvas.js"), {
  ssr: false,
});

export default function Home() {
  const stageRef = useRef(null);

  const handleZoomIn = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const newScale = oldScale * 1.2;

      // Get pointer position
      const mousePointTo = {
        x: stage.width() / 2 / oldScale - stage.x() / oldScale,
        y: stage.height() / 2 / oldScale - stage.y() / oldScale,
      };

      // Calculate new position
      const newPos = {
        x: -(mousePointTo.x - stage.width() / 2 / newScale) * newScale,
        y: -(mousePointTo.y - stage.height() / 2 / newScale) * newScale,
      };

      // Apply zoom
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    }
  };

  const handleZoomOut = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const newScale = oldScale / 1.2;

      // Get pointer position
      const mousePointTo = {
        x: stage.width() / 2 / oldScale - stage.x() / oldScale,
        y: stage.height() / 2 / oldScale - stage.y() / oldScale,
      };

      const newPos = {
        x: -(mousePointTo.x - stage.width() / 2 / newScale) * newScale,
        y: -(mousePointTo.y - stage.height() / 2 / newScale) * newScale,
      };

      // Apply zoom
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    }
  };

  const handleReset = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      stage.position({ x: 0, y: 0 });
      stage.scale({ x: 1, y: 1 });
      stage.batchDraw();
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <KonvaCanvas stageRef={stageRef} />
    </div>
  );
}
