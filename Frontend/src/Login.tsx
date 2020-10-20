import React, { useRef } from 'react'
import AppController from './AppController'
import './Login.css'
import ProgressButton from './ProgressButton'

export default ({ open, dismiss }: { open: boolean, dismiss: () => void }) => {
    const controller = new AppController ()
    const emailRef = useRef (undefined as any)
    const passRef = useRef (undefined as any)
    const login = async () => {
        const email = emailRef.current.value as string
        const password = passRef.current.value as string

        if (!email) return window.alert ('Please enter your email!')
        if (!password) return window.alert ('Please enter your password!')

        await controller.login (
            email,
            password
        )
        dismiss ()
    }
    
    return (
        <div className={`overlay flex-center ${open ? 'open' : 'close'}`} onClick={dismiss}>
            <div className="card" onClick={ e => e.stopPropagation() }>
                <h1>LOGIN TO UMMAZONE</h1>
                <div className='inner'>
                    <input
                        className="form-item"
                        placeholder="Email..."
                        ref={emailRef}
                        type="text"/>
                    <input
                        className="form-item"
                        placeholder="Password..."
                        ref={passRef}
                        type="password"/>
                    <ProgressButton onClick={login} loaderColor='var(--color-secondary)' loaderType='beat' className="btn-tertiary"> 
                        LOGIN 
                    </ProgressButton>
                    <button className="btn-secondary"> REGISTER </button>
                </div>
            </div>
        </div>
    )
}