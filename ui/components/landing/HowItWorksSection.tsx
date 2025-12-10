"use client"

import { motion } from 'framer-motion'
import ShinyText from '@/components/reactbits/text-animation/ShinyText'
import TiltedCard from '@/components/TiltedCard'
import { Camera, Brain, Workflow, Sparkles } from 'lucide-react'
import '@/components/reactbits/text-animation/ShinyText.css'
import '@/components/TiltedCard.css'
import React, { ReactNode } from 'react';

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      icon: <Camera className="w-12 h-12" />,
      title: "Capture",
      description: "Chrome Extension auto-captures screenshots, text, and context from your entire workflow. Every window, every tab, every meeting - nothing slips through.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.1), #000)"
    },
    {
      number: "02",
      icon: <Brain className="w-12 h-12" />,
      title: "Analyze",
      description: "Oumi agent extracts tasks, summaries, entities, and actionable insights using advanced LLMs. Your context becomes structured intelligence.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1), #000)"
    },
    {
      number: "03",
      icon: <Workflow className="w-12 h-12" />,
      title: "Orchestrate",
      description: "Kestra schedules parsing, cleaning, memory pruning, and daily planning workflows. Everything runs automatically in the background.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.1), #000)"
    },
    {
      number: "04",
      icon: <Sparkles className="w-12 h-12" />,
      title: "Act",
      description: "Daily AI Planner shows your entire day optimized, prioritized, and ready to execute. Wake up to a perfect plan every morning.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1), #000)"
    }
  ]

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-black">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-black to-teal-900/20" />
      
      {/* Animated Pipeline Line */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <ShinyText 
              text="4-Step AI Pipeline"
              className="text-sm font-medium text-purple-200"
              speed={3}
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-6"
          >
            How It Works
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg sm:text-xl text-slate-300/90 max-w-3xl mx-auto"
          >
            From raw screenshots to intelligent daily plans in four seamless steps
          </motion.p>
        </div>

        {/* TiltedCard Grid - Interactive 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <TiltedCard
                captionText={step.title}
                containerHeight="500px"
                containerWidth="100%"
                scaleOnHover={1.05}
                rotateAmplitude={8}
                showMobileWarning={false}
                showTooltip={true}
                displayOverlayContent={true}
                overlayContent={
                  <div 
                    className="relative w-full h-full p-10 rounded-3xl border border-white/20 overflow-hidden"
                    style={{
                      background: step.bgGradient,
                    }}
                  >
                    {/* Number Badge - Large */}
                    <div className="absolute top-8 right-8 opacity-10">
                      <span className="text-[180px] font-black text-white leading-none">
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="inline-flex items-center justify-center p-5 rounded-2xl bg-white/10 mb-6">
                        <div className="text-white">
                          {step.icon}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-white/80 text-lg leading-relaxed">
                        {step.description}
                      </p>

                      {/* Step Indicator */}
                      <div className="mt-6 flex items-center gap-3">
                        <span className="text-white/40 text-sm font-medium">STEP</span>
                        <span className="text-white text-2xl font-black">{step.number}</span>
                        <div className="flex-1 h-[2px] bg-white/20 rounded-full">
                          <div 
                            className="h-full bg-white/60 rounded-full transition-all duration-500"
                            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-slate-400 text-lg">
            All automated. All intelligent. All built for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-bold">
              you
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorksSection
