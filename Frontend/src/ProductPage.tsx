import React, { useContext, useEffect, useState } from 'react'
import { StoreContext, useReviewsStore } from './Store'
import { Product, ProductFull } from './Types'
import ReactStars from "react-rating-stars-component"
import { FadeLoader } from 'react-spinners'
import './ProductPage.css'
import AppController from './AppController'
import { ProductButtons, ProductPrice, ProductPreview } from './Products'
import InfiniteScroll from 'react-infinite-scroll-component'

export default ({productID}: { productID: string }) => {
    const {alterItemsInCart, setOpenedProduct} = useContext (StoreContext)
    const { reviews, hasMore, fetchMoreReviews } = useReviewsStore (productID)
    const controller = new AppController ()

    const [similar, setSimilar] = useState ([] as Product[])
    const [product, setProduct] = useState (undefined as any as ProductFull)

    useEffect (() => {
        setProduct (undefined as any)
        controller.product (productID)
        .then (setProduct)
    }, [ productID ])

    useEffect (() => {
        setSimilar ([])

        if (product) {
            const title = product.title
            const q = title.split (' ').slice (0, 3).join (' ') // query with first few words

            controller.products (q)
            .then (r => setSimilar(r.products))
        }
    }, [ product ])

    return (
        <div className='product-full'>
            {
                !product && <FadeLoader />
            }
            {
                product && (
                    <div>
                        <div className='header'>
                            <span> <h2>{product.title}</h2> { product.item_available && <span>(In Stock)</span> } </span>
                            <div className='inner'>
                                <ProductPrice product={product}/>
                                <ProductButtons product={product}/>
                            </div>
                           
                        </div>
                        <div className='body'>
                            <img src={product.main_image} style={{ borderRadius: 'var(--border-radius)', height: '28rem' }}/>
                            <p>
                                <h3>About</h3>
                                { product.description.replace ('Read moreRead less', '') }
                            </p>
                        </div>

                        <div className='recommendations'>
                            <div className='header'>
                                <h2>More like this...</h2>
                            </div>
                            <div>
                                <div className='recommendation-list'>
                                    {
                                        similar.map (product => (
                                            <ProductPreview product={product} />
                                        ))
                                    }
                                </div>
                            </div>
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
