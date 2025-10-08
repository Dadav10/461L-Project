import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function MyLoginPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate = useNavigate();

  const submit = (e)=>{
    e.preventDefault();
    setError('');
    if(!username || !password){
      setError('Username and password required');
      return;
    }

    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(async res => {
      if(res.status === 200){
        const body = await res.json().catch(()=>null);
        if(body && body.user){
          try{ localStorage.setItem('currentUser', JSON.stringify(body.user)); }catch(e){}
        }
        navigate('/portal');
      } else if(res.status === 401){
        setError('Invalid credentials');
      } else {
        const body = await res.json().catch(()=>({}));
        setError(body.message || `Login failed (status ${res.status})`);
      }
    }).catch(err=>{
      setError('Network error: '+(err.message||err));
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
        {error && <div className="error-message">{error}</div>}
        <div style={{marginTop:20, textAlign:'center'}}>
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px'}}>
            Sign In
          </button>
        </div>
      </form>
      <div style={{marginTop:20, textAlign:'center'}}>
        <Link to="/forgot" className="btn-link">Forgot password?</Link>
      </div>
    </div>
  )
}
