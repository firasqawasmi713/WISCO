import React from 'react';
import { Drive as DriveComponent } from './Drive.jsx';
import { LanguageCode } from '../types';

export interface DriveProps {
  userId?: string | null;
  lang?: LanguageCode;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Drive: React.FC<DriveProps> = (props) => {
  return <DriveComponent {...props} />;
};

export const DriveView = Drive;

export default Drive;
