// src/components/Hero.js
import React from 'react';

const Hero = ({ name, title, onContactClick }) => {
  return (
    <header id="hero" role="banner" aria-label="Hero section with name and title">
      <div id="hero-content" data-aos="fade-up" data-aos-duration="1500">
        <h1 id="name">{name}</h1>
        <h3 id="title">{title}</h3>
        <button
          id="contact-btn"
          aria-haspopup="dialog"
          aria-controls="popup-overlay"
          aria-expanded="false"
          onClick={onContactClick}
        >
          Hubungi Kami
        </button>
      </div>
    </header>
  );
};

export default Hero;