// src/components/About.js
import React from 'react';

const About = ({ aboutP1, address }) => {
  return (
    <section id="about" data-aos="fade-up" data-aos-duration="1000" tabIndex="-1">
      <h2>About Me</h2>
      <div className="section-content" id="about-content" aria-live="polite">
        <p>{aboutP1}</p>
        <p>
          <strong>Address: </strong>
          {address}
        </p>
      </div>
    </section>
  );
};

export default About;