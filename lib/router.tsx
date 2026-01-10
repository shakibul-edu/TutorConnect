import React, { useState, useEffect, createContext, useContext } from 'react';

const RouterContext = createContext<{ currentPath: string; navigate: (path: string) => void } | null>(null);

// Fix: Explicitly use React.FC to properly type the component and its children prop
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState('home');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPath(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    // Initialize
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useRouter must be used within RouterProvider");
  return { push: context.navigate };
};

export const usePathname = () => {
  const context = useContext(RouterContext);
  if (!context) throw new Error("usePathname must be used within RouterProvider");
  return context.currentPath;
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Link: React.FC<LinkProps> = ({ href, children, className, ...props }) => {
  const { navigate } = useContext(RouterContext)!;
  return (
    <a
      href={`#${href}`}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
};
