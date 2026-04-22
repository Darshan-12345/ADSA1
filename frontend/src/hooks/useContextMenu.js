import { useEffect, useState } from 'react';

export function useContextMenu() {
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    function close() {
      setMenu(null);
    }

    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, []);

  return {
    menu,
    openMenu: (event, payload) => {
      event.preventDefault();
      setMenu({ x: event.clientX, y: event.clientY, payload });
    },
    closeMenu: () => setMenu(null)
  };
}
