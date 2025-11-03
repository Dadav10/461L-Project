import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Project from '../components/Project';

// Projects are now fetched from backend; localStorage-backed helpers removed

function loadCurrentUser(){
  return JSON.parse(localStorage.getItem('currentUser')||'null');
}

function persistUser(user){
  if(!user) return;
  const users = JSON.parse(localStorage.getItem('users')||'[]');
  const idx = users.findIndex(u=>u.username===user.username);
  if(idx>=0) users[idx]=user; else users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export default function MyUserPortal(){
  const [projects,setProjects] = useState([]);
  const [name,setName] = useState('');
  const [desc,setDesc] = useState('');
  const [projectId, setProjectId] = useState('');
  const [user, setUser] = useState(loadCurrentUser());
  const navigate = useNavigate();
  const [hardwareSets, setHardwareSets] = useState([]);
  const [hwName, setHwName] = useState('');
  const [hwCapacity, setHwCapacity] = useState(1);
  const [hwDescription, setHwDescription] = useState('');
  const [hwMessage, setHwMessage] = useState('');
  const [hwError, setHwError] = useState(false);
  const [hwCreating, setHwCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [createError, setCreateError] = useState(false);
  const [portalMessage, setPortalMessage] = useState('');
  const [portalError, setPortalError] = useState(false);
  const [selectedOtherProject, setSelectedOtherProject] = useState('');
  const [joinById, setJoinById] = useState('');
  const [creating,setCreating] = useState(false);
  const [joining,setJoining] = useState(''); // project id being joined
  const [leaving,setLeaving] = useState(''); // project id being left
  const [rejoinCandidates, setRejoinCandidates] = useState([]);

  useEffect(()=>{
    setUser(loadCurrentUser());
    // fetch projects from backend
    fetchProjects();
    fetchHardwareSets();
  },[]);

  // fetch projects the user is authorized for but not currently joined (candidates to rejoin)
  useEffect(()=>{
    const cur = loadCurrentUser();
    if(!cur) { setRejoinCandidates([]); return; }
    // Ask the server for rejoin candidates (efficient server-side filter)
    fetch('/get_rejoin_candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: cur.username }) })
      .then(r=>r.json())
      .then(json=>{
        if(json && json.success && Array.isArray(json.data)){
          setRejoinCandidates(json.data.map(p=>({ id: p.id, name: p.name })));
        } else {
          setRejoinCandidates([]);
        }
      })
      .catch(err=>{ console.error('Fetch rejoin candidates failed', err); setRejoinCandidates([]); });
  },[projects, user]);

  function fetchHardwareSets(){
    return fetch('/get_all_hw_names', { method: 'POST' })
      .then(r=>r.json())
      .then(async json=>{
        if(json && json.success && Array.isArray(json.data)){
          const names = json.data;
          const hwPromises = names.map(n=> fetch('/get_hw_info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hwName: n }) }).then(r=>r.json()).catch(()=>null));
          const hwResults = await Promise.all(hwPromises);
          const normalized = hwResults.filter(h => h && h.success && h.data).map(h => ({ hwName: h.data.hwName, capacity: h.data.capacity, availability: h.data.availability }));
          setHardwareSets(normalized);
        } else {
          setHardwareSets([]);
        }
      })
      .catch(err=>{
        console.error('Fetch hardware error', err);
        setHardwareSets([]);
      });
  }

  function fetchProjects(){
    const cur = loadCurrentUser();
    if(!cur){ setProjects([]); return Promise.resolve(); }
    return fetch('/get_user_projects_list', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username: cur.username }) })
      .then(r=>r.json())
      .then(json=>{
        if(json && json.success && Array.isArray(json.data)){
          const ids = json.data;
          if(ids.length===0){ setProjects([]); return; }
          return Promise.all(ids.map(pid => fetch('/get_project_info', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ project_id: pid }) }).then(r=>r.json()).then(j=>j && j.success ? j.data.project : null).catch(()=>null) ))
            .then(arr=>{
              const mapped = arr.filter(Boolean).map(proj => ({ id: proj._id || proj.id, name: proj.name, description: proj.description, authorized_users: proj.authorized_users || [] }));
              setProjects(mapped);
            });
        } else {
          setProjects([]);
        }
      })
      .catch(err=>{
        console.error('Fetch projects error', err);
        setProjects([]);
      });
  }

  const create = (e)=>{
    e.preventDefault();
  const cur = loadCurrentUser();
  // clear previous messages
  setCreateMessage(''); setCreateError(false);
  if(!cur){ setCreateMessage('Please login'); setCreateError(true); return; }
  if(!name) { setCreateMessage('Please provide a project name'); setCreateError(true); return; }
  if(projectId && /\s/.test(projectId)) { setCreateMessage('Project id cannot contain spaces'); setCreateError(true); return; }
  setCreating(true);
    // Post to backend to create project
    fetch('/create_project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cur.username, name, description: desc, project_id: projectId || undefined })
    })
    .then(async r=>{
      const json = await r.json().catch(()=>null);
      if(!r.ok){
        if(r.status===409){
          setCreateMessage(json && json.message ? json.message : 'Project id already exists');
        } else {
          setCreateMessage(json && json.message ? json.message : 'Create failed');
        }
        setCreateError(true);
        setCreating(false);
        return;
      }
      if(json && json.success && json.data){
        // refresh projects from server (server returns new project but we'll reload authoritative list)
        fetchProjects().then(()=>{
          // ensure current user reflects membership if server tracks it
          const updatedCur = loadCurrentUser();
          if(updatedCur){ setUser(updatedCur); }
          setName(''); setDesc(''); setProjectId('');
          setSelectedOtherProject('');
          setCreating(false);
          setCreateMessage('Project created');
          setCreateError(false);
          // auto-hide success after a few seconds
          setTimeout(()=>setCreateMessage(''), 3000);
        });
      } else {
        setCreateMessage(json && json.message ? json.message : 'Create failed');
        setCreateError(true);
        setCreating(false);
      }
    })
    .catch(err=>{
      console.error('Create project error', err);
      setCreateMessage('Network error'); setCreateError(true);
      setCreating(false);
    });
  };

  const createHardwareSet = (e)=>{
    e.preventDefault();
    setHwMessage(''); setHwError(false);
    if(!hwName){ setHwMessage('Please enter a hardware name'); setHwError(true); return; }
    try{ setHwCapacity(Number(hwCapacity)); }catch(e){}
    if(!Number.isInteger(Number(hwCapacity)) || Number(hwCapacity) <= 0){ setHwMessage('Capacity must be a positive integer'); setHwError(true); return; }
    setHwCreating(true);
    fetch('/create_hardware_set', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ hwName, capacity: Number(hwCapacity) }) })
      .then(async r=>{
        const json = await r.json().catch(()=>null);
        if(!r.ok){
          setHwMessage(json && json.message ? json.message : 'Create hardware failed'); setHwError(true); setHwCreating(false); return;
        }
        if(json && json.success && json.data){
          setHwMessage('Hardware set created'); setHwError(false);
          // refresh list
          fetchHardwareSets();
          setHwName(''); setHwCapacity(1); setHwDescription('');
          setTimeout(()=>setHwMessage(''), 3000);
        } else {
          setHwMessage(json && json.message ? json.message : 'Create hardware failed'); setHwError(true);
        }
        setHwCreating(false);
      })
      .catch(err=>{
        console.error('Create hardware error', err);
        setHwMessage('Network error'); setHwError(true); setHwCreating(false);
      });
  };

  const join = (projectId)=>{
    const cur = loadCurrentUser();
    if(!cur){ setPortalMessage('Please login'); setPortalError(true); return; }
    setPortalMessage(''); setPortalError(false);
    setJoining(projectId);
    // ask backend to add user to project
    fetch('/join_project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cur.username, project_id: projectId })
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success){
        // refresh projects list to see updated authorized_users
        fetchProjects();
        setPortalMessage('Joined project'); setPortalError(false);
        setTimeout(()=>setPortalMessage(''), 3000);
        setJoining('');
      } else {
        setPortalMessage(json && json.message ? json.message : 'Join failed'); setPortalError(true);
        setJoining('');
      }
    })
    .catch(err=>{
      console.error('Join error', err);
      setPortalMessage('Network error'); setPortalError(true);
      setJoining('');
    });
  };

  const leave = (projectId)=>{
    const cur = loadCurrentUser();
    if(!cur){ setPortalMessage('Please login'); setPortalError(true); return; }
    setPortalMessage(''); setPortalError(false);
    setLeaving(projectId);
    // ask backend to remove user from project
    fetch('/leave_project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cur.username, project_id: projectId })
    })
    .then(r=>r.json())
    .then(json=>{
      if(json && json.success){
        // refresh projects to see updated authorized_users
        fetchProjects();
        setPortalMessage('Left project'); setPortalError(false);
        setTimeout(()=>setPortalMessage(''), 3000);
        setLeaving('');
      } else {
        setPortalMessage(json && json.message ? json.message : 'Leave failed'); setPortalError(true);
        setLeaving('');
      }
    })
    .catch(err=>{
      console.error('Leave error', err);
      setPortalMessage('Network error'); setPortalError(true);
      setLeaving('');
    });
  };

  // projects returned by server are the user's joined projects
  const joinedProjects = projects;

  return (
    <div>
      <h2>Your Portal</h2>
      {/* Small dropdown for projects the user can rejoin (authorized but currently not in) */}
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <label style={{marginRight:6}}>Rejoin available:</label>
        <select onChange={e=>{ const v=e.target.value; if(v){ join(v); e.target.value=''; } }} defaultValue="">
          <option value="">-- select to rejoin --</option>
          {rejoinCandidates.map(p=> (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
      </div>

      <section className="card" style={{marginBottom:12}}>
        <h3>Create Project</h3>
        {createMessage && (
          <div style={{padding:8, marginBottom:8, borderRadius:4, backgroundColor: createError ? '#f8d7da' : '#d4edda', color: createError ? '#721c24' : '#155724', border: '1px solid', borderColor: createError ? '#f5c6cb' : '#c3e6cb'}}>
            {createMessage}
          </div>
        )}
        <form onSubmit={create}>
          <div className="form-row">
            <label>Project name</label>
            <input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Project ID</label>
            <input value={projectId} onChange={e=>setProjectId(e.target.value)} placeholder="project-id (no spaces)" />
          </div>
          <div className="form-row">
            <label>Description</label>
            <input value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>
          <div style={{marginTop:12}}>
            <button type="submit" className="btn btn-primary" style={{padding:'12px 20px'}} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </section>

      <section style={{marginTop:18}}>
        <h3>Hardware Sets (Global)</h3>
        {hwMessage && (
          <div style={{padding:8, marginBottom:8, borderRadius:4, backgroundColor: hwError ? '#f8d7da' : '#d4edda', color: hwError ? '#721c24' : '#155724', border: '1px solid', borderColor: hwError ? '#f5c6cb' : '#c3e6cb'}}>
            {hwMessage}
          </div>
        )}
        <div className="card" style={{padding:12, marginBottom:12}}>
          <div style={{display:'flex', flexWrap:'wrap', gap:12}}>
            {hardwareSets.length===0 ? <div>No hardware sets</div> : hardwareSets.map(h=> (
              <div key={h.hwName} className="card" style={{padding:8, minWidth:160}}>
                <strong>{h.hwName}</strong>
                <div>Available: {h.availability} / {h.capacity}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{padding:12}}>
          <h4>Create Hardware Set</h4>
          <form onSubmit={createHardwareSet} style={{display:'flex', gap:8, alignItems:'center'}}>
            <input placeholder="Name" value={hwName} onChange={e=>setHwName(e.target.value)} />
            <input type="number" style={{width:100}} value={hwCapacity} onChange={e=>setHwCapacity(e.target.value)} />
            <button className="btn btn-primary" type="submit" disabled={hwCreating}>{hwCreating ? 'Creating...' : 'Create'}</button>
          </form>
        </div>
      </section>

      <section>
        <h3>Your Projects</h3>
        <div className="project-list">
          {joinedProjects.map(p=> (
            <Project
              key={p.id}
              project={{name:p.name,description:p.description,id:p.id}}
              onLeave={leave}
              joined={true}
              disabled={leaving === p.id}
            />
          ))}
          {joinedProjects.length===0 && <div className="card">You are not registered to any projects.</div>}
        </div>
      </section>

      <section style={{marginTop:18}}>
        <h3>Join a Project</h3>
        {portalMessage && (
          <div style={{padding:8, marginBottom:8, borderRadius:4, backgroundColor: portalError ? '#f8d7da' : '#d4edda', color: portalError ? '#721c24' : '#155724', border: '1px solid', borderColor: portalError ? '#f5c6cb' : '#c3e6cb'}}>
            {portalMessage}
          </div>
        )}
        <div className="card" style={{padding:12}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input placeholder="Enter project id to join" value={joinById} onChange={e=>setJoinById(e.target.value)} />
            <button className="btn btn-primary" onClick={()=>{
              if(!joinById){ setPortalMessage('Please enter a project id'); setPortalError(true); return; }
              join(joinById.trim());
              setJoinById('');
            }} disabled={!!joining}>
              {joining ? 'Joining...' : 'Join by ID'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}