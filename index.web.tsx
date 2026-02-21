// index.web.tsx
import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// Just render the app; the Provider inside App.tsx will handle Skia
renderRootComponent(App);