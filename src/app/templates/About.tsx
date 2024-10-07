import React, { FC } from 'react';

import Logo from 'app/atoms/Logo';
import { T } from 'lib/i18n/react';

import MenuItem from './MenuItem';

const About: FC = () => (
  <div className="flex flex-col items-center mt-4">
    <div className="flex flex-col items-center justify-center">
      <Logo style={{ height: 60, filter: '' }} />

      <div className="text-center">
        <T id="appName">{message => <h4 className="text-xl font-semibold">{message}</h4>}</T>
        <T id="versionLabel" substitutions={[<span key="version">{process.env.VERSION}</span>]}>
          {message => <p className="text-sm text-gray-200">{message}</p>}
        </T>
      </div>
    </div>

    <T id="buildForAleo">{message => <p className="mt-8 text-black text-base">{message}</p>}</T>
    <T
      id="poweredBy"
      substitutions={[
        <a
          href="https://demoxlabs.xyz"
          key="link"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base hover:underline"
          style={{ color: '#3872D4' }}
        >
          Demox Labs
        </a>
      ]}
    >
      {message => <p className="mt-1 text-black text-sm">{message}</p>}
    </T>

    <div className="flex flex-col w-full py-2">
      {[
        {
          key: 'website',
          link: 'https://leo.app',
          insertHR: false
        },
        {
          key: 'privacyPolicy',
          link: 'https://leo.app/privacy',
          insertHR: false
        },
        {
          key: 'termsOfUse',
          link: 'https://leo.app/terms',
          insertHR: false
        },
        {
          key: 'contact',
          link: 'https://leo.app/contact',
          insertHR: true
        }
      ].map(({ key, link, insertHR }) => {
        return (
          <MenuItem
            key={key}
            slug={link}
            titleI18nKey={key}
            testID={''}
            insertHR={insertHR}
            linksOutsideOfWallet={true}
          />
        );
      })}
    </div>
  </div>
);

export default About;
