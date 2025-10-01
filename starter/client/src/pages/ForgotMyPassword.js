import React, {useState} from 'react';

export default function ForgotMyPassword(){
  const [username,setUsername]=useState('');
  const [message,setMessage]=useState('');

  const submit = (e)=>{
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const u = users.find(x=>x.username===username);
    if(u) setMessage('Your password is: ' + u.password + ' (local demo)');
    else setMessage('User not found');
  };

  return (
    <div className="card" style={{maxWidth:420,margin:'20px auto'}}>
      <h2>Forgot Password</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div style={{marginTop:8}}>
          <button type="submit">Lookup</button>
        </div>
      </form>
      {message && <div style={{marginTop:12}}>{message}</div>}
    </div>
  )
}
