import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-context";

import "./burgermenu.css";

function BurgerMenu({ isLoading, fetchHandler, parameter, onParameterChange, loadingRef }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [errors, setErrors] = useState({
    numOfRecipes: "",
    delay: "",
  });

  // Text translations
  const texts = {
    id: {
      searchPlaceholder: "Cari elemen...",
      fetch: "Cari",
      loading: "Batalkan?",
      method: "Metode:",
      option: "Opsi:",
      shortestRecipe: "Resep Tersingkat",
      multipleRecipe: "Beberapa Resep",
      visualizationDelay: "Jeda Visualisasi (ms):",
      recipesQuestion: "Berapa banyak resep?",
      includeTime: "Sertakan waktu sebagai element dasar?",
      errors: {
        recipeRequired: "Jumlah resep diperlukan",
        mustBeInteger: "Harus berupa bilangan bulat",
        mustBeGreaterThanZero: "Harus lebih besar dari 0",
        delayRequired: "Jeda diperlukan",
        mustBeAtLeast1ms: "Minimal harus 1ms",
      },
    },
    en: {
      searchPlaceholder: "Search an element...",
      fetch: "Fetch",
      loading: "Cancel?",
      method: "Method:",
      option: "Option:",
      shortestRecipe: "Shortest Recipe",
      multipleRecipe: "Multiple Recipe",
      visualizationDelay: "Visualization Delay (ms):",
      recipesQuestion: "How many recipes?",
      includeTime: "Include time as base element?",
      errors: {
        recipeRequired: "Recipe count is required",
        mustBeInteger: "Must be an integer",
        mustBeGreaterThanZero: "Must be greater than 0",
        delayRequired: "Delay is required",
        mustBeAtLeast1ms: "Must be at least 1ms",
      },
    },
  };

  const t = texts[language];
  const methods = ["BFS", "DFS", "Bidirectional"];
  const options = [
    { value: "Shortest", label: t.shortestRecipe },
    { value: "Multiple", label: t.multipleRecipe },
  ];
  const isLastOptionSelected = parameter.option === "Multiple";

  const validateInput = (name, value) => {
    let error = "";

    if (name === "numOfRecipes") {
      if (!value || value === "") {
        error = t.errors.recipeRequired;
      } else if (!Number.isInteger(Number(value))) {
        error = t.errors.mustBeInteger;
      } else if (Number(value) <= 0) {
        error = t.errors.mustBeGreaterThanZero;
      }
    } else if (name === "delay") {
      if (!value || value === "") {
        error = t.errors.delayRequired;
      } else if (!Number.isInteger(Number(value))) {
        error = t.errors.mustBeInteger;
      } else if (Number(value) < 1) {
        error = t.errors.mustBeAtLeast1ms;
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Allow only numeric input
    if ((name === "numOfRecipes" || name === "delay") && value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    onParameterChange(e);
    validateInput(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let hasErrors = false;

    // Validate delay
    if (!validateInput("delay", parameter.delay)) {
      hasErrors = true;
    }

    // Validate numOfRecipes if Multiple option is selected
    if (isLastOptionSelected && !validateInput("numOfRecipes", parameter.numOfRecipes)) {
      hasErrors = true;
    }

    if (!hasErrors) {
      fetchHandler(e);
    }
  };

  return (
    <>
      <Button
        className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 rounded-md px-4 py-2 fixed top-30 left-5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(true)}>
        ☰
      </Button>

      <div className={`side-panel ${isOpen ? "open" : ""} ${theme === "dark" ? "dark" : ""}`}>
        <Button
          className="text-[24px] text-black dark:text-white bg-transparent border-none self-end cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md p-2 transition-colors"
          onClick={() => setIsOpen(false)}>
          ×
        </Button>
        <div className="search-function">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              name="target"
              value={parameter.target}
              placeholder={t.searchPlaceholder}
              className="menu-input bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
              onChange={onParameterChange}
              required
            />
            <Button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              onClick={() => {
                console.log(loadingRef.current);
                if (loadingRef && loadingRef.current == true) {
                  loadingRef.current = false;
                } else {
                  handleSubmit({ preventDefault: () => {} });
                }
              }}>
              {loadingRef.current ? t.loading : t.fetch}
            </Button>
          </form>
        </div>

        <label className="text-gray-700 dark:text-gray-300">{t.method}</label>
        <select
          name="method"
          className="menu-select bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
          onChange={onParameterChange}
          value={parameter.method}>
          {methods.map((met, idx) => (
            <option key={idx} value={met}>
              {met}
            </option>
          ))}
        </select>

        { parameter.method !== "Bidirectional" && (
          <>
            <label className="text-gray-700 dark:text-gray-300">{t.option}</label>
            <select
              name="option"
              className="menu-select bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
              value={parameter.option}
              onChange={onParameterChange}>
              {options.map((opt, idx) => (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="multiple-extra-option">
          <label className="text-gray-700 dark:text-gray-300">
            {t.visualizationDelay}
            <Input
              className="value-form bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
              name="delay"
              type="text"
              value={parameter.delay}
              onChange={handleInputChange}
              required
            />
            {errors.delay && <span className="text-red-500 text-sm mt-1">{errors.delay}</span>}
          </label>
        </div>

        {/* <div className="flex items-center justify-between mt-2">
          <label htmlFor="includeTimeToggle" className="text-gray-700 dark:text-gray-300">
            {t.includeTime}
          </label>

          <div className="relative inline-block w-12 h-6">
            <input
              id="includeTimeToggle"
              type="checkbox"
              name="includeTime"
              checked={parameter.includeTime}
              onChange={() =>
                onParameterChange({
                  target: {
                    name: "includeTime",
                    value: !parameter.includeTime,
                  },
                })
              }
              className="sr-only peer"
              style={{ width: "100%", height: "100%", position: "absolute", left: 0, top: 0, zIndex: 2, cursor: "pointer" }}
              tabIndex={0}
            />
            <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-full transition-colors duration-300 peer-checked:bg-green-500 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 peer-checked:translate-x-6 pointer-events-none"></div>
          </div>
        </div> */}

        {isLastOptionSelected && parameter.method !== "Bidirectional" && (
          <div className="multiple-extra-option">
            <label className="text-gray-700 dark:text-gray-300">
              {t.recipesQuestion}
              <Input
                className="value-form bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
                name="numOfRecipes"
                type="text"
                value={parameter.numOfRecipes}
                onChange={handleInputChange}
                required={isLastOptionSelected}
              />
              {errors.numOfRecipes && <span className="text-red-500 text-sm mt-1">{errors.numOfRecipes}</span>}
            </label>
          </div>
        )}
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default BurgerMenu;
