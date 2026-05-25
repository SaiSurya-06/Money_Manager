import React from 'react';
import * as Icons from 'lucide-react';

export const Icon = ({ name, className = '', size = 20 }) => {
  // Safe lookup: match naming convention or fallback to default
  const LucideIcon = Icons[name] || Icons.HelpCircle;
  return <LucideIcon className={className} size={size} />;
};

export default Icon;
