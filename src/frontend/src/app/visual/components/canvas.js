import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Text, Line } from "react-konva";
import DropdownButton from "@/app/components/dropdown.jsx";

export default function KonvaCanvas() {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [images, setImages] = useState([]);
  const [lines, setLines] = useState([]);
  const [isLoaded, setIsLoaded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [targetElement, setTargetElement] = useState("");
  const [error, setError] = useState(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  // Load images when target element changes
  const fetchImages = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsLoaded(false);
    setError(null);

    try {
      const res = await fetch("http://localhost:8080/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Target: targetElement }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log(data);

      const images_data = data.images;
      const line_data = data.lines;

      //console.log("images_data = " + images_data);
      //console.log("line_data = " + line_data);

      // Load the images
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
              // Still resolve but mark the error
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

      line_data.forEach((line, index) => {
        console.log("Line from_x:", line.from_x, "from_y:", line.from_y, "to_x:", line.to_x, "to_y:", line.to_y);
      });

      setIsLoaded(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || "An error occurred");
      setIsLoaded(true);
      setLoading(false);
      console.error("Error fetching images:", err);
    }
  };

  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== "undefined") {
        setStageSize({
          width: window.innerWidth,
          height: window.innerHeight - 60, // Subtract navbar height
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

  return (
    
    <div className="relative">
      {/* {Control panel} */}
      <div className="absolute top-24 left-4 z-10 bg-white p-2 rounded shadow-md group">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Method Selection Option
      </button>

      <div className="absolute mt-2 w-40 bg-white border rounded shadow-lg z-10 hidden group-hover:block">
        <a href="#" className="block px-4 py-2 hover:bg-gray-100">BFS</a>
        <a href="#" className="block px-4 py-2 hover:bg-gray-100">DFS</a>
        <a href="#" className="block px-4 py-2 hover:bg-gray-100">Bidirectional</a>
      </div>
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

                // const stageX = stageRef.current ? stageRef.current.x() : 0;
                // const stageY = stageRef.current ? stageRef.current.y() : 0;

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
