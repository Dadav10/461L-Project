import React from 'react';
import { Link } from 'react-router-dom';

export default function Project({project, onJoin}){
  return (
    <div className="project-item card">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <span className="project-meta">ID: {project.id}</span>
      <div className="project-actions">
        <button onClick={() => onJoin && onJoin(project.id)} className="btn btn-primary">
          Join Project
        </button>
        <Link to={`/project/${project.id}`} className="btn btn-secondary">
          View
        </Link>
      </div>
    </div>
  )
}
