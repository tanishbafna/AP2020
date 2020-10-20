import React, { useEffect, useRef, useState } from 'react'
import { CartItem, Product } from './Types'
import './CheckoutPage.css'
import ProgressButton from './ProgressButton'
import AppController from './AppController'
import Login from './Login'

export default (props: { cart: CartItem[], dismiss: (checkedOut: boolean) => void }) => {
    const controller = new AppController ()
    const [cart, setCart] = useState (JSON.parse(JSON.stringify(props.cart)) as CartItem[])
    const [openedLogin, setOpenedLogin] = useState (false)
    const total = Object.values (cart).reduce ((total, item) => total + item.quantity*item.product.price.current_price, 0)

    const buttonRef = useRef (undefined as any)

    useEffect (() => {
        setCart(JSON.parse(JSON.stringify(props.cart)))
    }, [ props.cart ])

    const placeOrders = async () => {
        if (!controller.isLoggedIn()) {
            setOpenedLogin (true)
            return
        }

        await Promise.all (
            cart.map (item => (
                controller.addOrder (item.product, item.quantity)
            ))
        )
        
        window.alert ('Orders placed successfully!\nAn elf will deliver them soon.')
        props.dismiss (true)
    }

    return (
        <div className='overlay flex-center' onClick={ () => props.dismiss(false) }>
            <Login open={openedLogin} dismiss={ () => { setOpenedLogin(false); if (controller.isLoggedIn()) buttonRef.current.onClick() } }/>
            <div className='checkout' onClick={ e => e.stopPropagation() }>
                <h1>Checkout</h1>
                <hr/>
                <div className='cart-scroll'>
                    {
                        cart.map (item => (
                            <div className='item' key={item.product.asin}>
                                <img src={item.product.thumbnail} />

                                <div className='inner'>
                                    <a href={'/product/' + item.product.asin }>{item.product.title}</a>
                                    <div className='inner2'>
                                        <span className='quantity'> 
                                            Quantity: 
                                            <input 
                                                defaultValue={item.quantity} 
                                                type="number" 
                                                name='quantity' 
                                                step='1' 
                                                onChange={ e => { item.quantity = +(e.target.value); setCart([...cart]) } }/>
                                        </span> 
                                    </div>
                                    
                                </div>
                            </div>
                        ))
                    }
                </div>
                <hr/>
                <span className='checkout-total'>
                    Total: ₹{ total }
                </span>
                <ProgressButton ref={buttonRef} className='btn-tertiary' onClick={ placeOrders } loaderType='beat' loaderColor='white'>
                    Place Order
                </ProgressButton>
            </div>
        </div>
    )
}