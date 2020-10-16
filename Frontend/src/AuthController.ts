export default class AuthController {
    endpoint = "https://localhost:3001"
    /**
     * Login using username & password
     * If authenticated successfully, will store token automatically
     * @param {string} username 
     * @param {string} password 
     */
    async login (username: string, password: string) {
        const json = await this.fetchJSON ('/login', 'POST', {username, password})
        const accessToken = json.meta?.accessToken 
        const refreshToken = json.meta?.refreshToken
        if (!accessToken || !refreshToken) {
            throw new Error ('Invalid response received')
        }
        localStorage.setItem ('access-token', accessToken)
        localStorage.setItem ('access-token-expiry', json.meta.accessTokenExpiration)
        localStorage.setItem ('refresh-token', refreshToken)
    }
    async logout () {
        localStorage.removeItem ('access-token')
        localStorage.removeItem ('access-token-expiry')
        localStorage.removeItem ('refresh-token')
    }
    /** @returns {User} the current user*/
    user () {
        const accessToken = localStorage.getItem ('access-token')
        if (!accessToken) throw new Error ('access token not present')

        const comps = accessToken.split ('.')
        const str = Buffer.from (comps[1], 'base64').toString ('utf-8')
        const user = JSON.parse (str).user
        //console.log (user)
        return user
    }
    /** @returns {boolean} -- whether you're logged in or not */
    isLoggedIn () {
        return !!localStorage.getItem ('access-token') && localStorage.getItem ('refresh-token') 
    }
    /** @returns a valid access token */
    async getToken (forceNewToken: string) {
        const refreshToken = localStorage.getItem ('refresh-token')
        if (!refreshToken) throw new Error ('refresh token not present')

        const expiryDate = new Date (+(localStorage.getItem ('access-token-expiry') || 0) )

        // if it's been more than an hour, or we forcefully want to get a new token, or the access token is not present
        if (
            expiryDate.toString() === 'Invalid Date' || // if expiry is invalid
            (new Date().getTime()-expiryDate.getTime() > 0) ||  // if expired
            forceNewToken || // if force
            !localStorage.getItem ('access-token') // if access token is not present
        ) { 
            const json = await this.fetchJSON (
                '/oauth/token', 
                'POST', 
                {
                    refresh_token: refreshToken,
                    grant_type: 'user_refresh_token'
                }
            )
            if (!json.accessToken) {
                throw new Error (`Access token not present in ${JSON.stringify(json)}`)
            }
            localStorage.setItem ('access-token', json.accessToken)
            localStorage.setItem ('access-token-expiry', json.accessTokenExpiration) 
        } 
        return localStorage.getItem ('access-token')
    }
    /** utility function to fetch JSON from service */
    async fetchJSON (path: string, method: string, body: any) {
        const response = await fetch (new URL(path, this.endpoint).toString(), { 
            method, 
            body: JSON.stringify(body), 
            headers: { 'content-type': 'application/json' } 
        })
        const json = await response.json ()
        if (json.status === 'error') {
            console.error (json)
            throw new Error (json.message)
        }
        return json
    }
}