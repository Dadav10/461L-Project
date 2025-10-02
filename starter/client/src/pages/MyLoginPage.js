import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';

function findUser(username, password){
  const users = JSON.parse(localStorage.getItem('users')||'[]');
  return users.find(u=>u.username===username && u.password===password);
}

export default function MyLoginPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate = useNavigate();

  const submit = (e)=>{
    e.preventDefault();
    const user = findUser(username,password);
    if(user){
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate('/portal');
    } else {
      setError('Invalid credentials');
    }
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
