// Simple localStorage-backed storage helpers and seed data
export function initSeed(){
  if(!localStorage.getItem('hardware')){
    const hw = [
      {id:'hw1', name:'Raspberry Pi 4', capacity:10, available:10, description:'Small single-board computer'},
      {id:'hw2', name:'Arduino Uno', capacity:20, available:20, description:'Microcontroller board'},
      {id:'hw3', name:'Oscilloscope', capacity:4, available:4, description:'Digital oscilloscope'}
    ];
    localStorage.setItem('hardware', JSON.stringify(hw));
  }
  if(!localStorage.getItem('projects')){
    const projects = [
      {id:'p1', name:'Intro Robot', description:'Simple robotics project', usage: {}},
      {id:'p2', name:'Sensor Array', description:'Environmental sensing', usage: {} }
    ];
    localStorage.setItem('projects', JSON.stringify(projects));
  }
}

export function loadHardware(){
  return JSON.parse(localStorage.getItem('hardware')||'[]');
}
export function saveHardware(hardware){
  localStorage.setItem('hardware', JSON.stringify(hardware));
}

export function loadProjects(){
  return JSON.parse(localStorage.getItem('projects')||'[]');
}
export function saveProjects(projects){
  localStorage.setItem('projects', JSON.stringify(projects));
}

export function findProject(id){
  return loadProjects().find(p=>p.id===id) || null;
}

export function findHardware(id){
  return loadHardware().find(h=>h.id===id) || null;
}

// Attempt to reserve amount from hardware for a project. Returns true on success.
export function requestHardware(projectId, hwId, amount){
  if(amount <= 0) return false;
  const hw = findHardware(hwId);
  if(!hw) return false;
  if(hw.available < amount) return false;
  // update hardware
  const hardware = loadHardware();
  const idx = hardware.findIndex(h=>h.id===hwId);
  hardware[idx] = {...hardware[idx], available: hardware[idx].available - amount};
  saveHardware(hardware);

  // update project usage
  const projects = loadProjects();
  const pidx = projects.findIndex(p=>p.id===projectId);
  if(pidx === -1) return false;
  const usage = {...projects[pidx].usage};
  usage[hwId] = (usage[hwId]||0) + amount;
  projects[pidx] = {...projects[pidx], usage};
  saveProjects(projects);
  return true;
}

// Return hardware from a project back to the pool. amount > 0
export function returnHardware(projectId, hwId, amount){
  if(amount <= 0) return false;
  const projects = loadProjects();
  const pidx = projects.findIndex(p=>p.id===projectId);
  if(pidx === -1) return false;
  const usage = {...projects[pidx].usage};
  const current = usage[hwId] || 0;
  if(current < amount) return false;
  usage[hwId] = current - amount;
  if(usage[hwId] === 0) delete usage[hwId];
  projects[pidx] = {...projects[pidx], usage};
  saveProjects(projects);

  // update hardware
  const hardware = loadHardware();
  const hidx = hardware.findIndex(h=>h.id===hwId);
  if(hidx === -1) return false;
  hardware[hidx] = {...hardware[hidx], available: hardware[hidx].available + amount};
  saveHardware(hardware);
  return true;
}

export function createHardware(name, capacity, description){
  const hw = loadHardware();
  const id = 'hw_' + Math.random().toString(36).slice(2,9);
  const entry = {id, name, capacity: Number(capacity), available: Number(capacity), description};
  hw.push(entry);
  saveHardware(hw);
  return entry;
}

export function createProject(name, description){
  const projects = loadProjects();
  const id = 'p_' + Math.random().toString(36).slice(2,9);
  const entry = {id, name, description, usage: {}};
  projects.push(entry);
  saveProjects(projects);
  return entry;
}
