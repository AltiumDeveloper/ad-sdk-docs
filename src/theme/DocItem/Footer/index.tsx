import React, { type ReactNode } from 'react';
import Footer from '@theme-original/DocItem/Footer';
import Heading from '@theme-original/Heading';
import type FooterType from '@theme/DocItem/Footer';
import type { WrapperProps } from '@docusaurus/types';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Comments from '@site/src/components/Comments';

type Props = WrapperProps<typeof FooterType>;

// Hand-written pages (guides, home page) end with comments, so readers can post corrections; a page can turn them off
// with `comments: false` in its front matter. Generated reference pages (docs/reference/**) never show comments.
export default function FooterWrapper(props: Props): ReactNode {
  const { metadata } = useDoc();
  const { comments = true } = metadata.frontMatter as { comments?: boolean };
  const showComments = comments && !metadata.id.startsWith('reference/');

  return (
    <>
      <Footer {...props} />
      {showComments && (
        <>
          <br />
          <Heading as="h2" id="page-comments">
            Comments
          </Heading>
          <Comments />
        </>
      )}
    </>
  );
}
