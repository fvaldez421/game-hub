import Head from 'next/head';

export type PageMetadata = {
  title?: string;
  description?: string;
};

const fallbackPageTitle = 'Game Hub';
const fallbackDescription = 'Game Hub - a next-gen gaming platform.';

export const PageMeta = ({ title, description }: PageMetadata) => {
  const titleToUse = title || fallbackPageTitle;
  const descToUse = description || fallbackDescription;
  return (
    <Head>
      <title>{titleToUse}</title>
      <meta name="description" content={descToUse} />
    </Head>
  );
};
