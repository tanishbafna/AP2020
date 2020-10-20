import React, { useEffect, useState } from 'react'
import { FadeLoader } from 'react-spinners'
import AppController from "./AppController"
import { Order, User } from './Types'
import './UserPage.css'

export default () => {
    const controller = new AppController ()
    const [user, setUser] = useState (undefined as any as User)
    const [orders, setOrders] = useState ([] as any as Order[])

    const jwt = controller.getUser ()

    useEffect (() => {
        controller.profile ()
        .then (setUser)

        controller.orders ()
        .then (setOrders)
    }, [])

    return (
        <div className='user-page'>
            { !controller.isLoggedIn && <h1>Press the user icon to log in</h1> }
            { controller.isLoggedIn() && !user && <FadeLoader /> }
            {
                user && (
                <>
                <div className='header'>
                    <h1>{ user.name }</h1>
                    <span>{ jwt.email }</span>
                </div>
                <hr/>
                <div className='section'>
                    <h2>My Address</h2>
                    <input defaultValue={user.address} type='textarea' placeholder='enter your address here'/>
                </div>

                <div className='section'>
                    <h2>My Orders</h2>
                    <div>
                        {
                            orders.map ((order, i) => (
                                <div key={i}>
                                    { order.name }
                                </div>
                            ))
                        }
                    </div>
                </div>
                
                </>
                )
            }
        </div>
    )
}