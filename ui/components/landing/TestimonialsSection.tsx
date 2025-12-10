"use client"

import { motion } from 'framer-motion'
import ShinyText from '@/components/reactbits/text-animation/ShinyText'
import FloatingLines from '@/components/reactbits/backgrounds/FloatingLines'
import DotGrid from '@/components/reactbits/backgrounds/DotGrid'
import { Quote, Sparkles } from 'lucide-react'
import '@/components/reactbits/text-animation/ShinyText.css'
import '@/components/reactbits/backgrounds/FloatingLines.css'
import '@/components/reactbits/backgrounds/DotGrid.css'

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      company: "TechCorp",
      quote: "ContextOS transformed how I manage product roadmaps. No more context switching hell. Everything I need is automatically organized and accessible.",
      avatar: "SC",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Marcus Rodriguez",
      role: "Senior Developer",
      company: "DevStudio",
      quote: "Finally, an AI tool that actually understands my workflow. The automatic task extraction from code reviews and Slack messages is pure magic.",
      avatar: "MR",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      name: "Emily Watson",
      role: "PhD Researcher",
      company: "MIT",
      quote: "As a researcher juggling 20+ papers and experiments, ContextOS keeps everything in context. The OCR feature alone saves me hours every week.",
      avatar: "EW",
      gradient: "from-orange-500 to-red-500"
    }
  ]

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-black">
      {/* FloatingLines Background */}
      <div className="absolute inset-0 opacity-20">
        <FloatingLines 
        linesGradient={['#ffffff', '#cccccc']}
        topWavePosition={0} 
        middleWavePosition={'50%'}
        />
      </div>
      
      {/* DotGrid Background */}
      <div className="absolute inset-0 opacity-10">
        <DotGrid style={{}} />
      </div>
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(168,85,247,0.05),transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-md border border-green-500/20 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
            <ShinyText 
              text="What Our Users Say"
              className="text-sm font-medium text-green-200"
              speed={3}
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6"
          >
            Loved by Professionals
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg sm:text-xl text-slate-300/90 max-w-3xl mx-auto"
          >
            See how ContextOS is transforming workflows across industries
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: index * 0.15, 
                duration: 0.7,
                type: "spring"
              }}
              className="group"
            >
              {/* Glass Card */}
              <div className="relative h-full p-8 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-purple-500/10">
                {/* Quote Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.15 + 0.3, 
                    duration: 0.6,
                    type: "spring"
                  }}
                  className="mb-6"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${testimonial.gradient} shadow-lg`}>
                    <Quote className="w-6 h-6 text-white" />
                  </div>
                </motion.div>

                {/* Quote Text */}
                <blockquote className="text-slate-200 text-lg leading-relaxed mb-8 relative z-10">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center gap-4 relative z-10">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="text-white font-black text-lg">
                      {testimonial.avatar}
                    </span>
                  </div>

                  {/* Name & Role */}
                  <div>
                    <div className="text-white font-bold text-lg">
                      {testimonial.name}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>

                {/* Bottom Accent Line */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${testimonial.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Gradient Overlay on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-3xl pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
