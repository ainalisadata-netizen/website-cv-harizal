// src/components/Projects.js
import React from 'react';

const ProjectCategory = ({ title, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="project-category">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const Projects = ({ projects }) => {
  return (
    <section id="projects" data-aos="fade-up" data-aos-duration="1000" tabIndex="-1">
      <h2>Projects</h2>
      <div className="section-content" id="projects-content" aria-live="polite">
        <ProjectCategory title="IT" items={projects.it} />
        <ProjectCategory title="Networking & Infrastructure" items={projects.network_infrastructure} />
        <ProjectCategory title="Security" items={projects.security} />
      </div>
    </section>
  );
};

export default Projects;