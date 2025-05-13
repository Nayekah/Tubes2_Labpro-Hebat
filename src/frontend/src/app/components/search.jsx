import { recipeMap } from "./recipes";
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaBookOpen } from "react-icons/fa6";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-context";
import "./burgermenu.css";

function SearchRecipe({ isLoading, fetchHandler, parameter, onParameterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedLetters, setSelectedLetters] = useState(new Set());
  const [sortOrder, setSortOrder] = useState("asc");

  const result = recipeMap[query.trim()];
  const suggestions = Object.keys(recipeMap).filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  const texts = {
    id: {
      searchRecipes: "Cari resep!",
      enterElementName: "Masukkan nama elemen",
      suggestions: "Saran:",
      recipesFor: "Resep untuk",
      noRecipesFound: "Resep tidak ditemukan untuk",
      allElements: "Semua Elemen",
      filterByLetter: "Filter berdasarkan huruf:",
      sortBy: "Urutkan:",
      ascending: "A-Z",
      descending: "Z-A",
      showing: "Menampilkan",
      elements: "elemen"
    },
    en: {
      searchRecipes: "Search recipes!",
      enterElementName: "Enter element name",
      suggestions: "Suggestions:",
      recipesFor: "Recipes for",
      noRecipesFound: "No recipes found for",
      allElements: "All Elements",
      filterByLetter: "Filter by letter:",
      sortBy: "Sort by:",
      ascending: "A-Z",
      descending: "Z-A",
      showing: "Showing",
      elements: "elements"
    }
  };

  const t = texts[language];

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const allElements = useMemo(() => {
    let elements = Object.keys(recipeMap);

    if (selectedLetters.size > 0) {
      elements = elements.filter(name => 
        selectedLetters.has(name.charAt(0).toUpperCase())
      );
    }

    elements.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      } else {
        return b.toLowerCase().localeCompare(a.toLowerCase());
      }
    });
    
    return elements;
  }, [selectedLetters, sortOrder]);

  return (
    <>
      <Button
        className="bg-white dark:bg-gray-800 text-black border border-gray-300 rounded-md px-4 py-2 fixed top-30 left-20 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <FaBookOpen className="text-black dark:text-white"/>
      </Button>

      <div className={`side-panel ${isOpen ? "open" : ""} ${theme === 'dark' ? 'dark' : ''}`}>
        <Button
          className="text-[24px] text-black dark:text-white bg-transparent border-none self-end cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md p-2 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          ×
        </Button>

        <div className="multiple-extra-option">
          <label className="text-gray-700 dark:text-gray-300">
            {t.searchRecipes}
            <Input
              className="value-form bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
              name="search"
              type="text"
              placeholder={t.enterElementName}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {query && suggestions.length > 0 && (
          <div style={{ marginTop: "10px" }} className="text-gray-700 dark:text-gray-300">
            <ul>
              {suggestions.slice(0, 10).map((name) => (
                <li 
                  key={name} 
                  onClick={() => setQuery(name)} 
                  style={{ cursor: "pointer" }}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div style={{ marginTop: "20px" }} className="text-gray-700 dark:text-gray-300">
            <h4>{t.recipesFor}: <strong>{query}</strong></h4>
            <ul>
              {result.map(([a, b], i) => (
                <li key={i}>{a} + {b}</li>
              ))}
            </ul>
          </div>
        )}

        {!result && query && (
          <p className="text-gray-700 dark:text-gray-300">
            {t.noRecipesFound} "{query}".
          </p>
        )}

        {/* All Elements Section */}
        <div style={{ marginTop: "30px" }} className="text-gray-700 dark:text-gray-300">
          <h3 className="text-lg font-bold mb-3">{t.allElements}</h3>
          
          {/* Letter Filter */}
          <div className="mb-4">
            <p className="text-sm mb-2">{t.filterByLetter}</p>
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={selectedLetters.size === 0 ? "default" : "outline"}
                onClick={() => setSelectedLetters(new Set())}
                className="px-2 py-1 text-xs"
              >
                {language === 'id' ? 'Semua' : 'All'}
              </Button>
              {alphabet.map(letter => (
                <Button
                  key={letter}
                  size="sm"
                  variant={selectedLetters.has(letter) ? "default" : "outline"}
                  onClick={() => {
                    const newSelectedLetters = new Set(selectedLetters);
                    if (newSelectedLetters.has(letter)) {
                      newSelectedLetters.delete(letter);
                    } else {
                      newSelectedLetters.add(letter);
                    }
                    setSelectedLetters(newSelectedLetters);
                  }}
                  className="px-2 py-1 text-xs"
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="mb-4">
            <p className="text-sm mb-2">{t.sortBy}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortOrder === "asc" ? "default" : "outline"}
                onClick={() => setSortOrder("asc")}
                className="px-3 py-1"
              >
                {t.ascending}
              </Button>
              <Button
                size="sm"
                variant={sortOrder === "desc" ? "default" : "outline"}
                onClick={() => setSortOrder("desc")}
                className="px-3 py-1"
              >
                {t.descending}
              </Button>
            </div>
          </div>

          {/* Elements List */}
          <div>
            <p className="text-xs text-gray-500 mb-2">
              {t.showing} {allElements.length} {t.elements}
            </p>
            <div className="max-h-64 overflow-y-auto border rounded p-2 dark:border-gray-600">
              <ul className="space-y-1">
                {allElements.map((name) => (
                  <li 
                    key={name} 
                    onClick={() => setQuery(name)} 
                    className="cursor-pointer hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default SearchRecipe;