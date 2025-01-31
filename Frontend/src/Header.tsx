import React, { useContext, useEffect, useRef, useState } from 'react'
import SearchBar from './SearchBar'
import Cart from './Cart'
import {ReactComponent as UserIcon} from './Images/User.svg'
import './Header.css'
import Login from './Login'
import Wishlist from './Wishlist'
import AppController from './AppController'

const User = () => {
    const [openedLogin, setOpenedLogin] = useState (false)
    const controller = new AppController ()

    const userButtonClicked = () => {
        if (controller.isLoggedIn()) {
            window.location.replace ('/user')
        } else setOpenedLogin (true)
    }
    return (
        <div>
            <Login open={openedLogin} dismiss={ () => { setOpenedLogin(false); if(controller.isLoggedIn()) userButtonClicked() } }/>
            <button className='btn-transparent' style={{height: '2.5rem'}} onClick={ userButtonClicked }>
                <UserIcon style={{ fill: 'var(--color-secondary)' }}/>
            </button>
        </div>
    )
}

export default function () {
    return (
        <div className='header'>
            <span className='home' style={{color: 'var(--color-secondary)', fontWeight: 'bold'}}>
                <a href='/'> UMMAZONE </a>
            </span>
            <SearchBar />
            <User />
            <Cart />
            <Wishlist />
        </div>
    )
}