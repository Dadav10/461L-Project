import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyRegistrationPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const navigate = useNavigate();

  const submit = (e)=>{
    e.preventDefault();
    setError('');
    if(!username || !password){
      setError('Username and password are required');
      return;
    }

    setSubmitting(true);

    fetch('/add_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    }).then(async res => {
      setSubmitting(false);
      if(res.status === 201){
        // Registration successful. Save returned user/token so the portal can use it.
        const body = await res.json().catch(()=>null);
        if(body && body.user){
          try{
            localStorage.setItem('currentUser', JSON.stringify(body.user));
          }catch(e){
            // ignore localStorage failures
          }
        }
        navigate('/portal');
      } else if(res.status === 409){
        setError('Username already exists');
      } else {
        const body = await res.json().catch(()=>({}));
        setError(body.message || `Registration failed (status ${res.status})`);
      }
    }).catch(err=>{
      setSubmitting(false);
      setError('Network error: ' + (err.message||err));
    });
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
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px'}} disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  )
}
