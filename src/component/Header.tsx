import React from 'react';
import logo from './../logo.svg';

export default function Header() { 
        return (
         <header className="flex bg-gray-800 px-5 text-gray-100 items-center justify-between">
        <img src={logo} className="App-logo w-20" alt="logo" />
        <h3>
          Canvas Drawing App – React + TypeScript
        </h3>
      </header>
    );
}
      