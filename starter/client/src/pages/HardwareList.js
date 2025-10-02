import React, {useEffect, useState} from 'react';
import { loadHardware, saveHardware, createHardware } from '../lib/storage';

export default function HardwareList(){
  const [hardware, setHardware] = useState([]);
  const [name,setName] = useState('');
  const [capacity,setCapacity] = useState(1);
  const [description,setDescription] = useState('');

  useEffect(()=>{
    setHardware(loadHardware());
  },[]);

  const add = (e)=>{
    e.preventDefault();
    if(!name) return;
    createHardware(name, capacity, description);
    setHardware(loadHardware());
    setName('');setCapacity(1);setDescription('');
  };

  return (
    <div>
      <h2>Hardware Inventory</h2>
      <div className="project-list">
        {hardware.map(h=> (
          <div key={h.id} className="card project-item">
            <h4>{h.name}</h4>
            <div>Available: {h.available} / {h.capacity}</div>
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
