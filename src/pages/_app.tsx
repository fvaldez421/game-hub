import Head from 'next/head';
import type { AppProps } from 'next/app';

// import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '../components/global-styles';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <ThemeProvider> */}
      <GlobalStyle />
      <main>
        <Component {...pageProps} />
      </main>
      {/* </ThemeProvider> */}
    </>
  );
}
