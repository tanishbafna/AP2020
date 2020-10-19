import React, { useContext } from 'react'
import { StoreContext } from './Store'
import { Product } from './Types'
import InfiniteScroll from 'react-infinite-scroll-component'
import ReactStars from "react-rating-stars-component"
import { FadeLoader } from 'react-spinners'
import './Products.css'
import ProductPage from './ProductPage'

export const ProductPrice = ({product}: { product: Product }) => (
    <div className='price-display'>
        ₹{ product.price.current_price } 
        &nbsp;{ product.price.discounted && <span className='cancelled-price'>₹{ product.price.before_price }</span> }
    </div>
)
export const ProductButtons = (props: { addToCart: () => void, buyNow: () => void }) => (
    <>
    <button className='btn btn-tertiary' onClick={ props.buyNow }>
        Buy Now
    </button> 
    <button className='btn btn-secondary' onClick={ props.addToCart }>
        Add to Cart
    </button> 
    </>
)

const ProductPreview = ({product}: { product: Product }) => {
    const {alterItemsInCart, setOpenedProduct} = useContext (StoreContext)

    return (
        <div className='product-preview'>
            {
                product.price.savings_percent > 0 &&
                <div className='savings'>
                    SAVE {Math.round(product.price.savings_percent)}%
                </div>
            }
            <img src={ product.thumbnail } />
            <div className='inner'>
                <div className='inner2'>
                    <span className='product-title' onClick={ () => setOpenedProduct(product.asin) }>{ product.title.slice(0, 50) }</span>
                    <ReactStars style={{flexGrow: '1'}} total={5} value={product.reviews.rating} edit={false}/>
                </div>
                
                <ProductPrice product={product}/>
                <div className='inner2'> 
                    <ProductButtons addToCart={ () => alterItemsInCart (product, 1) } buyNow={ () => {} }/>
                </div>
            </div>
        </div>
    )
}

export default () => {
    const { products, isLoading, fetchMoreProducts, hasMore, openedProduct } = useContext (StoreContext)
    
    if (openedProduct) {
        return <ProductPage productID={openedProduct}/>
    }
    
    return (
        <div className='products' id='product-list'>
            <InfiniteScroll
                scrollableTarget='product-list'
                dataLength={products.length}
                next={fetchMoreProducts}
                hasMore={hasMore}
                loader={undefined}
                >
                {
                    products.map (product => (
                        <ProductPreview key={product.asin} product={product} />
                    ))
                }
            </InfiniteScroll> 
            {  
                isLoading && <FadeLoader />
            }
        </div>
    )
}