import { recipeMap } from "./recipes";
import React, { useState } from "react";
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
      noRecipesFound: "Resep tidak ditemukan untuk"
    },
    en: {
      searchRecipes: "Search recipes!",
      enterElementName: "Enter element name",
      suggestions: "Suggestions:",
      recipesFor: "Recipes for",
      noRecipesFound: "No recipes found for"
    }
  };

  const t = texts[language];

  return (
    <>
      <Button
        className="bg-white dark:bg-gray-800 text-black border border-gray-300 rounded-md px-4 py-2 fixed top-30 left-20"
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

        {query && (
          <div style={{ marginTop: "10px" }} className="text-gray-700 dark:text-gray-300">
            <h4>{t.suggestions}</h4>
            <ul>
              {suggestions.slice(0, 10).map((name) => (
                <li 
                  key={name} 
                  onClick={() => setQuery(name)} 
                  style={{ cursor: "pointer" }}
                  className="hover:text-purple-500 transition-colors"
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
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default SearchRecipe;