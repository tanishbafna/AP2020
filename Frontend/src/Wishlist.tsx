import React, { useContext, useEffect, useRef, useState } from 'react'
import {ReactComponent as WishlistIcon} from './Images/Wishlist.svg'
import { StoreContext } from './Store'
import { Product } from './Types'
import './Cart.css'

const WishlistItem = ({ product }: { product: Product } ) => {
    const { alterItemsInWishlist } = useContext (StoreContext)

    const deleteItem = () => {
        if (!window.confirm(`Are you sure you want to remove ${product.title.slice(0, 30)} from your wishlist?`)) return
        alterItemsInWishlist (product, 'remove')
    }

    return (
        <div className='item' >
            <button className='btn-close' onClick={ deleteItem }/>
            <img src={product.thumbnail} />

            <a href={`/product/${product.asin}`}>{product.title}</a>
        </div>
    )
}

export default () => {
    const {wishlist} = useContext (StoreContext)
    const [openCart, setOpenCart] = useState (false)

    const cartLength = Object.values(wishlist).length

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
                <WishlistIcon style={{ fill: 'var(--color-secondary)' }}/>
                {
                    cartLength > 0 &&
                    <div className='counter'>
                        { cartLength }
                    </div>
                }
            </button>
            <div className={`overlay ${ openCart ? 'open' : 'close' }`} onClick={ () => setOpenCart(false) }/>
            <div className={`cart-menu ${ openCart ? 'open' : 'close'}`}>
                <div className='cart-scroll'>
                {
                    Object.values (wishlist).map (item => (
                        <WishlistItem key={item.asin} product={item}/>
                    ))
                }
                </div>
            </div>

        </div>
    )
}
