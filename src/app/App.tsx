import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RoutePlanner } from './components/RoutePlanner';
import { Emergency } from './components/Emergency';
import { PublicTransport } from './components/PublicTransport';
import { Infrastructure } from './components/Infrastructure';
import { CompareAlgorithms } from './components/CompareAlgorithms';

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'route-planner':
        return <RoutePlanner />;
      case 'emergency':
        return <Emergency />;
      case 'public-transport':
        return <PublicTransport />;
      case 'infrastructure':
        return <Infrastructure />;
      case 'compare':
        return <CompareAlgorithms />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="size-full flex bg-[#0a0a1e] text-white dark">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}