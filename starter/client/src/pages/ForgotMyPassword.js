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
        <div style={{marginTop:20, textAlign:'center'}}>
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px'}}>
            Lookup Password
          </button>
        </div>
      </form>
      {message && (
        <div className={message.includes('not found') ? 'error-message' : 'success-message'} style={{marginTop:20}}>
          {message}
        </div>
      )}
    </div>
  )
}
