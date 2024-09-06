import React from 'react';

export interface RadioProps {
  name: string;
  value: boolean;
  onChange?: (value: boolean) => void;
}

export const RadioButton: React.FC<RadioProps> = ({ name, value, onChange }) => {
  const borderWidth = value ? 'border-0' : 'border-2';
  const backgroundColor = value ? 'bg-primary-500' : 'bg-white';

  return (
    <label
      className={`${borderWidth} ${backgroundColor} rounded-full relative flex items-center justify-center w-6 aspect-square border-grey-200`}
    >
      {value && <div className="rounded-full w-3 aspect-square bg-white" />}
      <input type="radio" checked={value} onChange={() => onChange?.(!value)} className="hidden" />
    </label>
  );
};
