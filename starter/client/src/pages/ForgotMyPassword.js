
import React, {useState} from 'react';

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

const QUESTION_MAP = {
  first_pet: 'What was the name of your first pet?',
  mother_maiden: "What is your mother's maiden name?",
  birth_city: 'In which city were you born?'
}

export default function ForgotMyPassword(){
  const [username,setUsername]=useState('');
  const [user, setUser] = useState(null);
  const [answer,setAnswer] = useState('');
  const [message,setMessage]=useState('');
  const [newPassword,setNewPassword] = useState('');

  const lookup = (e)=>{
    e.preventDefault();
    setMessage('');
    fetch('/forgot/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success && json.data){
        setUser(json.data);
        setMessage('Please answer your security question to reveal/reset password.');
      } else {
        setUser(null);
        setMessage(json && json.message ? json.message : 'User not found');
      }
    })
    .catch(err=>{
      console.error('Lookup error', err);
      setMessage('Network error');
    });
  };

  const verify = (e)=>{
    e.preventDefault();
    if(!user){ setMessage('No user selected'); return; }
    setMessage('');
    // send encrypted answer
    const encryptedAnswer = encrypt(answer, 5, 1);
    fetch('/forgot/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, answer: encryptedAnswer })
    })
    .then(async r=>r.json())
    .then(json=>{
      if(json && json.success){
        // server may return the plaintext password or indicate success differently
        if(json.data && json.data.password){
          try{
            const decrypted = decrypt(json.data.password, 5, 1);
            setMessage('Your password is: ' + decrypted);
          }catch(err){
            // if decryption fails, fall back to raw value
            setMessage('Your password is: ' + json.data.password);
          }
        } else {
          setMessage(json.message || 'Verification succeeded');
        }
      } else {
        setMessage(json && json.message ? json.message : 'Incorrect answer');
      }
    })
    .catch(err=>{
      console.error('Verify error', err);
      setMessage('Network error');
    });
  };

  const reset = (e)=>{
    e.preventDefault();
    if(!user) { setMessage('No user selected'); return; }
    if(!newPassword) { setMessage('Please provide a new password'); return; }
    setMessage('');
    // send encrypted answer and encrypted new password
    const encryptedAnswer = encrypt(answer, 5, 1);
    const encryptedNew = encrypt(newPassword, 5, 1);
    fetch('/forgot/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, answer: encryptedAnswer, newPassword: encryptedNew })
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success){
        setMessage('Password reset successfully');
        setUser(null);
        setUsername(''); setAnswer(''); setNewPassword('');
      } else {
        setMessage(json && json.message ? json.message : 'Reset failed');
      }
    })
    .catch(err=>{
      console.error('Reset error', err);
      setMessage('Network error');
    });
  };

  return (
    <div className="card" style={{maxWidth:420,margin:'20px auto'}}>
      <h2>Forgot Password</h2>

      {!user && (
        <form onSubmit={lookup}>
          <div className="form-row">
            <label>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div style={{marginTop:20, textAlign:'center'}}>
            <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'14px'}}>
              Lookup User
            </button>
          </div>
        </form>
      )}

      {user && (
        <div>
          <div className="form-row">
            <label>Security question</label>
            <div className="card" style={{padding:10}}>{QUESTION_MAP[user.securityQuestion] || 'Security question not set'}</div>
          </div>

          <form onSubmit={verify}>
            <div className="form-row">
              <label>Answer</label>
              <input value={answer} onChange={e=>setAnswer(e.target.value)} />
            </div>
            <div style={{display:'flex',gap:8, marginTop:12}}>
              <button type="submit" className="btn btn-primary">Verify</button>
              <div style={{flex:1}} />
            </div>
          </form>

          <h4 style={{marginTop:18}}>Or reset password</h4>
          <form onSubmit={reset}>
            <div className="form-row">
              <label>New password</label>
              <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
            </div>
            <div style={{marginTop:12}}>
              <button type="submit" className="btn btn-primary">Reset Password</button>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div
          className={
            message.includes('not found') || message.includes('Incorrect')
              ? 'error-message'
              : 'success-message'
          }
          style={{ marginTop: 20 }}
        >
          {message}
        </div>
      )}
    </div>
  );
}