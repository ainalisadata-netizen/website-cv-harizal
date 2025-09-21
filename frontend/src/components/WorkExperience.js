// src/components/WorkExperience.js
import React from 'react';

const WorkExperience = ({ experiences }) => {
  return (
    <section id="work-experience" data-aos="fade-up" data-aos-duration="1000" tabIndex="-1">
      <h2>Work Experience</h2>
      <div className="section-content" id="work-experience-content" aria-live="polite">
        {experiences.map((exp, index) => (
          <div className="item" key={index}>
            <div className="item-title">{exp.position}</div>
            <div className="item-subtitle">{`${exp.company || ''} | ${exp.period || ''}`}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WorkExperience;