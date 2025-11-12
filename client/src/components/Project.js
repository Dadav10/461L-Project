import React from 'react';
import { Link } from 'react-router-dom';

export default function Project({project, onJoin, onLeave, joined, disabled}){
  return (
    <div className="project-item card">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <span className="project-meta">ID: {project.id}</span>
      <div className="project-actions">
        {joined ? (
          <button onClick={() => onLeave && onLeave(project.id)} className="btn btn-warning" disabled={!!disabled}>
            {disabled ? 'Leaving...' : 'Leave Project'}
          </button>
        ) : (
          <button onClick={() => onJoin && onJoin(project.id)} className="btn btn-primary" disabled={!!disabled}>
            {disabled ? 'Joining...' : 'Join Project'}
          </button>
        )}
        <Link to={`/project/${project.id}`} className="btn btn-secondary">
          View
        </Link>
      </div>
    </div>
  )
}