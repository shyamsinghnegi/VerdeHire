// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Corrected import paths to ./pages
import HomePage from './pages/HomePage';
import EmployeeToolPage from './pages/EmployeeToolPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/employee-tool" element={<EmployeeToolPage />} />
          {/* Add more routes here as needed, e.g., for employer side later */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
