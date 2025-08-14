import React from 'react';
import Image from '../assets/IMAGE.png';
import './user.css';



// export default function User() {
//     return (
//         <>
//             <div className="user-container">
//                 <img src={Image} alt="User Avatar" className="user-avatar" />
//                 <div className="user-info">
//                     <h4 className="user-name">Aarav Raj</h4>
//                     <p className="user-bio">Lorem ipsum dolor sit .</p>
//                 </div>
//             </div>
//         </>
//     )
// }



export default function User({ image, name, LastMessage, onClick }) {
    return (
        <>
            <div className="user-container" onClick={onClick}>
                <img src={image} alt="User Avatar" className="user-avatar" />
                <div className="user-info">
                    <h4 className="user-name">{name}</h4>
                    <p className="user-bio">{LastMessage}</p>
                </div>
            </div>
        </>
    );
}