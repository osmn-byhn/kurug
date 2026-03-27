import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Settings from '../pages/Settings';
import WidgetSettings from '../pages/WidgetSettings';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/widget-settings" element={<WidgetSettings />} />
    </Routes>
  );
};

export default AppRoutes;
