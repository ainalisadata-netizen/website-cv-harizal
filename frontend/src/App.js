// src/App.js
import './App.css';
import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { loadSlim } from 'tsparticles-slim'; // Use tsparticles-slim for smaller bundle size

import Hero from './components/Hero';
import About from './components/About';
import WorkExperience from './components/WorkExperience';
import Projects from './components/Projects';
import Education from './components/Education';
import Certifications from './components/Certifications';
import ContactSection from './components/ContactSection';
import ContactForm from './components/ContactForm';
import useDataFetcher from './hooks/useDataFetcher';

function App() {
  const { data, loading, error } = useDataFetcher('/get-data');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    AOS.init({ once: true });

    // Initialize tsParticles
    const initParticles = async () => {
      await loadSlim(tsParticles); // Use loadSlim for smaller bundle
      await tsParticles.load({
        id: "tsparticles",
        options: {
          particles: {
            number: {
              value: 80,
              density: {
                enable: true,
                area: 800
              }
            },
            color: {
              value: ["#2EB67D", "#ECB22E", "#E01E5B", "#36C5F0"]
            },
            shape: {
              type: "circle"
            },
            opacity: {
              value: 1
            },
            size: {
              value: { min: 1, max: 8 }
            },
            links: {
              enable: true,
              distance: 150,
              color: "#808080",
              opacity: 0.4,
              width: 1
            },
            move: {
              enable: true,
              speed: 5,
              direction: "none",
              random: false,
              straight: false,
              outModes: "out"
            }
          },
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: "grab"
              },
              onClick: {
                enable: true,
                mode: "push"
              }
            },
            modes: {
              grab: {
                distance: 140,
                links: {
                  opacity: 1
                }
              },
              push: {
                quantity: 4
              }
            }
          },
          detectRetina: true,
          fpsLimit: 120,
        },
      });
    };

    initParticles();
  }, []);

  if (loading) return <div className="loading-screen">Loading portfolio...</div>;
  if (error) return <div className="error-screen">Error: {error.message}</div>;
  if (!data) return null; // Or a loading state

  const { personalInfo, workExperience, projects, education, certifications, trainings } = data;

  return (
    <>
      <div id="tsparticles" aria-hidden="true"></div>

      <Hero
        name={personalInfo?.name || 'Nama Tidak Tersedia'}
        title={personalInfo?.title || 'Judul Tidak Tersedia'}
        onContactClick={() => setIsPopupOpen(true)}
      />

      <main>
        <About
          aboutP1="Experienced IT professional..."
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

      <ContactForm isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </>
  );
}

export default App;