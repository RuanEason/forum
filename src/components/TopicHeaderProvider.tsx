"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface TopicHeaderState {
  id: string;
  name: string;
  pathname: string;
  isVisible: boolean;
}

interface TopicHeaderContextValue {
  topicHeader: TopicHeaderState | null;
  registerTopicHeader: (topic: Omit<TopicHeaderState, "isVisible">) => void;
  setTopicHeaderVisibility: (topicId: string, isVisible: boolean) => void;
  clearTopicHeader: (topicId: string) => void;
}

const TopicHeaderContext = createContext<TopicHeaderContextValue | null>(null);

export function TopicHeaderProvider({ children }: { children: React.ReactNode }) {
  const [topicHeader, setTopicHeader] = useState<TopicHeaderState | null>(null);

  const registerTopicHeader = useCallback(
    (topic: Omit<TopicHeaderState, "isVisible">) => {
      setTopicHeader({ ...topic, isVisible: true });
    },
    [],
  );

  const setTopicHeaderVisibility = useCallback(
    (topicId: string, isVisible: boolean) => {
      setTopicHeader((current) =>
        current?.id === topicId ? { ...current, isVisible } : current,
      );
    },
    [],
  );

  const clearTopicHeader = useCallback((topicId: string) => {
    setTopicHeader((current) => (current?.id === topicId ? null : current));
  }, []);

  const value = useMemo(
    () => ({
      topicHeader,
      registerTopicHeader,
      setTopicHeaderVisibility,
      clearTopicHeader,
    }),
    [
      topicHeader,
      registerTopicHeader,
      setTopicHeaderVisibility,
      clearTopicHeader,
    ],
  );

  return (
    <TopicHeaderContext.Provider value={value}>
      {children}
    </TopicHeaderContext.Provider>
  );
}

export function useTopicHeader() {
  const context = useContext(TopicHeaderContext);
  if (!context) {
    throw new Error("useTopicHeader must be used within TopicHeaderProvider");
  }
  return context;
}
