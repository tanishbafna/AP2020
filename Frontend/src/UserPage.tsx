import React, { useEffect, useState } from 'react'
import { FadeLoader } from 'react-spinners'
import AppController from "./AppController"
import { Order, User, ProductFull } from './Types'
import AwesomeDebouncePromise from "awesome-debounce-promise";
import useConstant from "use-constant";
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
                <a href={`/product/${order.asin}`}>{ order.name }</a>
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
        .catch (err => {})

        controller.orders ()
        .then (setOrders)
        .catch (err => {})
    }, [])

    const updateUserDebounced = useConstant (() => AwesomeDebouncePromise(
        (edit: { address?: string, name?: string }) => {
            console.log ('lol')
            controller.updateProfile (edit)
        }, 500)
    )

    return (
        <div className='user-page'>
            { !controller.isLoggedIn && <h1>Press the user icon to log in</h1> }
            { controller.isLoggedIn() && !user && <FadeLoader /> }
            {
                user && (
                <>
                <div className='header'>
                    <input defaultValue={user.name} className='h1' onChange={ e => updateUserDebounced({ name: (e.target as any).value }) } />
                    <span>{ jwt?.email }</span>
                </div>
                <hr/>
                <div className='section'>
                    <h2>My Address</h2>
                    <hr/>
                    <textarea rows={5} defaultValue={user.address} placeholder='enter your address here' onChange={ e => updateUserDebounced({ address: e.target.value }) }/>
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