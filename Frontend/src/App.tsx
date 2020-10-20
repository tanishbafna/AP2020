import React from 'react';
import './App.css';
import Header from './Header';
import { StoreContextMaker } from './Store';
import Products from './Products';
import Categories from './Categories';
import UserPage from './UserPage';

function App() {
  const pathname = window.location.pathname

  return (
    <div className="App">
      <StoreContextMaker>
        <Header />
        {
          pathname === '/user' ?
          <UserPage /> :
          <>
          <Categories />
          <Products />
          </>
        }
        
      </StoreContextMaker>
    </div>
  );
}

export default App;
