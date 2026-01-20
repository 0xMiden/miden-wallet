import { useEffect, useMemo, useRef } from 'react';

import tippy, { Props, Instance } from 'tippy.js';

import { isExtension } from 'lib/platform';

export type TippyInstance = Instance<Props>;
export type TippyProps = Partial<Props>;

// Cache this at module level since it won't change during runtime
const IS_EXTENSION = isExtension();

export default function useTippy<T extends HTMLElement>(props: Partial<Props>) {
  const targetRef = useRef<T>(null);
  const instanceRef = useRef<Instance<Props>>();

  // Disable animations for extension
  const effectiveProps = useMemo(
    () => (IS_EXTENSION ? { ...props, duration: 0, animation: false as const } : props),
    [props]
  );

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setProps(effectiveProps);
    } else if (targetRef.current) {
      instanceRef.current = tippy(targetRef.current, effectiveProps);
    }
  }, [effectiveProps]);

  useEffect(
    () => () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    },
    []
  );

  return targetRef;
}
