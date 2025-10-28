import React, {useState, useEffect} from 'react';
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
  const [createMessage, setCreateMessage] = useState('');
  const [createError, setCreateError] = useState(false);
  const [portalMessage, setPortalMessage] = useState('');
  const [portalError, setPortalError] = useState(false);
  const [selectedOtherProject, setSelectedOtherProject] = useState('');
  const [creating,setCreating] = useState(false);
  const [joining,setJoining] = useState(''); // project id being joined
  const [leaving,setLeaving] = useState(''); // project id being left

  useEffect(()=>{
    setUser(loadCurrentUser());
    // fetch projects from backend
    fetchProjects();
  },[]);

  function fetchProjects(){
    return fetch('/get_all_projects', { method: 'POST' })
      .then(r=>r.json())
      .then(json=>{
        if(json && json.success && Array.isArray(json.data)){
          const mapped = json.data.map(proj => ({
            id: proj._id || proj.id,
            name: proj.name,
            description: proj.description,
            authorized_users: proj.authorized_users || []
          }));
          setProjects(mapped);
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

  // split projects into joined and others
  const joinedProjects = projects.filter(p => user && p.authorized_users && user.username && p.authorized_users.includes(user.username));
  const otherProjects = projects.filter(p => !(user && p.authorized_users && user.username && p.authorized_users.includes(user.username)));

  return (
    <div>
      <h2>Your Portal</h2>

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
            <label>Project ID (optional)</label>
            <input value={projectId} onChange={e=>setProjectId(e.target.value)} placeholder="custom-project-id (no spaces)" />
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
        <h3>Other Available Projects</h3>
        {portalMessage && (
          <div style={{padding:8, marginBottom:8, borderRadius:4, backgroundColor: portalError ? '#f8d7da' : '#d4edda', color: portalError ? '#721c24' : '#155724', border: '1px solid', borderColor: portalError ? '#f5c6cb' : '#c3e6cb'}}>
            {portalMessage}
          </div>
        )}
        <div className="card" style={{padding:12}}>
          {otherProjects.length===0 ? (
            <div>No other projects available.</div>
          ) : (
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={selectedOtherProject} onChange={e=>setSelectedOtherProject(e.target.value)}>
                <option value="">-- select a project --</option>
                {otherProjects.map(p=> (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={()=>{
                if(!selectedOtherProject){ setPortalMessage('Please select a project'); setPortalError(true); return; }
                join(selectedOtherProject);
                setSelectedOtherProject('');
              }} disabled={!!joining}>
                {joining ? 'Joining...' : 'Join'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}