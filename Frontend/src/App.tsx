import React from 'react';
import './App.css';
import Header from './Header';
import { StoreContextMaker } from './Store';
import Products from './Products';
import Categories from './Categories';

function App() {
  
  return (
    <div className="App">
      <StoreContextMaker>
        <Header />
        <Categories />
        <Products />
      </StoreContextMaker>
    </div>
  );
}

export default App;
