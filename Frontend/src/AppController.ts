import { Cart, Category, JWT, ProductFull, ProductResult, ReviewResult, Wishlist, User, Order, Product } from "./Types"
import querystring from 'querystring'
import * as Firebase from 'firebase'

const ACCESS_TOKEN_KEY = 'um-access-token'

export default class AppController {
    endpoint = 'http://localhost:5000/api/'

    async products (q?: string, page: number = 1, category?: string) {
        const qStr = querystring.encode({ q, 'page-number': page, category })
        const results = await this.fetchJSON ('?' + qStr, 'GET')
        return results as ProductResult
    }
    async product (asin: string) {
        const result = await this.fetchJSON ('product/' + asin, 'GET')
        return result as ProductFull
    }
    async reviews (asin: string, page: number = 1) {
        const result = await this.fetchJSON ('reviews/' + asin + '?page-number=' + page, 'GET')
        return result as ReviewResult
    }
    async categories () {
        const results = await this.fetchJSON ('categories', 'GET') as Category[]
        results.forEach (r => r.name = r.name.replace ('Amazon', 'Ummazone'))
        return results 
    }
    async orders () {
        const results = await this.fetchJSON ('cart/orders', 'GET', undefined, true) as Order[]
        return results || []
    }
    async addOrder (product: Product, quantity: number) {
        await this.fetchJSON (
            'cart',
            'PUT',
            {
                asin: product.asin,
                status: 'orders',
                name: product.title,
                price: product.price.current_price,
                quantity
            },
            true
        )
    }
    async profile () {
        const user = await this.fetchJSON ('profile', 'GET', undefined, true)
        return user as User
    }
    async updateProfile (edit: { address?: string, name?: string }) {
        const user = await this.fetchJSON ('profile', 'PATCH', edit, true)
        return user as User
    }
    async login (email: string, password: string) {
        const { idToken } = await this.postForm ('login', { email, password })
        localStorage.setItem (ACCESS_TOKEN_KEY, idToken)
        return idToken as string
    }
    async loginGoogle () {
        const auth = new Firebase.auth.GoogleAuthProvider ()
        const result = await Firebase.auth().signInWithPopup (auth)

        const token = (result.credential as any)['idToken']
        localStorage.setItem (ACCESS_TOKEN_KEY, token)
    }
    async signup (data: { name: string, password: string, email: string, address?: string }) {
        const { idToken } = await this.postForm ('signup', { ...data, address: data.address || '' })
        localStorage.setItem (ACCESS_TOKEN_KEY, idToken)
        return idToken as string
    }

    isLoggedIn () {
        try {
            const token = localStorage.getItem (ACCESS_TOKEN_KEY)
            this.user (token)
            return true
        } catch (error) {
            console.log (error)
            return false
        }
    }

    cart (): Cart {
        const items = localStorage.getItem ('cart')
        if (!items) return {}

        return JSON.parse (items)
    }
    saveCart (cart: Cart) {
        localStorage.setItem ('cart', JSON.stringify(cart))
    }
    wishlist (): Wishlist {
        const items = localStorage.getItem ('wishlist')
        if (!items) return {}

        return JSON.parse (items)
    }
    saveWishlist (cart: Wishlist) {
        localStorage.setItem ('wishlist', JSON.stringify(cart))
    }
    getUser () {
        try {
            return this.user ( localStorage.getItem(ACCESS_TOKEN_KEY) )
        } catch {}
    }
    private async postForm (path: string, body: { [k: string]: string }) {
        const form = new FormData ()
        Object.keys (body).forEach (k => form.append (k, body[k]))
        
        const response = await fetch (new URL(path, this.endpoint).toString(), {
            method: 'POST', 
            body: form, 
            headers: { 
                'accept': 'application/json',
            } 
        })
        const text = await response.text()
        if (response.status >= 400) {
            throw new Error (text)
        }
        const json = JSON.parse (text)
        return json
    }
    /** utility function to fetch JSON from service */
    private async fetchJSON (path: string, method: string, body?: any, requireAuthentication = false) {
        const auth: { [k: string]: string } = {}
        if (requireAuthentication) {
            const token = localStorage.getItem (ACCESS_TOKEN_KEY)
            this.user (token)
            
            auth['authorization'] = `Bearer ${token}`
        }
        const response = await fetch (new URL(path, this.endpoint).toString(), {
            method, 
            body: body && JSON.stringify(body), 
            headers: { 
                'content-type': 'application/json',
                'accept': 'application/json',
                ...auth
            } 
        })
        const text = await response.text()
        if (!text) return

        const json = JSON.parse (text)
        if (json.error) {
            console.error (json)
            throw new Error (json.error || json.message)
        }
        return json
    }
    private user (accessToken: string | null) {
        if (!accessToken) throw new Error ('access token not present')

        const comps = accessToken.split ('.')
        const str = Buffer.from (comps[1], 'base64').toString ('utf-8')
        const user = JSON.parse (str) as JWT

        if ((new Date().getTime()/1000)-user.exp > 0) {
            throw new Error ('JWT expired')
        }
        return user
    }
}