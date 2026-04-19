// File: App.js

import React from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import RootNavigator from './src/navigation/RootNavigator';
import BiometricLockScreen from './src/components/BiometricLockScreen';

const App = () => {
  return (
    <ThemeProvider>
      <AlertProvider>
        <AuthProvider>
          <RootNavigator />
          <BiometricLockScreen />
        </AuthProvider>
      </AlertProvider>
    </ThemeProvider>
  );
};

export default App;
