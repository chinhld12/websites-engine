// mdx.d.ts
import * as React from 'react';
declare module '*.mdx' {
  const MDXComponent: React.FC<React.ComponentPropsWithoutRef<'div'>>;
  export default MDXComponent;
}
