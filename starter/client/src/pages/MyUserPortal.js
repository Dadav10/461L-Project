import React, {useState, useEffect} from 'react';
import Project from '../components/Project';

function loadProjects(){
  return JSON.parse(localStorage.getItem('projects')||'[]');
}

function saveProjects(projects){
  localStorage.setItem('projects', JSON.stringify(projects));
}

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
  const [projects,setProjects] = useState(loadProjects());
  const [name,setName] = useState('');
  const [desc,setDesc] = useState('');
  const [user, setUser] = useState(loadCurrentUser());
  const [selectedOtherProject, setSelectedOtherProject] = useState('');

  useEffect(()=>{
    setProjects(loadProjects());
    setUser(loadCurrentUser());
  },[]);

  const create = (e)=>{
    e.preventDefault();
    const id = Math.random().toString(36).slice(2,9);
    const p = {id,name,description:desc};
    const next = [...projects,p];
    setProjects(next);
    saveProjects(next);
    setName('');setDesc('');
  };

  const join = (projectId)=>{
    const cur = loadCurrentUser();
    if(!cur) return alert('Please login');
    cur.projects = cur.projects || [];
    if(!cur.projects.includes(projectId)) cur.projects.push(projectId);
    persistUser(cur);
    setUser(cur);
    alert('Joined project');
  };

  const leave = (projectId)=>{
    const cur = loadCurrentUser();
    if(!cur) return alert('Please login');
    cur.projects = cur.projects || [];
    const idx = cur.projects.indexOf(projectId);
    if(idx>=0) cur.projects.splice(idx,1);
    persistUser(cur);
    setUser(cur);
    alert('Left project');
  };

  // split projects into joined and others
  const joinedIds = (user && user.projects) || [];
  const joinedProjects = projects.filter(p=> joinedIds.includes(p.id));
  const otherProjects = projects.filter(p=> !joinedIds.includes(p.id));

  return (
    <div>
      <h2>Your Portal</h2>

      <section className="card" style={{marginBottom:12}}>
        <h3>Create Project</h3>
        <form onSubmit={create}>
          <div className="form-row">
            <label>Project name</label>
            <input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Description</label>
            <input value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>
          <div style={{marginTop:12}}>
            <button type="submit" className="btn btn-primary" style={{padding:'12px 20px'}}>
              Create
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3>Your Projects</h3>
        <div className="project-list">
          {joinedProjects.map(p=> (
            <Project key={p.id} project={{name:p.name,description:p.description,id:p.id}} onLeave={leave} joined={true} />
          ))}
          {joinedProjects.length===0 && <div className="card">You are not registered to any projects.</div>}
        </div>
      </section>

      <section style={{marginTop:18}}>
        <h3>Other Available Projects</h3>
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
                if(!selectedOtherProject) return alert('Please select a project');
                join(selectedOtherProject);
                setSelectedOtherProject('');
              }}>Join</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}