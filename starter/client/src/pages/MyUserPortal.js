import React, {useState, useEffect} from 'react';
import Project from '../components/Project';
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function loadProjectsLocal(){
  return JSON.parse(localStorage.getItem('projects')||'[]');
}

async function fetchProjects(){
  const res = await fetch(`${API_BASE}/api/inventory`);
  if(res.ok) return res.json().then(j=>j.projects||[]);
  return [];
}

export default function MyUserPortal(){
  const [projects,setProjects] = useState(loadProjectsLocal());
  const [name,setName] = useState('');
  const [desc,setDesc] = useState('');

  useEffect(()=>{
    fetchProjects().then(p=>{
      setProjects(p);
      localStorage.setItem('projects', JSON.stringify(p));
    });
  },[]);

  const create = (e)=>{
    e.preventDefault();
    fetch(`${API_BASE}/api/create_project`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, description: desc})
    }).then(async res=>{
      const body = await res.json();
      if(res.status===201 && body.project){
        const p = {id: body.project.id, name: body.project.name, description: body.project.description};
        const next = [...projects,p];
        setProjects(next);
        localStorage.setItem('projects', JSON.stringify(next));
        setName(''); setDesc('');
      } else {
        alert(body.message || 'Could not create');
      }
    }).catch(()=>alert('Server error'));
  };

  const join = (projectId)=>{
    const user = JSON.parse(localStorage.getItem('currentUser')||'null');
    if(!user) return alert('Please login');
    fetch(`${API_BASE}/api/join-project`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({userId: user.userId || user.username, projectId})
    }).then(async res=>{
      const body = await res.json();
      if(res.ok){
        // update local currentUser
        user.projects = user.projects || [];
        if(!user.projects.includes(projectId)) user.projects.push(projectId);
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('Joined project');
      } else {
        alert(body.message || 'Could not join');
      }
    }).catch(()=>alert('Server error'));
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
          <div>
            <button type="submit">Create</button>
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
