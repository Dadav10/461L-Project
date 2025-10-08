import React, {useState} from 'react';

export default function ForgotMyPassword(){
  const [username,setUsername]=useState('');
  const [message,setMessage]=useState('');
  const [isError,setIsError]=useState(false);
  const [submitting,setSubmitting]=useState(false);

  const submit = (e)=>{
    e.preventDefault();
    setMessage('');
    setIsError(false);
    if(!username){
      setIsError(true);
      setMessage('Username required');
      return;
    }

    setSubmitting(true);

    fetch('/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    }).then(async res => {
      setSubmitting(false);
      const body = await res.json().catch(()=>({}));
      if(res.status === 200){
        setIsError(false);
        setMessage(body.message || 'Lookup successful');
      } else if(res.status === 404){
        setIsError(true);
        setMessage('User not found');
      } else if(res.status === 400){
        setIsError(true);
        setMessage(body.message || 'Bad request');
      } else {
        setIsError(true);
        setMessage(body.message || `Lookup failed (status ${res.status})`);
      }
    }).catch(err=>{
      setSubmitting(false);
      setIsError(true);
      setMessage('Network error: ' + (err.message||err));
    });
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
        <div className={isError ? 'error-message' : 'success-message'} style={{marginTop:20}}>
          {message}
        </div>
      )}
    </div>
  )
}
