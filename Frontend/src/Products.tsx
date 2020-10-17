import React, { useContext } from 'react'
import { StoreContext } from './Store'
import { Product } from './Types'
import InfiniteScroll from 'react-infinite-scroll-component'
import ReactStars from "react-rating-stars-component"
import { FadeLoader } from 'react-spinners'

import './Products.css'

const ProductPreview = ({product}: { product: Product }) => {
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
                    <span className='product-title'>{ product.title.slice(0, 50) }</span>
                    <ReactStars total={5} value={product.reviews.rating} edit={false}/>
                </div>
                <div>
                    ₹{ product.price.current_price } 
                    &nbsp;{ product.price.discounted && <span style={{ textDecoration: 'line-through', color: 'gray', fontStyle: 'italic' }}>₹{ product.price.before_price }</span> }
                </div>
                
                <div className='inner2'> 
                    <button className='btn btn-tertiary'>
                        Buy Now
                    </button> 
                    <button className='btn btn-secondary'>
                        Add to Cart
                    </button> 
                </div>
            </div>
        </div>
    )
}

export default () => {
    const { products, isLoading, fetchMoreProducts, hasMore } = useContext (StoreContext)
    
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