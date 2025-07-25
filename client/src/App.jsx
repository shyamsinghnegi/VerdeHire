// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EmployeeToolPage from './pages/EmployeeToolPage';
import EmployerToolPage from './pages/EmployerToolPage'; // NEW: Import EmployerToolPage

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/employee-tool" element={<EmployeeToolPage />} />
          <Route path="/employer-tool" element={<EmployerToolPage />} /> {/* NEW: Route for Employer Tool */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
