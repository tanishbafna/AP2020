import React, { useContext, useEffect, useRef, useState } from 'react'
import { StoreContext, useReviewsStore } from './Store'
import { Product, ProductFull } from './Types'
import ReactStars from "react-rating-stars-component"
import { FadeLoader } from 'react-spinners'
import './ProductPage.css'
import AppController from './AppController'
import { ProductButtons, ProductPrice, ProductPreview } from './Products'
import InfiniteScroll from 'react-infinite-scroll-component'
import ProgressButton from './ProgressButton'
import { verifyRefs } from './Login'

export default ({productID}: { productID: string }) => {
    const { reviews, hasMore, fetchMoreReviews, insertReview } = useReviewsStore (productID)
    const controller = new AppController ()

    const [similar, setSimilar] = useState ([] as Product[])
    const [product, setProduct] = useState (undefined as any as ProductFull)

    const ratingRef = useRef ({ value: undefined } as { value?: number })
    const reviewTitleRef = useRef (undefined as any)
    const reviewContentRef = useRef (undefined as any)

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

            controller.products (q, 2)
            .then (r => setSimilar(r.products))
        }
    }, [ product ])

    const writeReview = async () => {
        if (!controller.isLoggedIn()) {
            return window.alert ('Please log in to write the review!')
        }
        const orders = await controller.orders ()
        if (!orders.find(o => o.asin === productID)) {
            return window.alert ('You haven\'t ordered this product. Please order before you write a review')
        }
        const data = verifyRefs ([
            { ref: ratingRef, key: 'rating' },
            { ref: reviewTitleRef, key: 'title' },
            { ref: reviewContentRef, key: 'review' }
        ])
        if (!data) return
        const review = await controller.addReview (productID, data as any)
        insertReview (review)
    }

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
                                            <ProductPreview key={product.asin} product={product} />
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        <div className='reviews'>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <ReactStars size={24} total={5} value={+product.reviews.rating} edit={false}/>
                                <h2 style={{marginLeft: '0.5rem'}}>Reviews ({ product.reviews.total_reviews })</h2>
                            </div>

                            <div className='main'>
                                <div className='review write-review'>
                                    <div className='header'>
                                        <span style={{display: 'flex', alignItems: 'center'}}>
                                            <ReactStars onChange={ (r: number) => ratingRef.current.value = r } style={{flexGrow: '1'}} size={24} total={5} edit={true}/>
                                            <input ref={reviewTitleRef} type='text' placeholder='title...'/>
                                        </span>
                                    </div>
                                    
                                    <textarea ref={reviewContentRef} rows={10} placeholder='write your review...'/>
                                    <br />
                                    <ProgressButton onClick={writeReview} className='btn-tertiary' loaderType='beat' loaderColor='var(--color-secondary)'>
                                        Write
                                    </ProgressButton>
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
