// generate-recipes.js
const fs = require("fs");
const path = require("path");

const inputPath = "recipes.csv";
const outputPath = "recipes.js";

const raw = fs.readFileSync(inputPath, "utf-8");
const lines = raw.trim().split("\n");

// skip header
lines.shift();

const recipes = {};

for (const line of lines) {
  const [element, comb1, comb2] = line.split(",").map(s => s.trim());
  if (!recipes[element]) {
    recipes[element] = [];
  }
  recipes[element].push([comb1, comb2]);
}

// write as JS file for import
const jsContent =
  "export const recipeMap = " +
  JSON.stringify(recipes, null, 2) +
  ";\n";

fs.writeFileSync(outputPath, jsContent, "utf-8");
console.log(`✅ Generated ${outputPath}`);
