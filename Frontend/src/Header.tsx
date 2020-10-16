import React, { useEffect, useState } from 'react'
import { ReactComponent as Ham } from './Images/Ham.svg'
import './Header.css'
import AppController from './AppController'
import { Product } from './Types'

import AwesomeDebouncePromise from "awesome-debounce-promise";
import useConstant from "use-constant";

const SearchBar = () => {
    const controller = new AppController()
    const [q, setQ] = useState ('')
    const [products, setProducts] = useState ([] as Product[])

    const setQDebounced = useConstant (() => AwesomeDebouncePromise(setQ, 250))

    useEffect (() => {
        (async () => {
            if (!q) {
                setProducts ([])
                return
            }
            const results = await controller.search (q, 1)
            setProducts (results?.products || [])
        })()
    }, [ q ])

    return (
        <div className='search' >
            <input placeholder='Search for products...' onChange={e => setQDebounced(e.target.value)} />
            <div>
                
            </div>            
        </div>
    )
}

export default function (props: React.PropsWithChildren<{}>) {

    return (
        <div className='header'>
            <button className='btn-transparent'>
                <Ham style={{ height: '2.5rem', width: '2.5rem', fill: 'var(--color-secondary)' }} />
            </button>
            <SearchBar />
            <button className='btn-secondary' style={{height: '2.5rem'}}>
                Login
            </button>
        </div>
    )
}