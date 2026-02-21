// SkiaProvider.tsx (Native version)
import React from 'react';

// On native, Skia is already initialized by the JSI/C++ layer, 
// so we just return the children immediately.
export const SkiaProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};