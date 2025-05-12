import { recipeMap } from "./recipes";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import "./burgermenu.css";

function SearchRecipe({ isLoading, fetchHandler, parameter, onParameterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const result = recipeMap[query.trim()];
  const suggestions = Object.keys(recipeMap).filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Button
        className="bg-white text-black border border-gray-300 rounded-md px-4 py-2 fixed top-30 left-40"
        onClick={() => setIsOpen(true)}
      >
        ☰
      </Button>

      <div className={`side-panel ${isOpen ? "open" : ""}`}>
        <Button
          className="text-[24px] text-black bg-white border-none self-end cursor-pointer hover:bg-gray-200"
          onClick={() => setIsOpen(false)}
        >
          ×
        </Button>

        <div className="multiple-extra-option">
          <label>
            Search recipes!
            <Input
              className="value-form"
              name="search"
              type="text"
              placeholder="Enter element name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {query && (
          <div style={{ marginTop: "10px" }}>
            <h4>Suggestions:</h4>
            <ul>
              {suggestions.slice(0, 10).map((name) => (
                <li key={name} onClick={() => setQuery(name)} style={{ cursor: "pointer" }}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div style={{ marginTop: "20px" }}>
            <h4>Recipes for: <strong>{query}</strong></h4>
            <ul>
              {result.map(([a, b], i) => (
                <li key={i}>{a} + {b}</li>
              ))}
            </ul>
          </div>
        )}

        {!result && query && <p>No recipes found for "{query}".</p>}
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default SearchRecipe;
