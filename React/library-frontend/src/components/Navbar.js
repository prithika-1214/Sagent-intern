import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = ({ role }) => {
    const { logout } = useContext(AuthContext);
    return (
        <div style={{background: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            <h2 style={{margin: 0, color: '#333'}}>College Portal <span style={{fontSize:'0.8rem', background:'#eee', padding:'2px 8px', borderRadius:'4px'}}>{role}</span></h2>
            <button onClick={logout} style={{background:'#ef4444', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>Logout</button>
        </div>
    );
};
export default Navbar;