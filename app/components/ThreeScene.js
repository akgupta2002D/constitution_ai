import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'

const Model = () => {
  const { scene } = useGLTF('/models/flag.glb') // Update with your actual path to the GLB file
  const modelRef = useRef()

  // Function to update model's rotation based on mouse movement
  useFrame(state => {
    if (modelRef.current) {
      const { mouse } = state
      modelRef.current.rotation.y = mouse.x * Math.PI * 0.2
      modelRef.current.rotation.x = -mouse.y * Math.PI * 0.2
    }
  })

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={[0.5, 0.5, 0.5]}
      position={[0, -0.5, 0]}
    />
  )
}

const ThreeScene = () => {
  return (
    <Canvas style={{ height: '100%', width: '100%' }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <Model />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
      />
    </Canvas>
  )
}

export default ThreeScene
