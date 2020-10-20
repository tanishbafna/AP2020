import React, { useEffect, useState } from 'react'
import { FadeLoader } from 'react-spinners'
import AppController from "./AppController"
import { Order, User, ProductFull } from './Types'
import './UserPage.css'

const OrderItem = ({ order }: { order: Order }) => {
    const controller = new AppController ()
    const [product, setProduct] = useState (undefined as any as ProductFull)

    useEffect (() => {
        controller.product (order.asin)
        .then (setProduct)
    }, [ order.asin ])

    return (
        <div className='order-row'>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={product?.main_image} />
                { order.name }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', textAlign: 'right' }}>
                x{order.quantity}<br/>
                ₹{(+order.quantity*+order.price).toString()}
            </div>
        </div>
    )
}

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
                    <hr/>
                    <input defaultValue={user.address} type='textarea' placeholder='enter your address here'/>
                </div>

                <div className='section'>
                    <h2>My Orders</h2>
                    <hr/>
                    <div className='order-list'>
                        {
                            orders.map ((order, i) => <OrderItem order={order} key={i}/>)
                        }
                    </div>
                </div>
                
                </>
                )
            }
        </div>
    )
}