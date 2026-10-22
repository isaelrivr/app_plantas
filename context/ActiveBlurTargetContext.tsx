import React, { createContext, useContext, useState, useCallback, RefObject } from 'react';
import { View } from 'react-native';

interface ActiveBlurTargetContextValue {
  activeBlurTargetRef: RefObject<View | null> | null;
  setActiveBlurTargetRef: (ref: RefObject<View | null> | null) => void;
}

const ActiveBlurTargetContext = createContext<ActiveBlurTargetContextValue>({
  activeBlurTargetRef: null,
  setActiveBlurTargetRef: () => {},
});

export const ActiveBlurTargetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBlurTargetRef, setActiveRef] = useState<RefObject<View | null> | null>(null);

  const setActiveBlurTargetRef = useCallback((ref: RefObject<View | null> | null) => {
    setActiveRef(ref);
  }, []);

  return (
    <ActiveBlurTargetContext.Provider value={{ activeBlurTargetRef, setActiveBlurTargetRef }}>
      {children}
    </ActiveBlurTargetContext.Provider>
  );
};

export const useActiveBlurTarget = (): ActiveBlurTargetContextValue => {
  return useContext(ActiveBlurTargetContext);
};
