import React, { useState } from 'react'
import { BeatLoader, RotateLoader } from 'react-spinners'

export default (props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & { loaderColor: string, loaderType: 'spinner' | 'beat' }) => {
    const [working, setWorking] = useState (false)
    const work = async (e: any) => {
        setWorking (true)
        try {
            props.onClick && await props.onClick (e)
        } catch (error) {
            window.alert ('An Error Occurred!\n' + error.message)
        }
        setWorking (false)
    }
    return (
        <button {...props} disabled={working} onClick={work} style={{position: 'relative'}}> 
            <div style={{ opacity: working ? '0' : '1', transition: '0.2s opacity' }}>
                { props.children }
            </div>
            {
                working && (
                    <div style={{ position: 'absolute', left: '0', right: '0', top: '20%', bottom: '0' }}>
                        {
                            props.loaderType === 'spinner' ?
                            <RotateLoader  color={props.loaderColor} size='5px'/> :
                            <BeatLoader color={props.loaderColor} size='10px'/>
                        }
                    </div>
                )
            }
        </button>
    )
}