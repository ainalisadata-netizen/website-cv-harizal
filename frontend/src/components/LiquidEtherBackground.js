// src/components/LiquidEtherBackground.js
import * as THREE from 'three'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { shaderMaterial } from '@react-three/drei'
import { Leva, useControls } from 'leva'

const randomRange = (min, max) => Math.random() * (max - min) + min;

const ColorShaderMaterial = shaderMaterial(
  {
    time: 0,
    uColor: new THREE.Color(0.0, 0.0, 0.0),
    mouse: new THREE.Vector2(0.0, 0.0),
  },
  /*glsl*/`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /*glsl*/`
    varying vec2 vUv;
    uniform float time;
    uniform vec3 uColor;
    uniform vec2 mouse;
    
    #define NUM_OCTAVES 5

    float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p){
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u*u*(3.0-2.0*u);
      
      float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
      return res*res;
    }

    float fbm(vec2 x) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
      for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 newUv = vUv;
      float f = 0.0;
      
      vec2 q = vec2(0.);
      q.x = fbm( newUv + 0.1*time);
      q.y = fbm( newUv + vec2(1.0));

      vec2 r = vec2(0.);
      r.x = fbm( newUv + 1.0*q + vec2(1.7,9.2)+ 0.15*time );
      r.y = fbm( newUv + 1.0*q + vec2(8.3,2.8)+ 0.126*time);
      
      f = fbm(newUv+r);
      
      vec3 color = mix(vec3(0.10, 0.10, 0.10), // Darker background color
                       vec3(0.07, 0.15, 0.25), // Main wave color (e.g., a dark blue)
                       clamp((f*f)*4.0,0.0,1.0));

      color = mix(color,
                  vec3(0.0, 0.2, 0.4), // Highlight color
                  clamp(length(q),0.0,1.0));

      color = mix(color,
                  vec3(0.8, 0.9, 1.0), // Brightest highlight color
                  clamp(length(r.x),0.0,1.0));

      gl_FragColor = vec4((f*f*f+.6*f*f+.5*f)*color, 1.);
    }
  `
);

extend({ ColorShaderMaterial });

const Scene = () => {
    const shaderRef = useRef();

    const { intensity, animate } = useControls({
        intensity: { value: 1.2, min: 0, max: 2, step: 0.1 },
        animate: true,
    });

    useFrame(({ clock, mouse }) => {
        if(shaderRef.current) {
            shaderRef.current.time = clock.getElapsedTime();
            shaderRef.current.mouse.x = mouse.x * intensity;
            shaderRef.current.mouse.y = mouse.y * intensity;
        }
    });

    return (
        <mesh>
            <planeGeometry args={[10, 10, 1, 1]} />
            <colorShaderMaterial ref={shaderRef} />
        </mesh>
    );
};

const LiquidEtherBackground = () => {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
            <Canvas camera={{ position: [0.0, 0.0, 2.0] }}>
                <Scene />
            </Canvas>
            <Leva hidden />
        </div>
    );
};

export default LiquidEtherBackground;