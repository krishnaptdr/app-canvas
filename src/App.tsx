import React from 'react';
import logo from './logo.svg';
import './App.css';
import AppCanvas from './component/AppCanvas';
function App() {
  return (
    <div className="App">
       <header className="flex bg-gray-800 px-5 text-gray-100 items-center justify-between">
        <img src={logo} className="App-logo w-20" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link pe-4"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <AppCanvas />
     
    </div>
  );
}

export default App;
