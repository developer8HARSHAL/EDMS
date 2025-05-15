// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import ApplicationRoutes from './components/ApplicationRoutes';
import Navbar from './components/Navbar';

function App() {
  return (
    <ChakraProvider>
      <CSSReset />
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <ApplicationRoutes />
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;