import React from 'react';
import { Link } from 'react-router-dom';

export default function Project({project, onJoin, onLeave, joined}){
  return (
    <div className="project-item card">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <span className="project-meta">ID: {project.id}</span>
      <div className="project-actions">
<<<<<<< HEAD
        {joined ? (
          <button onClick={() => onLeave && onLeave(project.id)} className="btn btn-warning">
            Leave Project
          </button>
        ) : (
          <button onClick={() => onJoin && onJoin(project.id)} className="btn btn-primary">
            Join Project
          </button>
        )}
=======
        <button onClick={() => onJoin && onJoin(project.id)} className="btn btn-primary">
          Join Project
        </button>
>>>>>>> d42d6b9ec21445d633897eb8196412e98b415909
        <Link to={`/project/${project.id}`} className="btn btn-secondary">
          View
        </Link>
      </div>
    </div>
  )
}