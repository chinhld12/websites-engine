import "@wse/styles/globals.css";
import type { AppProps } from "next/app";
import HotReload from '@wse/components/HotReload';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <HotReload />
    </>
  );
}
  