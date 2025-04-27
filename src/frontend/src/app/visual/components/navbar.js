import React from "react";

const Navbar = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <nav className="navbar">
      <h1>Konva Canvas Explorer</h1>
      <div className="controls">
        <button className="btn" onClick={onZoomIn}>
          Zoom In
        </button>
        <button className="btn" onClick={onZoomOut}>
          Zoom Out
        </button>
        <button className="btn" onClick={onReset}>
          Reset
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
