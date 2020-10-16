import React from 'react';
import logo from './logo.svg';
import './App.css';
import Header from './Header';
import { StoreContextMaker } from './Store';

function App() {
  return (
    <div className="App">
      <StoreContextMaker>
        <Header />
      </StoreContextMaker>
    </div>
  );
}

export default App;
