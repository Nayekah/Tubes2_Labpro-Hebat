import React, { useState, useEffect, useRef, useMemo, useCallback, useTransition } from "react";
import { Stage, Layer, Image as KonvaImage, Text, Line, Rect, Group } from "react-konva";

export default function KonvaCanvas() {
  const stageRef = useRef(null);
  const insetStageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetElement, setTargetElement] = useState("");
  const [error, setError] = useState(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const imageMapRef = useRef(new Map());
  const [imageIds, setImageIds] = useState([]);
  const [isPending, startTransition] = useTransition();
  const contentBoundsRef = useRef({ minX: -2000, minY: -2000, maxX: 2000, maxY: 2000, width: 4000, height: 4000 });
  const insetWidth = 180;
  const insetHeight = 120;

  const [hovered, setHovered] = useState(false);

  const CanvasImage = ({ img, x, y }) => {
    const imageRef = useRef();

    useEffect(() => {
      const node = imageRef.current;
      const layer = node?.getLayer?.();
      if (layer && typeof layer.batchDraw === "function") {
        requestAnimationFrame(() => layer.batchDraw());
      }
    }, [img.image]);

    return (
      <Group x={x} y={y} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {/* Background */}
        <Rect width={60} height={60} fill="#ddd" cornerRadius={8} />

        {/* Image */}
        <KonvaImage x={5} y={5} width={50} height={50} ref={imageRef} image={img.image} />

        {/* Border */}
        <Rect width={60} height={60} stroke="black" strokeWidth={1} cornerRadius={8} />

        {/* Text */}
        {hovered && <Text text={img.image_name || "???"} fontSize={13} fill="black" x={0} y={-20} width={60} align="center" />}
      </Group>
    );
  };

  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      return `${protocol}//${hostname}:8080`;
    }

    return "http://localhost:8080";
  };

  const fetchImages = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLines([]);
    imageMapRef.current.clear();
    setImageIds([]);

    const apiUrl = getApiUrl();
    console.log("Using API URL:", apiUrl);

    try {
      const res = await fetch(`${apiUrl}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Target: targetElement }),
      });

      const data = await res.json();
      const images_data = data.images;
      const line_data = data.lines;
      setLines(line_data);

      const batch = [];
      for (const imgData of images_data) {
        const img = new window.Image();
        img.src = imgData.image_link;
        await new Promise((resolve) => {
          img.onload = () => {
            imageMapRef.current.set(imgData.image_id, { ...imgData, image: img });
            batch.push(imgData.image_id);
            resolve();
          };
          img.onerror = resolve;
        });
        if (batch.length) {
          const ids = [...batch];
          batch.length = 0;
          startTransition(() => {
            setImageIds((prev) => [...prev, ...ids]);
          });
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      if (batch.length) {
        startTransition(() => {
          setImageIds((prev) => [...prev, ...batch]);
        });
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const visibleImages = useMemo(() => {
    const visible = [];
    for (const id of imageIds) {
      const img = imageMapRef.current.get(id);
      const x = stageSize.width / 2 - 100 + img.image_pos_col;
      const y = stageSize.height / 2 + img.image_pos_row;
      if (
        x + 60 > -stagePos.x &&
        x < -stagePos.x + stageSize.width &&
        y + 60 > -stagePos.y &&
        y < -stagePos.y + stageSize.height
      ) {
        visible.push({ ...img, x, y });
      }
    }
    return visible;
  }, [imageIds, stagePos, stageSize]);

  const visibleLines = useMemo(() => {
    const loadedSet = new Set(imageIds);
    return lines.filter((line) => loadedSet.has(line.from_id) && loadedSet.has(line.to_id));
  }, [lines, imageIds]);

  const handleInsetClick = (e) => {
    const insetStage = e.target.getStage();
    if (!insetStage || !stageRef.current) return;

    const pointerPosition = insetStage.getPointerPosition();
    if (!pointerPosition) return;

    // Calculate center point in the content coordinates
    const bounds = contentBoundsRef.current;
    const scaleX = insetWidth / bounds.width;
    const scaleY = insetHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.75;

    // Calculate content-relative position
    const contentX = pointerPosition.x / scale + bounds.minX;
    const contentY = pointerPosition.y / scale + bounds.minY;

    // Center the main view on this point
    const mainStage = stageRef.current;
    const newX = -(contentX - stageSize.width / 2);
    const newY = -(contentY - stageSize.height / 2);

    // Animate to the new position
    mainStage.to({
      x: newX,
      y: newY,
      duration: 0.3,
    });

    // Update state
    setStagePos({ x: newX, y: newY });
  };

  useEffect(() => {
    const updateSize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-24 left-4 z-10 bg-white p-2 rounded shadow-md">
        <form onSubmit={fetchImages} className="flex gap-2">
          <input
            type="text"
            value={targetElement}
            onChange={(e) => setTargetElement(e.target.value)}
            placeholder="Target element"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded text-sm" disabled={loading}>
            {loading ? "Loading..." : "Fetch"}
          </button>
        </form>
      </div>

      {/* Map */}
      <div className="absolute top-28 right-4 z-10">
        <div className="bg-white p-1 rounded shadow-md border border-gray-200">
          <Stage
            width={insetWidth}
            height={insetHeight}
            onClick={handleInsetClick}
            ref={insetStageRef}
            style={{ cursor: "pointer" }}>
            <Layer>
              <Rect x={0} y={0} width={insetWidth} height={insetHeight} fill="#f0f0f0" />

              {(() => {
                const bounds = contentBoundsRef.current;

                const elements = [];
                // Calculate position in inset
                const scaleX = insetWidth / bounds.width;
                const scaleY = insetHeight / bounds.height;
                const scale = Math.min(scaleX, scaleY) * 0.75;

                // Draw a simplified representation of the viewport
                const viewX = (-stagePos.x - bounds.minX) * scale;
                const viewY = (-stagePos.y - bounds.minY) * scale;
                const viewWidth = stageSize.width * scale;
                const viewHeight = stageSize.height * scale;

                elements.push(
                  <Rect
                    key="viewport"
                    x={viewX}
                    y={viewY}
                    width={viewWidth}
                    height={viewHeight}
                    stroke="red"
                    strokeWidth={1.5}
                    fill="red"
                    opacity={0.2}
                  />
                );

                return elements;
              })()}
            </Layer>
          </Stage>
        </div>
      </div>

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        draggable
        ref={stageRef}
        onDragMove={(e) => {
          const stage = e.target;
          setStagePos({ x: stage.x(), y: stage.y() });
        }}>
        <Layer>
          {visibleLines.map((line, i) => {
            const from_x = stageSize.width / 2 - 100 + line.from_x + 30;
            const from_y = stageSize.height / 2 + line.from_y + 30;
            const to_x = stageSize.width / 2 - 100 + line.to_x + 30;
            const to_y = stageSize.height / 2 + line.to_y + 30;
            return <Line key={i} points={[from_x, from_y, to_x, to_y]} stroke="black" strokeWidth={2} />;
          })}
        </Layer>

        <Layer>
          {error && <Text text={error} fontSize={20} fill="red" x={100} y={100} />}
          {loading && <Text text="Loading..." fontSize={20} fill="black" x={100} y={130} />}

          {visibleImages.map((img) => (
            <CanvasImage key={img.image_id} img={img} x={img.x} y={img.y} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
