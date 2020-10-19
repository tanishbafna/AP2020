import React, { useContext, useEffect, useState } from 'react'
import { StoreContext } from './Store'
import { ProductFull } from './Types'
import ReactStars from "react-rating-stars-component"
import { FadeLoader } from 'react-spinners'
import './ProductPage.css'
import AppController from './AppController'
import { ProductButtons, ProductPrice } from './Products'

export default ({productID}: { productID: string }) => {
    const {alterItemsInCart, setOpenedProduct} = useContext (StoreContext)
    const controller = new AppController ()
    const [product, setProduct] = useState (undefined as any as ProductFull)

    useEffect (() => {
        controller.product (productID)
        .then (setProduct)
    }, [])

    return (
        <div className='product-full'>
            {
                !product && <FadeLoader />
            }
            {
                product && (
                    <div>
                        <div className='header'>
                            <h2>{product.title}</h2>
                            <div className='inner'>
                                <ProductPrice product={product}/>
                                <ProductButtons addToCart={ () => {} } buyNow={ () => {} }/>
                            </div>
                           
                        </div>
                        
                    </div>
                )
            }
        </div>
    )
}
