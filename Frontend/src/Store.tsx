import React, { useRef, useState, createContext, useEffect } from "react"
import querystring from 'querystring'
import AppController from "./AppController"
import { Product, Category } from "./Types"
import { createBrowserHistory } from 'history'
const history = createBrowserHistory()

type StoreResult = {
    categories: Category[]
    products: Product[]
    hasMore: boolean
    isLoading: boolean
    updateFilters: (category?: string, q?: string) => Promise<void> 
    fetchMoreProducts: () => Promise<void>
}

export const getCurrentCategory = () => {
    const path = window.location.pathname.slice (1)
    const [ category ] = path.split ('/')
    return category
}
export const getSearchQ = () => {
    const search = window.location.search.slice(1)
    if (search) {
        const { q } = querystring.decode(search)
        return q as string
    }
    return ''
}

const useStore = () => {
    const controller = new AppController ()

    const [categories, setCategories] = useState ([] as Category[])

    const [products, setProducts] = useState ([] as Product[])
    const [hasMore, setHasMore] = useState (true)
    const [isLoading, setIsLoading] = useState (false)
    
    const page = useRef (1)

    const fetchProducts = async (products?: Product[]) => {
        setIsLoading (true)

        const result = await controller.products (getSearchQ(), page.current, getCurrentCategory())
        setProducts ([ ...(products || []), ...(result?.products || []) ])

        page.current = result.next_page
        setHasMore (!!result.next_page)

        setIsLoading (false)
    }
    const fetchCategories = async () => {
        const result = await controller.categories ()
        setCategories (result)
    }

    useEffect (() => {
        fetchCategories ()
        fetchProducts ()
    }, [])
    return {
        categories,
        products,
        hasMore,
        isLoading,
        updateFilters: (category?: string, q?: string) => {
            page.current = 1
            history.push (`/${category || getCurrentCategory() || ''}${ q ? `?q=${q}` : '' }`)
            setProducts ([])
            return fetchProducts ()
        },
        fetchMoreProducts: () => fetchProducts (products)
    }
}
export const StoreContext = createContext ({} as StoreResult)

export const StoreContextMaker = (props: React.PropsWithChildren<{}>) => {
    const store = useStore ()

    return (
        <StoreContext.Provider value={store}>
            { props.children }
        </StoreContext.Provider>
    )
}
