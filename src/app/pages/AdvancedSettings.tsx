import React, { FC, ReactNode, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as VectorIcon } from 'app/icons/vector.svg';

type AdvancedSettingsProps = {
  children: ReactNode;
};

const popupListClassNames = [
  'absolute',
  'top-100',
  'right-0',
  'rounded',
  'bg-white',
  'z-50',
  'overflow-visible',
  'mt-1'
];

const evenLiStyles = ['hover:bg-black hover:bg-opacity-5', 'cursor-pointer'];
const oddLiStyles = ['bg-black', 'bg-opacity-5', 'hover:bg-opacity-10', 'cursor-pointer'];

const AdvancedSettings: FC<AdvancedSettingsProps> = ({ children }) => {
  const [settingsClicked, setSettingsClicked] = useState(false);

  return (
    <div className="relative">
      <div
        className={classNames(
          'px-3 py-3',
          'rounded',
          'flex',
          'text-black font-bold text-shadow-black',
          'hover:bg-black hover:bg-opacity-5',
          'transition duration-300 ease-in-out',
          'opacity-90 hover:opacity-100',
          'cursor-pointer'
        )}
        style={{ fontSize: 16, lineHeight: '20px' }}
        onClick={() => setSettingsClicked(!settingsClicked)}
      >
        <VectorIcon />
      </div>
      {settingsClicked && (
        <div
          className={classNames(...popupListClassNames)}
          style={{ width: 143, boxShadow: '0px 3px 32px 0px #0C0C0D29' }}
        >
          <ul className="list-none p-2 m-0">
            {React.Children.map(children, (child, index) => {
              let styles = index % 2 === 0 ? evenLiStyles : oddLiStyles;
              return (
                <li key={index} className={classNames(...styles)}>
                  {child}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettings;
