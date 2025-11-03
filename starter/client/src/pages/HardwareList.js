import React, {useEffect, useState} from 'react';
import { loadHardware, saveHardware, createHardware } from '../lib/storage';

export default function HardwareList(){
  const [hardware, setHardware] = useState([]);
  const [name,setName] = useState('');
  const [capacity,setCapacity] = useState(1);
  const [description,setDescription] = useState('');

  useEffect(()=>{
    // Try to load hardware from server first; fall back to localStorage
    async function loadFromServer(){
      try{
        const namesRes = await fetch('/get_all_hw_names', { method: 'POST' });
        const namesJson = await namesRes.json();
        if(namesRes.ok && namesJson && namesJson.success && Array.isArray(namesJson.data)){
          const names = namesJson.data;
          const hwPromises = names.map(n=> fetch('/get_hw_info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hwName: n }) }).then(r=>r.json()).catch(()=>null));
          const hwResults = await Promise.all(hwPromises);
          const normalized = hwResults.filter(h => h && h.success && h.data).map(h => ({ id: h.data.hwName, name: h.data.hwName, capacity: h.data.capacity, available: h.data.availability, description: '' }));
          if(normalized.length>0){
            setHardware(normalized);
            return;
          }
        }
      }catch(e){
        // server not available or failed, fall back to local
      }
      setHardware(loadHardware());
    }
    loadFromServer();
  },[]);

  const add = (e)=>{
    e.preventDefault();
    if(!name) return;
    // ask server to create global hardware set; fall back to localStorage helper if server unavailable
    fetch('/create_hardware_set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hwName: name, capacity }) })
      .then(r=>r.json())
      .then(json=>{
        if(json && json.success && json.data){
          const h = { id: json.data.hwName, name: json.data.hwName, capacity: json.data.capacity, available: json.data.availability, description };
          setHardware(prev => [...prev, h]);
        } else {
          // fallback to local creation
          const entry = createHardware(name, capacity, description);
          setHardware(prev => [...prev, { id: entry.id, name: entry.name, capacity: entry.capacity, available: entry.available, description: entry.description }]);
        }
      })
      .catch(()=>{
        const entry = createHardware(name, capacity, description);
        setHardware(prev => [...prev, { id: entry.id, name: entry.name, capacity: entry.capacity, available: entry.available, description: entry.description }]);
      })
      .finally(()=>{ setName(''); setCapacity(1); setDescription(''); });
  };

  return (
    <div>
      <h2>Hardware Inventory</h2>
      <div className="project-list">
        {hardware.map(h=> (
          <div key={h.id} className="card project-item">
            <h4>{h.name}</h4>
            <div>Available: {typeof h.available !== 'undefined' ? h.available : (h.availability ?? 'N/A')} / {h.capacity}</div>
            <div style={{marginTop:6}}>{h.description}</div>
          </div>
        ))}
        {hardware.length===0 && <div className="card">No hardware sets</div>}
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3>Create Hardware Set</h3>
        <form onSubmit={add}>
          <div className="form-row">
            <label>Name</label>
            <input className="input-medium" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Capacity</label>
            <input className="input-medium" type="number" value={capacity} onChange={e=>setCapacity(Number(e.target.value))} />
          </div>
          <div className="form-row">
            <label>Description</label>
            <input className="input-medium" value={description} onChange={e=>setDescription(e.target.value)} />
          </div>
          <div>
            <button type="submit">Create Hardware</button>
          </div>
        </form>
      </div>
    </div>
  )
}
