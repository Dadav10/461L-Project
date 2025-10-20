import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CHAR_MIN = 34;
const CHAR_MAX = 126;
const RING_LEN = CHAR_MAX - CHAR_MIN + 1;

function validInputs(text, N, D) {
    if (!Number.isInteger(N) || N < 1) return false;
    if (D !== 1 && D !== -1) return false;
    if (text === null || text === undefined) return false;
    for (const ch of text) {
        const code = ch.charCodeAt(0);
        if (ch === "!" || ch === " " || code < CHAR_MIN || code > CHAR_MAX) {
            return false;
        }
    }
    return true;
}

function encrypt(inputText, N, D) {
    if (!validInputs(inputText, N, D)) {
        throw new Error("Invalid input to encrypt");
    }
    const shift = N * D;
    const rev = [...inputText].reverse().join('');
    return [...rev].map(ch => 
        String.fromCharCode(CHAR_MIN + ((ch.charCodeAt(0) - CHAR_MIN + shift) % RING_LEN))
    ).join('');
}

function findUserByUsername(username){
  const users = JSON.parse(localStorage.getItem('users')||'[]');
  return users.find(u=>u.username===username);
}

export default function MyLoginPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate = useNavigate();

  const submit = (e)=>{
    e.preventDefault();
    const user = findUserByUsername(username);
    if(!user){
      setError('Invalid credentials');
      return;
    }
    try{
      const enc = encrypt(password,3,1);
      if(enc === user.password){
        localStorage.setItem('currentUser', JSON.stringify(user));
        navigate('/portal');
        return;
      }
    }catch(err){
      // fallthrough to error
    }
    setError('Invalid credentials');
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