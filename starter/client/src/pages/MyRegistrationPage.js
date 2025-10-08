import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function MyRegistrationPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate = useNavigate();

  const submit = (e)=>{
    e.preventDefault();
    fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username,password})
    }).then(async res=>{
      const body = await res.json();
      if(res.status===201 && body.user){
        localStorage.setItem('currentUser', JSON.stringify(body.user));
        navigate('/portal');
      } else {
        setError(body.message || 'Could not register');
      }
    }).catch(e=>setError('Server error'));
  };

  return (
    <div className="card" style={{maxWidth:420,margin:'20px auto'}}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div style={{color:'black'}}>{error}</div>}
        <div style={{marginTop:12}}>
          <button type="submit">Create account</button>
        </div>
      </form>
    </div>
  )
}
