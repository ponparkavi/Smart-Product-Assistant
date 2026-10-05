import React from 'react';
import { Wrench } from 'lucide-react';
import PlaceholderPage from '../components/common/PlaceholderPage';

const Maintenance = () => {
  return (
    <PlaceholderPage 
      title="Predictive Maintenance" 
      icon={Wrench} 
      description="View upcoming maintenance schedules and receive AI-driven tips to extend the lifespan of your appliances." 
    />
  );
};

export default Maintenance;
