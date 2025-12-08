// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TrainingPage } from "./pages/TrainingPage";
import { MyVideosPage } from "./pages/MyVideosPage";
import { AdminPage } from "./pages/AdminPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminRoute } from "./components/AdminRoute";

import { TestPage } from "./pages/CaptureTest";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-root">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/test" element={<TestPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/training"
              element={
                <ProtectedRoute>
                  <TrainingPage />
                </ProtectedRoute>
              }
            />
            <Route path="/videos" element={<MyVideosPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;

// Regacy

// import { useEffect, useState } from 'react';
// import SkeletonViewer from './components/SkeletonViewer';
// import { CsvAdapter } from './core/adapter/CsvAdapter';
// import { DataProvider } from './core/DataProvider';


// function App() {
//   const [provider, setProvider] = useState<DataProvider | null>(null);

//   useEffect(() => {
//     const adapter = new CsvAdapter('test_data/holistic_named_xyz_output_labelled.csv');
//     const dp = new DataProvider(adapter);
//     dp.init().then(() => setProvider(dp));
//   }, []);

//   return (
//     <div>
//       <h1>Skeleton Viewer</h1>
//       {provider ? <SkeletonViewer provider={provider} width={800} height={600} /> : <p>Loading...</p>}
//     </div>
//   );
// }

// export default App;

// import CaptureController from './components/CaptureController';

// function App() {
//   return (
//     <div>
//       <h1>Live 3D</h1>
//       <CaptureController />
//     </div>
//   );
// }

// export default App;