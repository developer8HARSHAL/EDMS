// src/pages/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Shield, Search, FolderOpen, Clock } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FolderOpen className="w-8 h-8" />,
      title: "Organize Documents",
      description: "Keep all your files structured and easily accessible in organized workspaces"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Share and collaborate on documents with your team members seamlessly"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Storage",
      description: "Your documents are protected with enterprise-grade security measures"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Quick Search",
      description: "Find any document instantly with powerful search capabilities"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Version Control",
      description: "Track changes and access previous versions of your documents"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Multiple Formats",
      description: "Support for various document types and file formats"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
     
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-200">
            Document Management Made Simple
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 transition-colors duration-200">
            Organize, share, and manage your documents efficiently with powerful workspace tools
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition-colors duration-200"
            >
              Get Started
            </button>
            <button 
              onClick={() => {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white px-8 py-3 rounded-md font-medium border border-gray-300 dark:border-slate-700 transition-colors duration-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
            Powerful Features
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg transition-colors duration-200">
            Everything you need to manage your documents effectively
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200 hover:shadow-md"
            >
              <div className="text-blue-500 dark:text-blue-400 mb-4 transition-colors duration-200">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-12 text-center border border-gray-200 dark:border-slate-700 transition-colors duration-200">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 transition-colors duration-200">
            Create your account and start managing your documents today
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition-colors duration-200"
          >
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10? rounded-lg flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-18 h-10" />
                  {/* <FileText className="w-6 h-6 text-white" /> */}
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">DocManager</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-200">
                Professional document management solution
              </p>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4 transition-colors duration-200">Product</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li>
                  <button 
                    onClick={() => {
                      const featuresSection = document.getElementById('features');
                      if (featuresSection) {
                        featuresSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    Features
                  </button>
                </li>
                <li><a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Pricing</a></li>
                <li><a href="#security" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4 transition-colors duration-200">Company</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#about" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">About</a></li>
                <li><a href="#contact" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4 transition-colors duration-200">Legal</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Privacy</a></li>
                <li><a href="#terms" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-800 text-center text-gray-600 dark:text-gray-400 text-sm transition-colors duration-200">
            <p>&copy; 2025 DocManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;