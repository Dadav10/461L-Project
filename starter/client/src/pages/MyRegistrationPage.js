import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyRegistrationPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate = useNavigate();

  const submit = (e)=>{
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    if(users.find(u=>u.username===username)){
      setError('Username already exists');
      return;
    }
    const user = {username,password,projects:[]};
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user));
    navigate('/portal');
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
        {error && <div className="error-message">{error}</div>}
        <div style={{marginTop:20, textAlign:'center'}}>
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px'}}>
            Create Account
          </button>
        </div>
      </form>
    </div>
  )
}
