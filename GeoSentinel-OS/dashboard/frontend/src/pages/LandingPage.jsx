import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, LocateFixed, Recycle, Shield, Sprout, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const awareness = [
  { title: "Cleanliness Drives", desc: "Coordinated field operations keep urban zones hygienic.", icon: <Trash2 size={20} /> },
  { title: "Waste Management", desc: "Track pickup and disposal actions with accountable workflows.", icon: <Recycle size={20} /> },
  { title: "Urban Plantation", desc: "Tree-planting initiatives monitored with geotagged evidence.", icon: <Sprout size={20} /> },
];

const sdgCards = [
  "SDG 6: Clean Water",
  "SDG 11: Sustainable Cities",
  "SDG 13: Climate Action",
];

const features = [
  { title: "GPS Tracking", desc: "Live workforce movement with location confidence.", icon: <LocateFixed size={20} /> },
  { title: "Task Monitoring", desc: "From assignment to proof upload with lifecycle visibility.", icon: <Shield size={20} /> },
  { title: "Transparency", desc: "Audit-ready logs and role-based accountability at every level.", icon: <Leaf size={20} /> },
];

function FadeSection({ children, delay = 0, id }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
      className="mx-auto max-w-6xl px-4 py-16 md:px-6"
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="hero-grid city-overlay overflow-hidden border-b border-civic-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 inline-flex rounded-full bg-eco-100 px-3 py-1 text-sm font-semibold text-eco-700">GeoSentinel OS</p>
            <h1 className="text-4xl font-extrabold leading-tight text-civic-900 md:text-5xl">
              Smart Governance for Clean & Sustainable Cities
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-700">
              A modern municipal command platform for workforce tracking, environmental stewardship, and transparent public service delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="action-btn bg-civic-600 text-white hover:bg-civic-700">
                Login <ArrowRight className="ml-2" size={16} />
              </Link>
              <a href="#awareness" className="action-btn border border-civic-200 bg-white text-civic-700 hover:bg-civic-50">
                Learn More
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-8 -top-8 h-36 w-36 animate-soft-pulse rounded-full bg-eco-200/60 blur-2xl" />
            <div className="absolute -bottom-8 -right-8 h-36 w-36 animate-soft-pulse rounded-full bg-civic-200/60 blur-2xl" />
            <div className="glass-card relative h-full p-6">
              <h3 className="text-xl font-bold text-civic-900">Real-time City Intelligence</h3>
              <ul className="mt-4 space-y-3 text-slate-700">
                <li>Live attendance and route traceability</li>
                <li>Role-based decisions from state to worker level</li>
                <li>Fund-backed task execution and impact reporting</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </header>

      <FadeSection id="awareness">
        <h2 className="section-title">Awareness and Public Impact</h2>
        <p className="section-subtitle">Drive behavioral change with data-backed cleanliness and sustainability initiatives.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {awareness.map((item) => (
            <div key={item.title} className="glass-card p-5">
              <div className="mb-3 inline-flex rounded-xl bg-eco-100 p-2 text-eco-700">{item.icon}</div>
              <h3 className="font-bold text-civic-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      <FadeSection delay={0.08}>
        <h2 className="section-title">Sustainability Goals</h2>
        <p className="section-subtitle">Built to align municipal execution with global sustainable development priorities.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {sdgCards.map((title) => (
            <div key={title} className="group glass-card p-5 transition hover:-translate-y-1 hover:border-eco-300">
              <p className="text-sm font-semibold uppercase tracking-wider text-eco-700">SDG Alignment</p>
              <h3 className="mt-2 text-xl font-bold text-civic-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">Measurable action plans through verifiable tasks, location data, and audit logs.</p>
            </div>
          ))}
        </div>
      </FadeSection>

      <FadeSection delay={0.12}>
        <h2 className="section-title">Core Platform Features</h2>
        <p className="section-subtitle">Designed for trust, accountability, and operational speed.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((item) => (
            <div key={item.title} className="glass-card p-5">
              <div className="mb-3 inline-flex rounded-xl bg-civic-100 p-2 text-civic-700">{item.icon}</div>
              <h3 className="font-bold text-civic-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-6">
          <p>GeoSentinel OS • Smart Governance for Sustainable Municipal Operations</p>
          {/* TODO: Replace placeholders with real routes when About/Contact/Government Services pages are implemented. */}
          <div className="flex gap-4">
            <span className="cursor-not-allowed text-slate-400" aria-disabled="true">About</span>
            <span className="cursor-not-allowed text-slate-400" aria-disabled="true">Contact</span>
            <span className="cursor-not-allowed text-slate-400" aria-disabled="true">Government Services</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
