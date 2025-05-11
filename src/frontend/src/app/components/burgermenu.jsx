import React, {useState} from 'react';
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";

import './burgermenu.css';

function BurgerMenu({isLoading, fetchHandler}) {
    //const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const [parameter, setParameter] = useState({
        target: '',
        method: 'BFS',
        option: 'Shortest',
        numOfRecipes: 0
    });

    const methods = ["BFS", "DFS", "Bidirectional"];
    const options = ["Shortest", "Multiple"];
    const isLastOptionSelected = parameter.option === options[options.length - 1];

    const handleChange = (e) => {
        const {name, value} = e.target;
            setParameter((prev) => ({
            ...prev,
            [name] : value
        }));
    };

    return (
    <>
      <Button className="bg-white text-black border border-gray-300 rounded-md px-4 py-2 fixed top-30 left-5" 
      onClick={() => setIsOpen(true)}>☰</Button>

      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <Button className="text-[24px] text-black bg-white border-none self-end cursor-pointer hover:bg-gray-200" onClick={() => setIsOpen(false)}>×</Button>
        <div className="search-function">
        <form onSubmit={fetchHandler} className='flex gap-2'>
        <Input  type="text" 
                name="target"
                value={parameter.target}
                placeholder="Search an element..." 
                className="menu-input" 
                onChange={handleChange}
        />
        <Button type="submit" disabled={isLoading} onClick={() => ""}>{isLoading ? "Loading..." : "Fetch"}</Button>
        </form>
        </div>

        <label>Method:</label>
        <select name="method" className="menu-select" onChange={handleChange} value={parameter.method}>
          {methods.map((met, idx) => (
            <option key={idx} value={met}>
              {met}
            </option>
          ))}
        </select>

        <label>Option:</label>
        <select name="option" className="menu-select" value={parameter.option} onChange={handleChange}>
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
              name="numOfRecipes"
              type="number"
              value={parameter.numOfRecipes}
              onChange={handleChange}
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