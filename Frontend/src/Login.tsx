import React, { MutableRefObject, Ref, useRef, useState } from 'react'
import AppController from './AppController'
import ProgressButton from './ProgressButton'
import './Login.css'

export default ({ open, dismiss }: { open: boolean, dismiss: () => void }) => {
    const controller = new AppController ()
    const emailRef = useRef (undefined as any)
    const passRef = useRef (undefined as any)
    const nameRef = useRef (undefined as any)
    const addrRef = useRef (undefined as any)

    const [openedRegister, setOpenedRegister] = useState (false)

    const verifyRefs = (refs: { ref: MutableRefObject<any>, key: string }[]) => {
        let values: {[k: string]: string} = {}
        for (let ref of refs) {
            const value = ref.ref.current.value as string
            if (!value) return window.alert (`Please enter your ${ref.key}!`)
            values[ref.key] = value
        }
        return values
    }

    const login = async () => {
        const vals = verifyRefs ([ { ref: emailRef, key: 'email' }, { ref: passRef, key: 'password' } ])
        if (!vals) return 

        await controller.login (
            vals.email,
            vals.password
        )
        dismiss ()
    }
    const register = async () => {
        setOpenedRegister (true)
        if (!openedRegister) return
            
        const vals = verifyRefs ([ 
            { ref: emailRef, key: 'email' }, 
            { ref: passRef, key: 'password' },
            { ref: nameRef, key: 'name' },
            { ref: addrRef, key: 'address' } 
        ])
        if (!vals) return 
        console.log (vals)
        await controller.signup (vals as any)

        dismiss ()
    }

    const loginWithGoogle = async () => {
        await controller.loginGoogle ()
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
                    
                    {
                        openedRegister ?
                        <>
                        <input
                            className="form-item"
                            placeholder="Name..."
                            ref={nameRef}
                            type="text"/>
                        <input
                            className="form-item"
                            placeholder="Address..."
                            ref={addrRef}
                            style={{ height: '4rem' }}
                            type="textarea"/>
                        </> :
                        <>
                        <ProgressButton onClick={login} loaderColor='var(--color-secondary)' loaderType='beat' className="btn-tertiary"> 
                            Login 
                        </ProgressButton>

                        <ProgressButton onClick={loginWithGoogle} loaderColor='var(--color-secondary)' loaderType='beat' className="btn-tertiary"> 
                            Login with Google
                        </ProgressButton>
                        </>
                    }

                    <ProgressButton onClick={register} loaderColor='var(--color-primary)' loaderType='beat' className="btn-secondary">
                        Register
                    </ProgressButton>
                </div>
            </div>
        </div>
    )
}