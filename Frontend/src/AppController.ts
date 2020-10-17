import { Category, ProductResult } from "./Types"
import querystring from 'querystring'

export default class AppController {
    endpoint = 'http://localhost:5000'

    async products (q?: string, page: number = 1, category?: string) {
        const qStr = querystring.encode({ q, 'page-number': page, category })
        const results = await this.fetchJSON ('/?' + qStr, 'GET')
        return results as ProductResult
    }
    async categories () {
        const results = await this.fetchJSON ('/categories', 'GET') as Category[]
        results.forEach (r => r.name = r.name.replace ('Amazon', 'Ummazone'))
        return results 
    }

    /** utility function to fetch JSON from service */
    async fetchJSON (path: string, method: string, body?: any) {
        const response = await fetch (new URL(path, this.endpoint).toString(), {
            method, 
            body: body && JSON.stringify(body), 
            headers: { 
                'content-type': 'application/json',
                'authorization': `Bearer 1234`,
                'accept': 'application/json',
                'cache-control': 'none'
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
}