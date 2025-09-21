// src/components/Certifications.js
import React from 'react';

const Certifications = ({ certifications, trainings }) => {
  return (
    <section id="certifications" data-aos="fade-up" data-aos-duration="1000" tabIndex="-1">
      <h2>Certifications & Training</h2>
      <div className="section-content" id="certifications-content">
        <h3>Certifications</h3>
        <ul id="certifications-list" aria-live="polite">
          {certifications.map((cert, index) => (
            <li key={index}>{cert}</li>
          ))}
        </ul>
        <h3>Trainings</h3>
        <ul id="trainings-list" aria-live="polite">
          {trainings.map((training, index) => (
            <li key={index}>{training}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Certifications;