import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import "./burgermenu.css";

function BurgerMenu({ isLoading, fetchHandler, parameter, onParameterChange }) {
  //const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // const [searchParameter, setSearchParameter] = useState({
  //     target: '',
  //     method: 'BFS',
  //     option: 'Shortest',
  //     numOfRecipes: 0
  // });

  const methods = ["BFS", "DFS", "Bidirectional"];
  const options = ["Shortest", "Multiple"];
  const isLastOptionSelected = parameter.option === options[options.length - 1];

  // const handleParameterChange = (e) => {
  //     const {name, value} = e.target;
  //         setSearchParameter((prev) => ({
  //         ...prev,
  //         [name] : value
  //     }));
  // };

  return (
    <>
      <Button
        className="bg-white text-black border border-gray-300 rounded-md px-4 py-2 fixed top-30 left-5"
        onClick={() => setIsOpen(true)}>
        ☰
      </Button>

      <div className={`side-panel ${isOpen ? "open" : ""}`}>
        <Button
          className="text-[24px] text-black bg-white border-none self-end cursor-pointer hover:bg-gray-200"
          onClick={() => setIsOpen(false)}>
          ×
        </Button>
        <div className="search-function">
          <form onSubmit={fetchHandler} className="flex gap-2">
            <Input
              type="text"
              name="target"
              value={parameter.target}
              placeholder="Search an element..."
              className="menu-input"
              onChange={onParameterChange}
            />
            <Button type="submit" disabled={isLoading} onClick={() => ""}>
              {isLoading ? "Loading..." : "Fetch"}
            </Button>
          </form>
        </div>

        <label>Method:</label>
        <select name="method" className="menu-select" onChange={onParameterChange} value={parameter.method}>
          {methods.map((met, idx) => (
            <option key={idx} value={met}>
              {met}
            </option>
          ))}
        </select>

        <label>Option:</label>
        <select name="option" className="menu-select" value={parameter.option} onChange={onParameterChange}>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt + " Recipe"}
            </option>
          ))}
        </select>

        <div className="multiple-extra-option">
          <label>
            Visualization Delay (ms):
            <Input
              className="value-form"
              name="delay"
              type="number"
              min={1}
              value={parameter.delay}
              onChange={onParameterChange}
            />
          </label>
        </div>

        {isLastOptionSelected && (
          <div className="multiple-extra-option">
            <label>
              How many recipes ?
              <Input
                className="value-form"
                name="numOfRecipes"
                type="number"
                min={1}
                value={parameter.numOfRecipes}
                onChange={onParameterChange}
              />
            </label>
          </div>
        )}
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default BurgerMenu;
