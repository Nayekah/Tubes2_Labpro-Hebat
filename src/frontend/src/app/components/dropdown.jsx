import { useState, useRef, useEffect } from 'react';

export default function DropdownButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Menu
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-40 bg-white border rounded shadow-lg z-10">
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Item 1</a>
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Item 2</a>
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Item 3</a>
        </div>
      )}
    </div>
  );
}