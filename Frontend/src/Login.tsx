import React from 'react'
import './Login.css'

export default () => {

    return (
        <div className='overlay login-overlay open'>
            <div className="card">
            <h1>Login</h1>
                <form>
                    <input
                        className="form-item"
                        placeholder="Username goes here..."
                        name="username"
                        type="text"
                        />
                    <input
                        className="form-item"
                        placeholder="Password goes here..."
                        name="password"
                        type="password"
                    />
                    <button className="form-submit"> LOGIN </button>
                    <button className="form-submit"> REGISTER </button>
                </form>
            </div>
        </div>
    )
}