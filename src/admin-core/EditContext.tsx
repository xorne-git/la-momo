import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface EditContextType {
  activeKey: string | null;
  dirtyKey: string | null;
  hoveredKey: string | null;
  requestEdit: (key: string) => boolean;
  releaseEdit: (key: string) => void;
  forceSwitchEdit: (key: string) => void;
  setDirty: (key: string | null) => void;
  setHovered: (key: string | null) => void;
}

const EditContext = createContext<EditContextType>({
  activeKey: null,
  dirtyKey: null,
  hoveredKey: null,
  requestEdit: () => true,
  releaseEdit: () => {},
  forceSwitchEdit: () => {},
  setDirty: () => {},
  setHovered: () => {},
});

export function EditProvider({ children }: { children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [dirtyKey, setDirtyKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const requestEdit = useCallback((key: string): boolean => {
    if (activeKey === null || activeKey === key) {
      setActiveKey(key);
      return true;
    }
    return false;
  }, [activeKey]);

  const releaseEdit = useCallback((key: string) => {
    setActiveKey((prev) => prev === key ? null : prev);
    setDirtyKey((prev) => prev === key ? null : prev);
  }, []);

  const forceSwitchEdit = useCallback((key: string) => {
    setActiveKey(key);
    setDirtyKey(null);
  }, []);

  const setDirty = useCallback((key: string | null) => {
    setDirtyKey(key);
  }, []);

  const setHovered = useCallback((key: string | null) => {
    setHoveredKey(key);
  }, []);

  return (
    <EditContext.Provider value={{ activeKey, dirtyKey, hoveredKey, requestEdit, releaseEdit, forceSwitchEdit, setDirty, setHovered }}>
      {children}
    </EditContext.Provider>
  );
}

export function useEditContext() {
  return useContext(EditContext);
}
