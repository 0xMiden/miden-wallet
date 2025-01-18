import { create } from 'zustand';

export enum MultipleAccountsStep {
  AccountMenu = 'AccountMenu',
  CreateAccount = 'CreateAccount'
}

export enum MultipleAccountsDirection {
  Forward = 'Forward',
  Backward = 'Backward'
}

interface MultipleAccountsState {
  step: MultipleAccountsStep;
  direction: MultipleAccountsDirection;
  setStep: (step: MultipleAccountsStep) => void;
  setDirection: (direction: MultipleAccountsDirection) => void;
}

export const useMultipleAccountsStore = create<MultipleAccountsState>(set => ({
  step: MultipleAccountsStep.AccountMenu,
  direction: MultipleAccountsDirection.Forward,

  setStep: (step: MultipleAccountsStep) => set({ step }),
  setDirection: (direction: MultipleAccountsDirection) => set({ direction })
}));
