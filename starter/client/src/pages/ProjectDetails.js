import React, {useEffect, useState} from 'react';
import { useParams } from 'react-router-dom';
import { findProject, loadHardware, requestHardware, returnHardware } from '../lib/storage';

export default function ProjectDetails(){
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [hardware, setHardware] = useState([]);
  const [selectedHw, setSelectedHw] = useState('');
  const [amount, setAmount] = useState(1);

  useEffect(()=>{
    setProject(findProject(id));
    setHardware(loadHardware());
  },[id]);

  if(!project) return <div className="card">Project not found</div>;

  const doRequest = ()=>{
    if(!selectedHw) return alert('Select hardware');
    const ok = requestHardware(project.id, selectedHw, Number(amount));
    if(!ok) alert('Request failed (maybe insufficient available).');
    else { setHardware(loadHardware()); setProject(findProject(id)); }
  };

  const doReturn = (hwId)=>{
    const amt = Number(prompt('Amount to return','1') || '0');
    if(amt <=0) return;
    const ok = returnHardware(project.id, hwId, amt);
    if(!ok) alert('Return failed');
    else { setHardware(loadHardware()); setProject(findProject(id)); }
  };

  return (
    <div>
      <h2>{project.name}</h2>
      <div className="card">
        <p>{project.description}</p>
        <h4>Project usage</h4>
        {project.usage && Object.keys(project.usage).length>0 ? (
          <ul>
            {Object.entries(project.usage).map(([hwId,amt])=> (
              <li key={hwId}>{hwId}: {amt} <button onClick={()=>doReturn(hwId)}>Return</button></li>
            ))}
          </ul>
        ) : <div>No hardware checked out</div>}
      </div>

      <div className="card" style={{marginTop:12}}>
        <h4>Request hardware</h4>
        <div className="form-row">
          <label>Hardware</label>
          <select value={selectedHw} onChange={e=>setSelectedHw(e.target.value)}>
            <option value="">-- select --</option>
            {hardware.map(h=> <option key={h.id} value={h.id}>{h.name} (avail: {h.available})</option>)}
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
