import React, { useContext, useEffect, useRef, useState } from 'react'
import {ReactComponent as CartIcon} from './Images/Cart.svg'
import { StoreContext } from './Store'
import { Product } from './Types'
import './Cart.css'

const CartItem = ({item}: { item: { quantity: number, product: Product } }) => {
    const { alterItemsInCart } = useContext (StoreContext)

    const deleteItem = () => {
        if (!window.confirm(`Are you sure you want to remove ${item.product.title.slice(0, 30)} from your cart?`)) return
        alterItemsInCart (item.product, -item.quantity)
    }

    return (
        <div className='item'>
            <button className='btn-close' onClick={ deleteItem }/>
            <img src={item.product.thumbnail} />

            <div className='inner'>
                <a href={'/product/' + item.product.asin }>{item.product.title}</a>
                <span className='quantity'> 
                    Quantity: <input defaultValue={item.quantity} type="number" name='quantity' step='1' onChange={ e => alterItemsInCart(item.product, +(e.target.value)-item.quantity) }/> 
                </span> 
            </div>
        </div>
    )
}

export default () => {
    const {cart} = useContext (StoreContext)
    const [openCart, setOpenCart] = useState (false)

    const cartLength = Object.values(cart).reduce ((t, q) => t = t+q.quantity, 0)

    const ref = useRef(null as any)

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target) && openCart) {
                setOpenCart (false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [ ref, openCart ])

    return (
        <div>
            <button className='btn-transparent' style={{height: '2.5rem'}} onClick={ () => setOpenCart(!openCart) }>
                <CartIcon style={{ fill: 'var(--color-secondary)' }}/>
                <div className='counter'>
                    { cartLength }
                </div>
            </button>
            <div className={`overlay ${ openCart ? 'open' : 'close' }`} onClick={ () => setOpenCart(false) }/>
            <div className={`cart-menu ${ openCart ? 'open' : 'close'}`}>
                <div className='cart-scroll'>
                {
                    Object.values (cart).map (item => (
                        <CartItem key={item.product.asin} item={item}/>
                    ))
                }
                </div>
                <button className='btn-tertiary' style={{height: '3.5rem'}}>
                    Checkout
                </button>
            </div>

        </div>
    )
}
