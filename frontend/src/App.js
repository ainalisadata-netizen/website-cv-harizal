// src/App.js
import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import './App.css';
import './index.css';

import Hero from './components/Hero';
import About from './components/About';
import WorkExperience from './components/WorkExperience';
import Projects from './components/Projects';
import Education from './components/Education';
import Certifications from './components/Certifications';
import ContactSection from './components/ContactSection';
import ContactForm from './components/ContactForm';
import useDataFetcher from './hooks/useDataFetcher';
import LiquidEtherBackground from './components/LiquidEtherBackground';

function App() {
  const { data, loading, error } = useDataFetcher('/get-data');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    AOS.init({ once: true, duration: 1000 });
  }, []);

  if (loading) return <div className="loading-screen">Loading portfolio...</div>;
  if (error) return <div className="error-screen">Error: {error.message}</div>;
  if (!data) return null;

  const { personalInfo, workExperience, projects, education, certifications, trainings } = data;

  return (
    <div className="app-container">
      <LiquidEtherBackground /> {/* Komponen animasi sebagai latar belakang */}

      <div className="content-wrapper">
        <Hero
          name={personalInfo?.name || 'Nama Tidak Tersedia'}
          title={personalInfo?.title || 'Judul Tidak Tersedia'}
          onContactClick={() => setIsPopupOpen(true)}
        />

        <main>
          <About
            aboutP1="Experienced IT professional with a strong background in consulting, network infrastructure, and security projects. Passionate about leveraging technology to solve complex problems and improve organizational security."
            address={personalInfo?.address || 'Tidak Tersedia'}
          />
          <WorkExperience experiences={workExperience || []} />
          <Projects projects={projects || {}} />
          <Education education={education || []} />
          <Certifications
            certifications={certifications || []}
            trainings={trainings || []}
          />
          <ContactSection email={personalInfo?.email || 'harizalbanget@gmail.com'} />
        </main>
      </div>

      <ContactForm isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </div>
  );
}

export default App;