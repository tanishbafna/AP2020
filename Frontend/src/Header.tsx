

import React from 'react'
import SearchBar from './SearchBar'
import './Header.css'

export default function () {
    return (
        <div className='header'>
            <span className='home' style={{color: 'var(--color-secondary)', fontWeight: 'bold'}}>
                <a href='/'> UMMAZONE </a>
            </span>
            <SearchBar />
            <button className='btn-secondary' style={{height: '2.5rem'}}>
                Login
            </button>
        </div>
    )
}