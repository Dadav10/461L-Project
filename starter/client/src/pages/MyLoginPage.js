import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

async function apiLogin(username, password){
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({username,password})
  });
  return res.json().then(j=>({status: res.status, body: j}));
}

export default function MyLoginPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate = useNavigate();

  const submit = (e)=>{
    e.preventDefault();
    apiLogin(username,password).then(r=>{
      if(r.status===200 && r.body.user){
        localStorage.setItem('currentUser', JSON.stringify(r.body.user));
        navigate('/portal');
      } else {
        setError(r.body.message || 'Invalid credentials');
      }
    }).catch(e=>{
      setError('Server error');
    });
  };

  return (
    <div className="card" style={{maxWidth:420,margin:'20px auto'}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Username</label>
          <input className="input-medium" value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input className="input-medium" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div style={{color:'black'}}>{error}</div>}
        <div style={{marginTop:12}}>
          <button type="submit">Login</button>
        </div>
      </form>
      <div style={{marginTop:12}}>
        <Link to="/forgot">Forgot password?</Link>
      </div>
    </div>
  )
}
