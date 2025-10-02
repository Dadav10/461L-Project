import React from 'react';
import { Link } from 'react-router-dom';

export default function Project({project, onJoin}){
  return (
    <div className="project-item card">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <small>ID: {project.id}</small>
      <div style={{marginTop:8}}>
        <button onClick={() => onJoin && onJoin(project.id)}>Join Project</button>
        <Link to={`/project/${project.id}`} style={{marginLeft:8}}>View</Link>
      </div>
    </div>
  )
}
