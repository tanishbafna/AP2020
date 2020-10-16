import React, { useRef, useState, createContext } from "react"
import AwesomeDebouncePromise from "awesome-debounce-promise";
import useConstant from "use-constant";
import AppController from "./AppController"
import { Product } from "./Types"

const useStore = () => {
    const controller = new AppController ()

    const [products, setProducts] = useState ([] as Product[])
    const [hasMore, setHasMore] = useState (true)
    const [isLoading, setIsLoading] = useState (false)

    const [filters, _setFilters] = useState({ q: undefined, category: undefined } as { q?: string, category?: string })
    const setFilters = useConstant (() => AwesomeDebouncePromise((alt: { q?: string, category?: string }) => _setFilters({ ...filters, ...alt }), 250))
    
    const page = useRef (1)

    const fetchProducts = async (products?: Product[]) => {
        setIsLoading (true)

        const result = await controller.home (page.current)
        setProducts ([ ...(products || []), ...result.products ])

        page.current = result.next_page
        setHasMore (!!result.next_page)

        setIsLoading (false)
    }

    return {
        products,
        hasMore,
        isLoading,
        setFilters,
        fetchMoreProducts: () => fetchProducts (products)
    }
}
export const StoreContext = createContext ({})

export const StoreContextMaker = (props: React.PropsWithChildren<{}>) => {
    const store = useStore ()

    return (
        <StoreContext.Provider value={store}>
            { props.children }
        </StoreContext.Provider>
    )
}
