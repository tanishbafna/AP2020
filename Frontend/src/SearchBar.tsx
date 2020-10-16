import React, { useContext, useEffect, useRef, useState } from 'react'
import AppController from './AppController'
import { Product } from './Types'
import { MoonLoader } from 'react-spinners'
import ReactStars from "react-rating-stars-component"
import AwesomeDebouncePromise from "awesome-debounce-promise";
import useConstant from "use-constant";
import { ReactComponent as Search } from './Images/Search.svg'
import { getSearchQ, StoreContext } from './Store'

export default () => {
    const controller = new AppController()
    const store = useContext (StoreContext)
    const [q, setQ] = useState ('')
    const [products, setProducts] = useState ([] as Product[])
    const [loading, setLoading] = useState (false)
    const [cancelledSearch, setCancelledSearch] = useState (false)
    const [productTaskCancel, setProductTaskCancel] = useState( (() => () => {}) )

    const setQDebounced = useConstant (() => AwesomeDebouncePromise(setQ, 450))

    const ref = useRef(null as any)

    const doFullSearch = (txt: string) => {
        setCancelledSearch (true)
        store.updateFilters(undefined, txt) 
    }

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
            const result = await controller.products (q, 1)
            if (cancelled) return
            setProducts (result?.products || [])
            setLoading (false)
        }
        task ()
    }, [ q ])

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target) && q) {
                setCancelledSearch (true)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [ ref, q ])


    return (
        <div className='search' >
            <div className='inner'>
                <input 
                    placeholder='Search for products...' 
                    defaultValue={getSearchQ() || ''}
                    onKeyDown={ e => {
                        if (e.key === 'Enter') {
                            doFullSearch ((e.target as any).value)
                        }
                    }}
                    onChange={e => {
                        setCancelledSearch (false)
                        setQDebounced(e.target.value)
                    }} />
                {
                    loading && !cancelledSearch && 
                    (<MoonLoader size='22px' />)
                }
                <button 
                    className='btn-transparent' 
                    onClick={ () => doFullSearch(q) }>
                    <Search style={{ height: '1.5rem', width: '1.5rem', fill: 'var(--color-primary-txt)' }} />
                </button>
            </div>
            
            {   products.length > 0 && !cancelledSearch &&
                <div className='menu' ref={ref}>
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