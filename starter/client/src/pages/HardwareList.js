import {useEffect, useState} from 'react';
import { loadHardware, saveHardware } from '../lib/storage';

export default function HardwareList(){
  const [hardware, setHardware] = useState([]);

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
    </div>
  )
}
