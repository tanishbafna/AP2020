import React, { useRef, useState, createContext, useEffect } from "react"
import querystring from 'querystring'
import AppController from "./AppController"
import { Product, Category, Cart, Review, Wishlist } from "./Types"
import { createBrowserHistory } from 'history'
const history = createBrowserHistory()

type StoreResult = {
    categories: Category[]
    products: Product[]
    hasMore: boolean
    isLoading: boolean
    openedProduct: string | undefined
    cart: Cart
    wishlist: Wishlist

    setOpenedProduct: (product: string) => void
    updateFilters: (category?: string, q?: string) => Promise<void> 
    fetchMoreProducts: () => Promise<void>
    alterItemsInCart: (p: Product, q?: number) => void
    alterItemsInWishlist: (p: Product, action: 'add' | 'remove') => void
    moveItemToWishlist: (p: Product) => void
}

export const getCurrentProduct = () => {
    const path = window.location.pathname.slice (1)
    const [ category, productID ] = path.split ('/')
    if (category !== 'product') return
    return productID
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

    const [openedProduct, _setOpenedProduct] = useState (getCurrentProduct())

    const [cart, setCart] = useState (controller.cart())
    const [wishlist, setWishlist] = useState (controller.wishlist())

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

    const alterItemsInCart = (product: Product, q: number = 1) => {
        const id = product.asin
        if (!cart[id]) cart[id] = { quantity: 0, product }
        cart[id].quantity += q

        if (cart[id].quantity <= 0) delete cart[id]

        controller.saveCart (cart)
        setCart ({ ...cart })
    }
    const alterItemsInWishlist = (product: Product, action: 'add' | 'remove') => {
        const id = product.asin
        if (action === 'add') wishlist[id] = product
        else delete wishlist[id]
        
        controller.saveWishlist (wishlist)
        setWishlist ({ ...wishlist })
    }
    const moveItemToWishlist = (product: Product) => {
        alterItemsInCart (product, -cart[product.asin].quantity)
        alterItemsInWishlist (product, 'add')
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
        openedProduct,
        setOpenedProduct: (product: string) => {
            _setOpenedProduct (product)
            history.push (`/product/${product}`)
        },
        updateFilters: (category?: string, q?: string) => {
            page.current = 1
            history.push (`/${category || getCurrentCategory() || ''}${ q ? `?q=${q}` : '' }`)
            setProducts ([])
            _setOpenedProduct (undefined)
            return fetchProducts ()
        },
        cart,
        wishlist,
        fetchMoreProducts: () => fetchProducts (products),
        alterItemsInCart,
        alterItemsInWishlist,
        moveItemToWishlist
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

export const useReviewsStore = (product: string) => {
    const controller = new AppController ()

    const [reviews, setReviews] = useState ([] as Review[])
    const [hasMore, setHasMore] = useState (true)
    
    const page = useRef (1)

    const fetchReviews = async (reviews: Review[] = []) => {
        const result = await controller.reviews (product, page.current)
        setReviews ([ ...(reviews || []), ...(result?.reviews || []) ])

        page.current = result.next_page
        setHasMore (result.reviews.length > 0)
    }

    useEffect (() => {
        fetchReviews ()
    }, [ product ])

    return {
        reviews,
        hasMore,
        fetchMoreReviews: () => fetchReviews (reviews),
    }
}
