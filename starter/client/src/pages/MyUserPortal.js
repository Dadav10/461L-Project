import React, {useState, useEffect} from 'react';
import Project from '../components/Project';

function loadProjects(){
  return JSON.parse(localStorage.getItem('projects')||'[]');
}

function saveProjects(projects){
  localStorage.setItem('projects', JSON.stringify(projects));
}

export default function MyUserPortal(){
  const [projects,setProjects] = useState(loadProjects());
  const [name,setName] = useState('');
  const [desc,setDesc] = useState('');

  useEffect(()=>{
    setProjects(loadProjects());
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
    const user = JSON.parse(localStorage.getItem('currentUser')||'null');
    if(!user) return alert('Please login');
    user.projects = user.projects || [];
    if(!user.projects.includes(projectId)) user.projects.push(projectId);
    // persist in users array
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const idx = users.findIndex(u=>u.username===user.username);
    if(idx>=0) users[idx]=user; else users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user));
    alert('Joined project');
  };

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
        <h3>Available Projects</h3>
        <div className="project-list">
          {projects.map(p=> (
            <Project key={p.id} project={{name:p.name,description:p.description,id:p.id}} onJoin={join} />
          ))}
          {projects.length===0 && <div className="card">No projects yet.</div>}
        </div>
      </section>
    </div>
  )
}
