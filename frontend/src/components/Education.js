// src/components/Education.js
import React from 'react';

const Education = ({ education }) => {
  return (
    <section id="education" data-aos="fade-up" data-aos-duration="1000" tabIndex="-1">
      <h2>Education</h2>
      <div className="section-content" id="education-content" aria-live="polite">
        {education.map((edu, index) => (
          <div className="item" key={index}>
            <div className="item-title">{edu.degree}</div>
            <div className="item-subtitle">{`${edu.institution || ''} | ${edu.status || ''}`}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Education;