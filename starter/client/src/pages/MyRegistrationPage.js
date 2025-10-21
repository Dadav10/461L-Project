import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyRegistrationPage(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [securityQuestion,setSecurityQuestion]=useState('');
  const [securityAnswer,setSecurityAnswer]=useState('');
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const navigate = useNavigate();

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

function decrypt(encryptedText, N, D) {
    if (!validInputs(encryptedText, N, D)) {
        throw new Error("Invalid input to decrypt");
    }
    const shift = -D * N;
    const unshifted = [...encryptedText].map(ch => 
        String.fromCharCode(CHAR_MIN + ((ch.charCodeAt(0) - CHAR_MIN + shift) % RING_LEN))
    ).join('');
    return [...unshifted].reverse().join('');
}

  const submit = (e)=>{
    e.preventDefault();
    setError('');
    if(!username || !password){
      setError('Username and password are required');
      return;
    }
    if(!securityQuestion || !securityAnswer){
      setError('Please provide a security question and answer');
      return;
    }
  // Send registration to backend. Backend should handle encryption and storage.
  // encrypt password and security answer before sending
  const encryptedPassword = encrypt(password, 5, 1);
  const encryptedAnswer = encrypt(securityAnswer, 5, 1);
  const payload = { username, password: encryptedPassword, securityQuestion, securityAnswer: encryptedAnswer };
  setSubmitting(true);
  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(async r=>r.json())
  .then(json=>{
    setSubmitting(false);
    if(json && json.success){
  // persist minimal currentUser (username only)
  const cur = { username };
  localStorage.setItem('currentUser', JSON.stringify(cur));
      navigate('/portal');
    } else {
      setError(json && json.message ? json.message : 'Registration failed');
    }
  })
  .catch(err=>{
    setSubmitting(false);
    console.error('Registration error', err);
    setError('Network error');
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
        <div className="form-row">
          <label>Security question</label>
          <select value={securityQuestion} onChange={e=>setSecurityQuestion(e.target.value)}>
            <option value="">-- choose a question --</option>
            <option value="first_pet">What was the name of your first pet?</option>
            <option value="mother_maiden">What is your mother's maiden name?</option>
            <option value="birth_city">In which city were you born?</option>
          </select>
        </div>
        <div className="form-row">
          <label>Answer</label>
          <input value={securityAnswer} onChange={e=>setSecurityAnswer(e.target.value)} />
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