import React, {useState} from 'react';
import './burgermenu.css';

function BurgerMenu() {

    const [isOpen, setIsOpen] = useState(false);

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
        <select className="menu-select">
          <option>Shortest Recipe</option>
          <option>Multiple Recipe</option>
        </select>
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default BurgerMenu;