import React, { Dispatch, memo, ReactElement, SetStateAction, useCallback, useMemo, useState } from 'react';

import {
  useFloating,
  useDismiss,
  useInteractions,
  offset,
  flip,
  shift,
  autoUpdate,
  Placement,
  Strategy,
  size
} from '@floating-ui/react';

import Portal from 'lib/ui/Portal';

export interface PopperRenderProps {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  toggleOpened: () => void;
}
export type RenderProp<P> = (props: P) => ReactElement;

type PopperModifier = {
  name: string;
  enabled?: boolean;
  phase?: string;
  requires?: string[];
  fn?: (args: { state: any }) => void;
  effect?: (args: { state: any }) => () => void;
};

type PopperProps = {
  popup: RenderProp<PopperRenderProps>;
  children: RenderProp<
    PopperRenderProps & {
      ref: React.RefCallback<HTMLButtonElement>;
    }
  >;
  placement?: Placement;
  strategy?: Strategy;
  modifiers?: PopperModifier[];
  fallbackPlacementsEnabled?: boolean;
};

const Popper = memo<PopperProps>(
  ({
    popup,
    children,
    placement = 'bottom',
    strategy = 'absolute',
    modifiers = [],
    fallbackPlacementsEnabled = true
  }) => {
    const [opened, setOpened] = useState(false);

    const toggleOpened = useCallback(() => {
      setOpened(o => !o);
    }, []);

    // Check if sameWidth modifier is present
    const hasSameWidth = modifiers.some(m => m.name === 'sameWidth');

    const { refs, floatingStyles, context } = useFloating({
      open: opened,
      onOpenChange: setOpened,
      placement,
      strategy,
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(8),
        fallbackPlacementsEnabled && flip(),
        shift({ padding: 8 }),
        hasSameWidth &&
          size({
            apply({ rects, elements }) {
              Object.assign(elements.floating.style, {
                width: `${rects.reference.width}px`
              });
            }
          })
      ].filter(Boolean)
    });

    const dismiss = useDismiss(context);

    const { getFloatingProps } = useInteractions([dismiss]);

    const renderPropsBase = useMemo(
      () => ({
        opened,
        setOpened,
        toggleOpened
      }),
      [opened, toggleOpened]
    );

    const triggerNode = useMemo(
      () =>
        children({
          ...renderPropsBase,
          ref: refs.setReference as React.RefCallback<HTMLButtonElement>
        }),
      [children, renderPropsBase, refs.setReference]
    );

    const popupNode = useMemo(() => popup(renderPropsBase), [popup, renderPropsBase]);

    return (
      <>
        {triggerNode}

        <Portal>
          <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 40 }} {...getFloatingProps()}>
            {popupNode}
          </div>
        </Portal>
      </>
    );
  }
);

export default Popper;
