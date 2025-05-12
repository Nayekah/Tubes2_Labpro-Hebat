import React, { useState, useEffect, useRef, useMemo, useCallback, useTransition } from "react";
import { Stage, Layer, Image as KonvaImage, Text, Line, Rect, Group } from "react-konva";
import BurgerMenu from "../../components/burgermenu.jsx";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-context";

export default function KonvaCanvas({ onTerminalMessage }) {
  const stageRef = useRef(null);
  const insetStageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const imageMapRef = useRef(new Map());
  const [imageIds, setImageIds] = useState([]);
  const [isPending, startTransition] = useTransition();
  const contentBoundsRef = useRef({ minX: -7500, minY: -2500, maxX: 7500, maxY: 2500, width: 15000, height: 5000 });
  const insetWidth = 180;
  const insetHeight = 120;
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [hovered, setHovered] = useState(false);

  const CanvasImage = ({ img, x, y }) => {
    const imageRef = useRef();
    const [localHovered, setLocalHovered] = useState(false);

    useEffect(() => {
      const node = imageRef.current;
      const layer = node?.getLayer?.();
      if (layer && typeof layer.batchDraw === "function") {
        requestAnimationFrame(() => layer.batchDraw());
      }
    }, [img.image]);

    return (
      <Group x={x} y={y} onMouseEnter={() => setLocalHovered(true)} onMouseLeave={() => setLocalHovered(false)}>
        {/* Background */}
        <Rect 
          width={60} 
          height={60} 
          fill={theme === 'dark' ? "#374151" : "#ddd"} 
          cornerRadius={8} 
        />

        {/* Image */}
        <KonvaImage x={5} y={5} width={50} height={50} ref={imageRef} image={img.image} />

        {/* Border */}
        <Rect 
          width={60} 
          height={60} 
          stroke={theme === 'dark' ? "#9ca3af" : "black"} 
          strokeWidth={1} 
          cornerRadius={8} 
        />

        {/* Text */}
        {localHovered && (
          <Text 
            text={img.image_name || "???"} 
            fontSize={13} 
            fill={theme === 'dark' ? "#f3f4f6" : "black"} 
            x={0} 
            y={65} 
            width={60} 
            align="center" 
          />
        )}
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
    const startTime = Date.now();
    
    const t = {
      id: {
        searching: "Mencari",
        method: "Metode",
        option: "Opsi",
        recipesToShow: "Resep untuk Ditampilkan",
        serverResponded: "Server berhasil merespons",
        nodesVisited: "Node yang Dikunjungi",
        serverExecutionTime: "Waktu Eksekusi Server",
        visualizationComplete: "Visualisasi selesai",
        clientRequestTime: "Waktu Permintaan Klien",
        error: "Error"
      },
      en: {
        searching: "Searching for",
        method: "Method",
        option: "Option",
        recipesToShow: "Recipes to Show",
        serverResponded: "Server responded successfully",
        nodesVisited: "Nodes visited",
        serverExecutionTime: "Server execution time",
        visualizationComplete: "Visualization complete",
        clientRequestTime: "Client request time",
        error: "Error"
      }
    }[language];
    
    if (onTerminalMessage) {
      onTerminalMessage('-----------------------------------', 'divider');
      onTerminalMessage(`${t.searching}: ${searchParameter.target}`, 'info');
      onTerminalMessage(`${t.method}: ${searchParameter.method}`, 'info');
      onTerminalMessage(`${t.option}: ${searchParameter.option}`, 'info');
      if (searchParameter.option === 'Multiple') {
        onTerminalMessage(`${t.recipesToShow}: ${searchParameter.numOfRecipes}`, 'info');
      }
    }

    try {
      const res = await fetch(`${apiUrl}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: searchParameter.target,
          method: searchParameter.method,
          option: searchParameter.option,
          num_of_recipes: Number(searchParameter.numOfRecipes),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const images_data = data.images;
      const line_data = data.lines;
      setLines(line_data);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      if (onTerminalMessage) {
        onTerminalMessage(`✓ ${t.serverResponded}`, 'success');
        onTerminalMessage(`${t.nodesVisited}: ${images_data.length}`, 'info');
        onTerminalMessage(`${t.serverExecutionTime}: ${executionTime}ms`, 'info');
      }

      let firstImage = images_data[0];
      console.log("firstImage:", firstImage);
      if (firstImage) {
        const mainStage = stageRef.current;
        const targetX = -firstImage.image_pos_col;
        const targetY = -firstImage.image_pos_row + stageSize.height / 2 - 65;

        mainStage.to({
          x: targetX,
          y: targetY,
          duration: 0.3,
        });
        setStagePos({ x: targetX, y: targetY });
      }

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
        await new Promise((r) => setTimeout(r, searchParameter.delay));
      }

      if (batch.length) {
        startTransition(() => {
          setImageIds((prev) => [...prev, ...batch]);
        });
      }
      
      if (onTerminalMessage) {
        const totalTime = Date.now() - startTime;
        onTerminalMessage(`✓ ${t.visualizationComplete}`, 'success');
        onTerminalMessage(`${t.clientRequestTime}: ${totalTime}ms`, 'info');
        onTerminalMessage('-----------------------------------', 'divider');
      }
    } catch (err) {
      setError(err.message);
      if (onTerminalMessage) {
        onTerminalMessage(`✗ ${t.error}: ${err.message}`, 'error');
        onTerminalMessage('-----------------------------------', 'divider');
      }
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
    return (lines || []).filter((line) => loadedSet.has(line.from_id) && loadedSet.has(line.to_id));
  }, [lines, imageIds]);

  const handleInsetClick = (e) => {
    const insetStage = e.target.getStage();
    if (!insetStage || !stageRef.current) return;

    const pointerPosition = insetStage.getPointerPosition();
    if (!pointerPosition) return;

    const bounds = contentBoundsRef.current;
    const scaleX = insetWidth / bounds.width;
    const scaleY = insetHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.75;

    const contentX = pointerPosition.x / scale + bounds.minX;
    const contentY = pointerPosition.y / scale + bounds.minY;

    const mainStage = stageRef.current;
    const newX = -(contentX - stageSize.width / 2);
    const newY = -(contentY - stageSize.height / 2);

    mainStage.to({
      x: newX,
      y: newY,
      duration: 0.3,
    });

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

  const isVisible = (imgX, imgY, imgWidth, imgHeight, stageX, stageY, viewWidth, viewHeight) => {
    const adjustedX = imgX + stageX;
    const adjustedY = imgY + stageY;

    return adjustedX + imgWidth > 0 && adjustedX < viewWidth && adjustedY + imgHeight > 0 && adjustedY < viewHeight;
  };

  const isLineVisible = (from_x, from_y, to_x, to_y, stageX, stageY, viewWidth, viewHeight) => {
    const viewportLeft = -1 * stageX;
    const viewportTop = -1 * stageY;
    const viewportRight = viewportLeft + viewWidth;
    const viewportBottom = viewportTop + viewHeight;

    if (from_y === to_y) {
      if (from_y < viewportTop || from_y > viewportBottom) {
        return false;
      }

      const leftX = Math.min(from_x, to_x);
      const rightX = Math.max(from_x, to_x);

      return rightX >= viewportLeft && leftX <= viewportRight;
    }

    if (from_x === to_x) {
      if (from_x < viewportLeft || from_x > viewportRight) {
        return false;
      }

      const topY = Math.min(from_y, to_y);
      const bottomY = Math.max(from_y, to_y);

      return bottomY >= viewportTop && topY <= viewportBottom;
    }

    return false;
  };

  const [searchParameter, setSearchParameter] = useState({
    target: "",
    method: "BFS",
    option: "Shortest",
    numOfRecipes: 1,
    delay: 100,
  });

  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    setSearchParameter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className={`relative ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      <div className="absolute top-24 z-10 bg-white dark:bg-gray-800 p-1 rounded shadow-md">
        <BurgerMenu
          parameter={searchParameter}
          onParameterChange={handleParameterChange}
          isLoading={loading}
          fetchHandler={fetchImages}
        />
      </div>

      {/* Map */}
      <div className="absolute top-40 right-8 z-10">
        <div className="bg-white dark:bg-gray-800 p-1 rounded shadow-md border border-gray-500 dark:border-gray-600">
          <Stage
            width={insetWidth}
            height={insetHeight}
            onClick={handleInsetClick}
            ref={insetStageRef}
            style={{ cursor: "pointer" }}>
            <Layer>
              <Rect 
                x={0} 
                y={0} 
                width={insetWidth} 
                height={insetHeight} 
                fill={theme === 'dark' ? "#1f2937" : "#f0f0f0"} 
              />

              {(() => {
                const bounds = contentBoundsRef.current;

                const elements = [];
                const scaleX = insetWidth / bounds.width;
                const scaleY = insetHeight / bounds.height;
                const scale = Math.min(scaleX, scaleY) * 0.75;

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
                    stroke={theme === 'dark' ? "#ef4444" : "red"}
                    strokeWidth={1.5}
                    fill={theme === 'dark' ? "#ef4444" : "red"}
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
          {/* Background */}
          <Rect
            x={-stagePos.x}
            y={-stagePos.y}
            width={stageSize.width}
            height={stageSize.height}
            fill={theme === 'dark' ? "#111827" : "#f9fafb"}
          />
        </Layer>
        
        <Layer>
          {visibleLines.map((line, i) => {
            const from_x = stageSize.width / 2 - 100 + line.from_x + 30;
            const from_y = stageSize.height / 2 + line.from_y + 30;
            const to_x = stageSize.width / 2 - 100 + line.to_x + 30;
            const to_y = stageSize.height / 2 + line.to_y + 30;
            return (
              <Line 
                key={i} 
                points={[from_x, from_y, to_x, to_y]} 
                stroke={theme === 'dark' ? "#6b7280" : "black"} 
                strokeWidth={2} 
              />
            );
          })}
        </Layer>

        <Layer>
          {error && (
            <Text 
              text={error} 
              fontSize={20} 
              fill={theme === 'dark' ? "#ef4444" : "red"} 
              x={100} 
              y={100} 
            />
          )}
          {loading && (
            <Text 
              text={language === 'id' ? "Memuat..." : "Loading..."} 
              fontSize={20} 
              fill={theme === 'dark' ? "#f3f4f6" : "black"} 
              x={100} 
              y={130} 
            />
          )}

          {visibleImages.map((img) => (
            <CanvasImage key={img.image_id} img={img} x={img.x} y={img.y} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}