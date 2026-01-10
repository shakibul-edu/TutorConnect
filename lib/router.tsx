
'use client';

import React from 'react';
import { useRouter as useNextRouter, usePathname as useNextPathname } from 'next/navigation';
import NextLink from 'next/link';

// Shim for RouterProvider - not needed in App Router but kept for compatibility
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useRouter = () => {
  const router = useNextRouter();
  return { 
    push: (path: string) => {
        // Handle "home" as root
        if (path === 'home') {
            router.push('/');
            return;
        }
        // Ensure path starts with /
        const target = path.startsWith('/') ? path : `/${path}`;
        router.push(target);
    } 
  };
};

export const usePathname = () => {
  const pathname = useNextPathname();
  if (!pathname || pathname === '/') return 'home';
  // Return path without leading slash to match old app logic (e.g., 'jobs', 'dashboard')
  return pathname.startsWith('/') ? pathname.slice(1) : pathname;
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Link: React.FC<LinkProps> = ({ href, children, className, ...props }) => {
  let target = href;
  if (href === 'home') target = '/';
  else if (!href.startsWith('/')) target = `/${href}`;

  return (
    <NextLink href={target} className={className} {...props}>
      {children}
    </NextLink>
  );
};
