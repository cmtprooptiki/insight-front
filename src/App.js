import React from 'react';
import { BrowserRouter,Routes, Route } from 'react-router-dom';
import Login from "./components/Login";

import Home from './pages/Home';
import PMOverview from './pages/pm_overview_page/PMOverview';
import Layout from './pages/Layout';
import ProjectOverview from './pages/project_overview_page/ProjectOverview';
import UsersOverview from './pages/users_overview_page/UsersOverview';
import Dashboard from './pages/dashboard_page/Dashboard';
import UserRates from './pages/UserRates_page/UserRates';
import { PrimeReactProvider } from 'primereact/api';

function App() {


 const value = {
    ripple: true,
    
};

  return (
    <div>
     
      <PrimeReactProvider value={value}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />}></Route>
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>}></Route>

            <Route path="/user-rates" element={<Layout><UserRates /></Layout>} />
            {/* <Route path="/" element={<Home />} /> */}
            <Route path="/pmoverview" element={<Layout><PMOverview /></Layout>} />
            <Route path="/usersoverview" element={<Layout><UsersOverview /></Layout>} />
            <Route path="/projectoverview" element={<Layout><ProjectOverview /></Layout>} />
          </Routes>
        </BrowserRouter>
      </PrimeReactProvider>
    </div>
  );
}

export default App;
