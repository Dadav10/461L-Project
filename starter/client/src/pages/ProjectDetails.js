import React, {useEffect, useState} from 'react';
import { useParams } from 'react-router-dom';
// Use backend endpoints instead of local storage
// (project and hardware will be fetched from server)

export default function ProjectDetails(){
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [hardware, setHardware] = useState([]);
  const [userUsage, setUserUsage] = useState({});
  const [selectedHw, setSelectedHw] = useState('');
  const [amount, setAmount] = useState(1);
  const [pdMessage, setPdMessage] = useState('');
  const [pdError, setPdError] = useState(false);
  const [returningHw, setReturningHw] = useState('');
  const [returnAmount, setReturnAmount] = useState(1);

  useEffect(()=>{
    // fetch project info and hardware from backend, include username so server can return per-user usage
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const body = { project_id: id };
    if(cur && cur.username) body.username = cur.username;
    fetch('/get_project_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success && json.data){
        setProject(json.data.project);
        setHardware(json.data.hardware || []);
        setUserUsage(json.data.user_usage || {});
      } else {
        setProject(null);
        setHardware([]);
        setUserUsage({});
      }
    })
    .catch(err=>{
      console.error('Fetch project error', err);
      setProject(null);
      setHardware([]);
      setUserUsage({});
    });
  },[id]);

  if(!project) return <div className="card">Project not found</div>;

  const doRequest = ()=>{
    setPdMessage(''); setPdError(false);
    if(!selectedHw){ setPdMessage('Select hardware'); setPdError(true); return; }
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if(!cur || !cur.username){ setPdMessage('Please login to request hardware'); setPdError(true); return; }
    fetch('/check_out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: id, hwName: selectedHw, amount: Number(amount), username: cur.username })
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success){
        // refresh project info (include username to get per-user usage back)
        return fetch('/get_project_info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: id, username: cur.username }) });
      } else {
        throw new Error(json && json.message ? json.message : 'Request failed');
      }
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success && json.data){
        setProject(json.data.project);
        setHardware(json.data.hardware || []);
        setUserUsage(json.data.user_usage || {});
        setPdMessage('Request successful'); setPdError(false);
        setTimeout(()=>setPdMessage(''), 3000);
      }
    })
    .catch(err=>{
      console.error('Request error', err);
      setPdMessage(err.message || 'Request failed'); setPdError(true);
    });
  };

  const doReturnStart = (hwId)=>{
    setPdMessage(''); setPdError(false);
    setReturningHw(hwId);
    setReturnAmount(1);
  };

  const doReturnCancel = ()=>{
    setReturningHw(''); setReturnAmount(1);
  };

  const doReturnConfirm = (hwId)=>{
    const amt = Number(returnAmount || 0);
    if(amt <= 0){ setPdMessage('Return amount must be > 0'); setPdError(true); return; }
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if(!cur || !cur.username){ setPdMessage('Please login to return hardware'); setPdError(true); return; }
    fetch('/check_in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: id, hwName: hwId, amount: amt, username: cur.username })
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success){
        return fetch('/get_project_info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: id, username: cur.username }) });
      } else {
        throw new Error(json && json.message ? json.message : 'Return failed');
      }
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success && json.data){
        setProject(json.data.project);
        setHardware(json.data.hardware || []);
        setUserUsage(json.data.user_usage || {});
        setPdMessage('Return successful'); setPdError(false);
        setTimeout(()=>setPdMessage(''), 3000);
      }
    })
    .catch(err=>{
      console.error('Return error', err);
      setPdMessage(err.message || 'Return failed'); setPdError(true);
    })
    .finally(()=>{
      setReturningHw(''); setReturnAmount(1);
    });
  };

  return (
    <div>
      <h2>{project.name}</h2>
      {pdMessage && (
        <div style={{padding:8, marginBottom:8, borderRadius:4, backgroundColor: pdError ? '#f8d7da' : '#d4edda', color: pdError ? '#721c24' : '#155724', border: '1px solid', borderColor: pdError ? '#f5c6cb' : '#c3e6cb'}}>
          {pdMessage}
        </div>
      )}
      <div className="card">
        <p>{project.description}</p>
        <h4>Project usage</h4>
        {userUsage && Object.keys(userUsage).length>0 ? (
          (() => {
            const entries = Object.entries(userUsage).filter(([hwId,amt]) => Number(amt) > 0);
            if(entries.length === 0) return <div>No hardware checked out</div>;
            return (
              <ul>
                {entries.map(([hwId,amt])=> (
                  <li key={hwId}><strong>{hwId}</strong> — <em>{amt}</em> {
                    returningHw === hwId ? (
                      <span style={{display:'inline-flex',gap:8,alignItems:'center'}}>
                        <input type="number" value={returnAmount} onChange={e=>setReturnAmount(e.target.value)} style={{width:80}} />
                        <button onClick={()=>doReturnConfirm(hwId)}>Confirm</button>
                        <button onClick={doReturnCancel}>Cancel</button>
                      </span>
                    ) : (
                      <button onClick={()=>doReturnStart(hwId)}>Return</button>
                    )
                  }</li>
                ))}
              </ul>
            );
          })()
        ) : <div>No hardware checked out</div>}
      </div>

      <div className="card" style={{marginTop:12}}>
        <h4>Request hardware</h4>
        <div className="form-row">
          <label>Hardware</label>
          <select value={selectedHw} onChange={e=>setSelectedHw(e.target.value)}>
            <option value="">-- select --</option>
            {hardware.map(h=> (
              <option key={h.hwName} value={h.hwName}>{h.hwName} (avail: {h.availability})</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Amount</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <div>
          <button onClick={doRequest}>Request</button>
        </div>
      </div>
    </div>
  )
}
