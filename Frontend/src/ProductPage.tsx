import React, { useContext, useEffect, useState } from 'react'
import { StoreContext, useReviewsStore } from './Store'
import { ProductFull } from './Types'
import ReactStars from "react-rating-stars-component"
import { FadeLoader } from 'react-spinners'
import './ProductPage.css'
import AppController from './AppController'
import { ProductButtons, ProductPrice } from './Products'
import InfiniteScroll from 'react-infinite-scroll-component'

export default ({productID}: { productID: string }) => {
    const {alterItemsInCart, setOpenedProduct} = useContext (StoreContext)
    const { reviews, hasMore, fetchMoreReviews } = useReviewsStore (productID)
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
                        <div className='body'>
                            <img src={product.main_image} style={{ borderRadius: 'var(--border-radius)' }}/>
                            { product.images[1] && <img src={product.images[1]}/> }
                            <p>
                                <h3>About</h3>
                                { product.description }
                            </p>
                        </div>

                        <div className='reviews'>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <ReactStars size={24} total={5} value={product.reviews.rating} edit={false}/>
                                <h2 style={{marginLeft: '0.5rem'}}>Reviews ({ product.reviews.total_reviews })</h2>
                            </div>

                            <div className='main'>
                                <div className='review write-review'>
                                    <div className='header'>
                                        <span style={{display: 'flex', alignItems: 'center'}}>
                                            <ReactStars style={{flexGrow: '1'}} size={24} total={5} edit={true}/>
                                            <input type='text' placeholder='title...'/>
                                        </span>
                                    </div>
                                    
                                    <input type='textarea' placeholder='write your review...'/>
                                    <br />
                                    <button className='btn-tertiary'>
                                        Write
                                    </button>
                                </div>

                                <hr/>
                                <InfiniteScroll
                                    dataLength={reviews.length}
                                    next={fetchMoreReviews}
                                    hasMore={hasMore}
                                    loader={<FadeLoader />}
                                    >
                                    {
                                        reviews.map (review => (
                                            <div className='review' key={review.id}>
                                                <div className='header'>
                                                    <span style={{display: 'flex', alignItems: 'center'}}>
                                                        <ReactStars total={5} value={review.rating} edit={false}/>
                                                        <h3 style={{marginLeft: '0.5rem'}}>{review.title}</h3>
                                                    </span>
                                                    
                                                    <span>{review.name}</span>
                                                </div>
                                                <p className='content'>
                                                    { review.review }
                                                </p>
                                                <p className='footer'>
                                                    { review.review_data }
                                                </p>
                                            </div>
                                        ))
                                    }
                                </InfiniteScroll> 
                            </div>

                        </div>
                    </div>
                )
            }
        </div>
    )
}
