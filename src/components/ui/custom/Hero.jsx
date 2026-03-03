import React from 'react'
import { Button } from '../button'
import { Link } from 'react-router-dom'

function Hero() {
  return (
    <div className="min-h-screen w-full bg-white text-black flex flex-col items-center justify-center px-6 text-center">
      
      <div className="max-w-5xl flex flex-col items-center gap-9">
        
        <h1 className="font-extrabold text-[40px] md:text-[50px] leading-tight">
          <span className="text-[#f56551]">Discover Your Next Adventure With AI:</span>
          <br />
          Personalized Itineraries at Your Fingertips
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-3xl">
          Your personal trip planner and travel curator, creating custom itineraries tailored to your interests and budget.
        </p>

        <Link to="/create-trip">
          <Button className="px-6 py-3 text-lg">
            Get Started
          </Button>
        </Link>

      </div>
    </div>
  )
}


export default Hero
