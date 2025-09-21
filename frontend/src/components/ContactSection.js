// src/components/ContactSection.js
import React from 'react';

const ContactSection = ({ email }) => {
  return (
    <section id="contact" data-aos="fade-up" data-aos-duration="1000" tabIndex="-1">
      <h2>Contact</h2>
      <div className="section-content">
        <p>Email: <a href={`mailto:${email}`} id="email-link" rel="nofollow noopener noreferrer">{email}</a></p>
        <p>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a> |
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub">GitHub</a>
        </p>
      </div>
    </section>
  );
};

export default ContactSection;