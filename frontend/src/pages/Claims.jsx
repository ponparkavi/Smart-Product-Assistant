import React from 'react';
import { AlertTriangle } from 'lucide-react';
import PlaceholderPage from '../components/common/PlaceholderPage';

const Claims = () => {
  return (
    <PlaceholderPage 
      title="Claims Assistance" 
      icon={AlertTriangle} 
      description="Generate warranty claim letters and get step-by-step assistance for defective appliances." 
    />
  );
};

export default Claims;
