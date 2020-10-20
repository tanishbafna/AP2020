
import React, { useContext } from 'react'
import './Categories.css'
import { getCurrentCategory, StoreContext } from './Store'

export default function () {
    const { categories, updateFilters } = useContext (StoreContext)
    const current = getCurrentCategory () || categories[0]?.category
    return (
        <div className='categories'>
            {
                categories.slice (0, 27).map (c => (
                    <div key={c.category} className={`category ${current === c.category ? 'selected' : ''}`} onClick={ () => updateFilters (c.category) }>
                        { c.name }
                    </div>
                ))
            }
        </div>
    )
}