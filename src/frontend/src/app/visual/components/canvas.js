import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Text, Line } from "react-konva";
import BurgerMenu from '../../components/burgermenu.jsx'

export default function KonvaCanvas() {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [images, setImages] = useState([]);
  const [lines, setLines] = useState([]);
  const [isLoaded, setIsLoaded] = useState(true);
  const [loading, setLoading] = useState(false);
  //const [targetElement, setTargetElement] = useState("");
  const [error, setError] = useState(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      return `${protocol}//${hostname}:8080`;
    }

    return 'http://localhost:8080';
  };

  const fetchImages = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsLoaded(false);
    setError(null);

    const apiUrl = getApiUrl();
    console.log('Using API URL:', apiUrl);

    try {
      const res = await fetch(`${apiUrl}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Target: searchParameter.target}),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log(data);

      const images_data = data.images;
      const line_data = data.lines;

      const loadedImages = await Promise.all(
        images_data.map((imgData) => {
          return new Promise((resolve) => {
            const img = new window.Image();
            img.src = imgData.image_link;
            img.onload = () => {
              resolve({
                ...imgData,
                image: img,
              });
            };
            img.onerror = () => {
              resolve({
                ...imgData,
                loadError: true,
                image: null,
              });
            };
          });
        })
      );

      setImages(loadedImages);
      setLines(line_data);

      console.log("Loaded images:", loadedImages);
      console.log("Loaded lines:", line_data);

      setIsLoaded(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || "An error occurred");
      setIsLoaded(true);
      setLoading(false);
      console.error("Error fetching images:", err);
    }
  };

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== "undefined") {
        setStageSize({
          width: window.innerWidth,
          height: window.innerHeight - 60,
        });
      }
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
    // Calculate viewport boundaries
    const viewportLeft = -1 * stageX;
    const viewportTop = -1 * stageY;
    const viewportRight = viewportLeft + viewWidth;
    const viewportBottom = viewportTop + viewHeight;
  
    // Check if it's a horizontal line
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
          target: '',
          method: 'BFS',
          option: 'Shortest',
          numOfRecipes: 0
      });

  const handleParameterChange = (e) => {
        const {name, value} = e.target;
            setSearchParameter((prev) => ({
            ...prev,
            [name] : value
        }));
    };

  return (
    <div className="relative">
      {/* Control panel */}
      {/* <div className="absolute top-24 left-4 z-10 bg-white p-2 rounded shadow-md">
        <form onSubmit={fetchImages} className="flex gap-2">
          <input
            type="text"
            value={targetElement}
            onChange={(e) => setTargetElement(e.target.value)}
            placeholder="Target element"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" disabled={loading}>
            {loading ? "Loading..." : "Fetch"}
          </button>
        </form>
      </div> */}
      <div className="absolute top-24 z-10 bg-white p-1 rounded shadow-md">
        <BurgerMenu parameter={searchParameter} onParameterChange={handleParameterChange} isLoading={loading} fetchHandler={fetchImages}/>
      </div>
      {/* Konva Stage */}
      <div className="konva-container">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          draggable
          ref={stageRef}
          onDragMove={(e) => {
            const stage = e.target;
            setStagePos({
              x: stage.x(),
              y: stage.y(),
            });
          }}>
          <Layer>
            {isLoaded &&
              lines.map((line, index) => {
                const from_x = stageSize.width / 2 - 100 + line.from_x + 30;
                const from_y = stageSize.height / 2 + line.from_y + 30;
                const to_x = stageSize.width / 2 - 100 + line.to_x + 30;
                const to_y = stageSize.height / 2 + line.to_y + 30;

                const stageX = stageRef.current ? stageRef.current.x() : 0;
                const stageY = stageRef.current ? stageRef.current.y() : 0;

                if (!isLineVisible(from_x, from_y, to_x, to_y, stageX, stageY, stageSize.width, stageSize.height)) {
                  return null;
                }

                // if (!isVisible(imgX, imgY, 60, 60, stagePos.x, stagePos.y, stageSize.width, stageSize.height)) {
                //   return null;
                // }

                return <Line key={index} points={[from_x, from_y, to_x, to_y]} stroke="black" strokeWidth={2} />;
              })}
          </Layer>

          <Layer>
            {error && (
              <Text
                text={error}
                fontSize={20}
                fill="red"
                x={stageSize.width / 2 - 150}
                y={stageSize.height / 2}
                width={300}
                align="center"
              />
            )}

            {loading && (
              <Text
                text="Loading images..."
                fontSize={20}
                fill="black"
                x={stageSize.width / 2 - 100}
                y={stageSize.height / 2}
                width={200}
                align="center"
              />
            )}

            {isLoaded &&
              images.map((img, index) => {
                const imgX = stageSize.width / 2 - 100 + img.image_pos_col;
                const imgY = stageSize.height / 2 + img.image_pos_row;

                const stageX = stageRef.current ? stageRef.current.x() : 0;
                const stageY = stageRef.current ? stageRef.current.y() : 0;

                if (!isVisible(imgX, imgY, 60, 60, stagePos.x, stagePos.y, stageSize.width, stageSize.height)) {
                  return null;
                }

                return (
                  <Image key={img.image_id} alt={img.image_name} image={img.image} x={imgX} y={imgY} width={60} height={60} />
                );
              })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}