import React, {useState} from 'react';
import './burgermenu.css';

function BurgerMenu() {

    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("Shortest");
    const [customValue, setCustomValue] = useState("");

    const options = ["Shortest", "Multiple"];
    const isLastOptionSelected = selectedOption === options[options.length - 1];

    const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
  };

    return (
    <>
      <button className="burger-icon" onClick={() => setIsOpen(true)}>☰</button>

      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        <div className="search-function">
        <input type="text" placeholder="Search..." className="menu-input" />
        <button className ="fetch-btn" onClick={() => ""}>Go</button>
        </div>
        <label>Method:</label>
        <select className="menu-select">
          <option>BFS</option>
          <option>DFS</option>
          <option>Bidirectional</option>
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
            <input className = "value-form"
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