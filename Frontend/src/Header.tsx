

import React, { useEffect, useState } from 'react'
import { ReactComponent as Search } from './Images/Search.svg'
import './Header.css'
import AppController from './AppController'
import { Product, ProductResult } from './Types'
import { MoonLoader } from 'react-spinners'
import ReactStars from "react-rating-stars-component"
import AwesomeDebouncePromise from "awesome-debounce-promise";
import useConstant from "use-constant";

const SearchBar = () => {
    const controller = new AppController()
    const [q, setQ] = useState ('')
    const [products, setProducts] = useState ([] as Product[])
    const [loading, setLoading] = useState (false)
    const [productTaskCancel, setProductTaskCancel] = useState( (() => () => {}) )

    const setQDebounced = useConstant (() => AwesomeDebouncePromise(setQ, 450))

    useEffect (() => {
        productTaskCancel()
        if (!q) {
            setProducts ([])
            setLoading (false)
            return
        }

        setLoading (true)
        
        let cancelled = false
        const cancel = () => { cancelled = true }
        
        setProductTaskCancel (() => cancel)
        
        const task = async () => {
            const result = await controller.search (q, 1)
            if (cancelled) return
            setProducts (result?.products || [])
            setLoading (false)
        }
        task ()
    }, [ q ])

    return (
        <div className='search' >
            <div className='inner'>
                <input placeholder='Search for products...' onChange={e => setQDebounced(e.target.value)} />
                {
                    loading && 
                    (<MoonLoader size='22' />)
                }
                <button className='btn-transparent'>
                    <Search style={{ height: '1.5rem', width: '1.5rem', fill: 'var(--color-primary-txt)' }} />
                </button>
            </div>
            
            {   products.length > 0 &&
                <div className='menu'>
                    {
                        products.slice (0, 6).map (product => (
                            <div className='item'>
                                <div className='inner'>
                                    <img src={ product.thumbnail } />
                                    { product.title }
                                </div>
                                <ReactStars count={5} edit='false' value={product.reviews.rating} />
                            </div>
                        ))
                    }
                </div>    
            }    
        </div>
    )
}

export default function (props: React.PropsWithChildren<{}>) {

    return (
        <div className='header'>
            <span style={{color: 'var(--color-secondary)', fontWeight: 'bold'}}>
                UMMAZONE
            </span>
            <SearchBar />
            <button className='btn-secondary' style={{height: '2.5rem'}}>
                Login
            </button>
        </div>
    )
}