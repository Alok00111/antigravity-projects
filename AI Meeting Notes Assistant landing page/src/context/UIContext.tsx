"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ModalView = "login" | "signup";

interface UIContextType {
  isModalOpen: boolean;
  modalView: ModalView;
  openModal: (view?: ModalView) => void;
  closeModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalView>("signup");

  const openModal = (view: ModalView = "signup") => {
    setModalView(view);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <UIContext.Provider value={{ isModalOpen, modalView, openModal, closeModal }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
