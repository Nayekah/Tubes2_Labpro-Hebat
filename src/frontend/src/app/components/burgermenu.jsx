import React, {useState} from 'react';
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";

import './burgermenu.css';

function BurgerMenu() {
    const [loading, setLoading] = useState(false);
    const [target, setTargetElement] = useState();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState("BFS");
    const [selectedOption, setSelectedOption] = useState("Shortest");
    const [customValue, setCustomValue] = useState("");

    const methods = ["BFS", "DFS", "Bidirectional"];
    const options = ["Shortest", "Multiple"];
    const isLastOptionSelected = selectedOption === options[options.length - 1];

    const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
  };

    const fetchImages = () => {
    }

    return (
    <>
      <Button className="bg-white text-black border border-gray-300 rounded-md px-4 py-2 fixed top-30 left-5" 
      onClick={() => setIsOpen(true)}>☰</Button>

      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <Button className="text-[24px] text-black bg-white border-none self-end cursor-pointer hover:bg-gray-200" onClick={() => setIsOpen(false)}>×</Button>
        <div className="search-function">
        <form onSubmit={fetchImages} className='flex gap-2'>
        <Input  type="text" 
                placeholder="Search an element..." 
                className="menu-Input" 
                onChange={(e) => setTargetElement(e.target.value)}
        />
        <Button type="submit" disabled={loading} onClick={() => ""}>{loading ? "Loading..." : "Fetch"}</Button>
        </form>
        </div>
        <label>Method:</label>
        <select className="menu-select">
          {methods.map((met, idx) => (
            <option key={idx} value={met}>
              {met}
            </option>
          ))}
        </select>

        <label>Option:</label>
        <select className="menu-select" onChange={handleSelectChange}>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt + " Recipe"}
            </option>
          ))}
        </select>

        {isLastOptionSelected && (
        <div className="multiple-extra-option">
          <label>
            How many recipes ?
            <Input className = "value-form"
              type="number"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
            />
          </label>
        </div>
      )}
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default BurgerMenu;