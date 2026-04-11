import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanLine, Activity, ShieldCheck, ArrowRight, Smartphone, Cpu, BarChart3, X, ChevronRight } from 'lucide-react';

export const Explore: React.FC = () => {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const features = [
    {
      image: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Instant Scanning',
      description: 'Just snap a photo of any nutrition label and our AI extracts the data instantly with high precision.',
      details: 'Our advanced OCR technology handles blurry images, curved surfaces, and various lighting conditions to ensure 99.9% data accuracy.',
      color: 'text-cyan-600',
      glow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]'
    },
    {
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Health Scoring',
      description: 'Get a comprehensive health score based on your personal dietary goals, allergies, and preferences.',
      details: 'The NutriScore algorithm analyzes 20+ data points including macro-ratios, micronutrient density, and processing levels.',
      color: 'text-teal-600',
      glow: 'shadow-[0_0_15px_rgba(45,212,191,0.2)]'
    },
    {
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Risk Analysis',
      description: 'Identify hidden sugars, high sodium, and unhealthy fats before you consume them.',
      details: 'We flag over 500+ potentially harmful additives and preservatives, cross-referencing them with global health databases.',
      color: 'text-purple-600',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    },
    {
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Trend Tracking',
      description: 'Visualize your nutritional habits over time and see how your choices impact your health score.',
      details: 'Interactive charts show your progress across weeks and months, helping you identify patterns in your eating habits.',
      color: 'text-blue-600',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]'
    }
  ];

  const articles = [
    {
      title: 'The Power of Protein',
      category: 'Nutrition 101',
      excerpt: 'Learn why protein is essential for muscle repair, hormone production, and overall vitality.',
      content: 'Protein is a macronutrient that is essential to building muscle mass. It is commonly found in animal products, though is also present in other sources, such as nuts and legumes. Chemically, protein is composed of amino acids, which are organic compounds made of carbon, hydrogen, nitrogen, oxygen or sulfur.',
      image: 'https://images.unsplash.com/photo-1529566652340-2c41a1eb6d93?auto=format&fit=crop&q=80&w=800&h=450'
    },
    {
      title: 'Hidden Sugars: What to Watch For',
      category: 'Health Risks',
      excerpt: 'Discover the many names of sugar and how to spot them on nutrition labels.',
      content: 'Sugar goes by many names: high fructose corn syrup, maltodextrin, dextrose, and more. Consuming too much added sugar can lead to weight gain, type 2 diabetes, and heart disease. NutriScan helps you identify these hidden risks instantly.',
      image: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?auto=format&fit=crop&q=80&w=800&h=450'
    },
    {
      title: 'Understanding Micronutrients',
      category: 'Vitamins & Minerals',
      excerpt: 'Why vitamins and minerals are just as important as calories and macros.',
      content: 'Micronutrients are one of the major groups of nutrients your body needs. They include vitamins and minerals. Vitamins are necessary for energy production, immune function, blood clotting and other functions. Meanwhile, minerals play an important role in growth, bone health, fluid balance and several other processes.',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800&h=450'
    },
    {
      title: 'The Truth About Fats',
      category: 'Healthy Eating',
      excerpt: 'Not all fats are created equal. Learn the difference between saturated, unsaturated, and trans fats.',
      content: 'Fats are a type of nutrient that you get from your diet. It is essential to eat some fats, though it is also harmful to eat too much. The fats you eat give your body the energy it needs to work properly. During exercise, your body uses calories from carbohydrates you have eaten. But after 20 minutes, exercise then depends on calories from fat to keep you going.',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800&h=450'
    },
    {
      title: 'Hydration and Health',
      category: 'Wellness',
      excerpt: 'How water intake affects your metabolism, skin health, and cognitive function.',
      content: 'Water is the main chemical component of your body and makes up about 50% to 70% of your body weight. Your body depends on water to survive. Every cell, tissue and organ in your body needs water to work properly.',
      image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=800&h=450'
    },
    {
      title: 'Fiber: The Unsung Hero',
      category: 'Digestion',
      excerpt: 'Why dietary fiber is crucial for gut health and maintaining a healthy weight.',
      content: 'Dietary fiber — found mainly in fruits, vegetables, whole grains and legumes — is probably best known for its ability to prevent or relieve constipation. But foods containing fiber can provide other health benefits as well, such as helping to maintain a healthy weight and lowering your risk of diabetes, heart disease and some types of cancer.',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800&h=450'
    }
  ];

  const steps = [
    {
      image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Capture',
      description: 'Open the scanner and take a clear photo of the nutrition facts label on any food packaging.'
    },
    {
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Process',
      description: 'Our advanced neural networks analyze the image, extracting every nutrient and ingredient.'
    },
    {
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Analyze',
      description: 'The system compares the data against global health standards and your personal profile.'
    },
    {
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400&h=400',
      title: 'Decide',
      description: 'Receive a clear health score and detailed breakdown to help you make an informed choice.'
    }
  ];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
      <div className="w-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-[var(--text-heading)] tracking-tight">
            Explore <span className="neon-text">NutriScan</span>
          </h1>
          <p className="text-lg text-[var(--text-color)] max-w-2xl mx-auto font-medium">
            Discover how our AI-powered platform transforms the way you understand nutrition and health.
          </p>
        </motion.div>

        {/* Features Section with Accordion */}
        <section id="features" className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-[var(--border-color)]" />
            <h2 className="text-3xl font-black text-[var(--text-heading)]">Advanced Capabilities</h2>
            <div className="h-px flex-1 bg-[var(--border-color)]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-3xl overflow-hidden cursor-pointer group hover:border-cyan-500 transition-all duration-300"
                onClick={() => setExpandedFeature(expandedFeature === idx ? null : idx)}
              >
                <div className="p-8 flex items-start gap-6">
                  <div className={`w-20 h-20 rounded-2xl overflow-hidden bg-slate-900/50 flex items-center justify-center shrink-0 border border-white/10 transition-all ${feature.glow} group-hover:scale-110 duration-300`}>
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-[var(--text-heading)] mb-2">{feature.title}</h3>
                      <motion.div
                        animate={{ rotate: expandedFeature === idx ? 180 : 0 }}
                        className="text-[var(--text-muted)]"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </motion.div>
                    </div>
                    <p className="text-[var(--text-color)] font-medium leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <AnimatePresence>
                      {expandedFeature === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-6 mt-6 border-t border-[var(--border-color)]">
                            <p className="text-cyan-400 text-sm font-bold leading-relaxed italic">
                              {feature.details}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Nutrition Education Articles */}
        <section id="education" className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-[var(--border-color)]" />
            <h2 className="text-3xl font-black text-[var(--text-heading)] tracking-tight">Nutrition <span className="text-emerald-500">Insights</span></h2>
            <div className="h-px flex-1 bg-[var(--border-color)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((article, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass-card rounded-[2rem] overflow-hidden flex flex-col group hover:border-emerald-500 transition-all duration-500"
              >
                <div className="h-56 overflow-hidden relative">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 px-4 py-1.5 bg-emerald-500 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                    {article.category}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black text-[var(--text-heading)] mb-4 group-hover:text-emerald-500 transition-colors leading-tight">{article.title}</h3>
                  <p className="text-[var(--text-color)] text-sm mb-8 flex-1 leading-relaxed font-medium">
                    {article.excerpt}
                  </p>
                  <button 
                    onClick={() => setSelectedArticle(article)}
                    className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest hover:gap-4 transition-all"
                  >
                    Read Full Article <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-[var(--border-color)]" />
            <h2 className="text-3xl font-black text-[var(--text-heading)]">How it Works</h2>
            <div className="h-px flex-1 bg-[var(--border-color)]" />
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 hidden lg:block -translate-y-1/2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-teal-500 mx-auto mb-6 relative shadow-[0_0_35px_rgba(20,184,166,0.2)]">
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-sm z-20 border-2 border-slate-900">
                      {idx + 1}
                    </div>
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-xl font-black text-[var(--text-heading)] mb-2">{step.title}</h3>
                  <p className="text-[var(--text-color)] text-sm font-medium">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setSelectedArticle(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] glass-card rounded-[2.5rem] overflow-hidden flex flex-col"
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-black/20 hover:bg-red-500/20 text-white hover:text-red-500 rounded-full flex items-center justify-center transition-all z-20 border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="h-64 md:h-96 relative">
                  <img 
                    src={selectedArticle.image} 
                    alt={selectedArticle.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg mb-4 inline-block">
                      {selectedArticle.category}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-[var(--text-heading)] tracking-tight leading-tight">
                      {selectedArticle.title}
                    </h2>
                  </div>
                </div>
                
                <div className="p-8 md:p-12">
                  <p className="text-xl text-[var(--text-heading)] font-bold leading-relaxed mb-8 border-l-4 border-emerald-500 pl-6 py-2 bg-emerald-500/10 rounded-r-2xl italic">
                    {selectedArticle.excerpt}
                  </p>
                  <div className="prose max-w-none">
                    <p className="text-[var(--text-color)] text-lg leading-relaxed whitespace-pre-wrap">
                      {selectedArticle.content}
                    </p>
                    <p className="text-[var(--text-color)] text-lg leading-relaxed mt-6">
                      Understanding your nutrition is the first step towards a healthier life. NutriScan is here to help you make sense of the data and make better choices every day.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
