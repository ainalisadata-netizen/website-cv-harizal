// src/components/ContactForm.js
import React, { useState, useRef, useEffect } from 'react';

const ContactForm = ({ isOpen, onClose }) => {
  const [popupMessage, setPopupMessage] = useState('');
  const [messageColor, setMessageColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus on the first input when the popup opens
      const firstInput = formRef.current?.querySelector('input, textarea');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPopupMessage('Menyimpan...');
    setMessageColor('#ccc');

    const formData = {
      name: e.target.elements['popup-name'].value,
      email: e.target.elements['popup-email'].value,
      company: e.target.elements['popup-company'].value,
      message: e.target.elements['popup-message-text'].value,
    };

    try {
      const res = await fetch('/contact-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Server error');
      }

      setPopupMessage('Permintaan Anda telah disimpan. Terima kasih!');
      setMessageColor('#63ed7a');
      e.target.reset();
      setTimeout(() => {
        onClose();
        setPopupMessage('');
      }, 3000);
    } catch (error) {
      setPopupMessage('Terjadi kesalahan. Silakan coba lagi.');
      setMessageColor('#ff4c4c');
      console.error('Contact form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="popup-title" tabIndex="-1">
      <div id="popup-form-container">
        <button id="close-popup" aria-label="Close contact form" onClick={onClose}>&times;</button>
        <h2 id="popup-title">Minta Curriculum Vitae</h2>
        <form id="popup-form" onSubmit={handleSubmit} noValidate ref={formRef}>
          <label htmlFor="popup-name">Nama Anda:</label>
          <input type="text" id="popup-name" name="name" required autoComplete="name" aria-required="true" />
          <label htmlFor="popup-email">Email Anda:</label>
          <input type="email" id="popup-email" name="email" required autoComplete="email" aria-required="true" />
          <label htmlFor="popup-company">Perusahaan/Institusi:</label>
          <input type="text" id="popup-company" name="company" autoComplete="organization" />
          <label htmlFor="popup-message-text">Pesan:</label>
          <textarea id="popup-message-text" name="message" required aria-required="true"></textarea>
          <button type="submit" disabled={isSubmitting}>Kirim Permintaan</button>
        </form>
        <div id="popup-message" role="alert" aria-live="assertive" style={{ color: messageColor }}>
          {popupMessage}
        </div>
      </div>
    </div>
  );
};

export default ContactForm;