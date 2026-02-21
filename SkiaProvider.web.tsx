import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

export const SkiaProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    LoadSkiaWeb({
      locateFile: (file) => `/static/js/${file}`,
    })
    .then(() => {
      if (isMounted) setReady(true);
    })
    .catch((err) => {
      console.error("Skia failed to load:", err);
    });

    return () => { isMounted = false; };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="cyan" />
      </View>
    );
  }

  return <>{children}</>;
};