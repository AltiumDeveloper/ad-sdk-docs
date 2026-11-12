import React, { type ReactNode } from 'react';
import Giscus from '@giscus/react';

// Comments on a guide are a GitHub Discussion in AltiumDeveloper/ad-sdk-docs (category General), one per page path:
// readers post corrections and questions there. Settings as in the Altium 365 API documentation (platform-api-docs),
// except that reactions are enabled.
export default function Comments(): ReactNode {
  return (
    <Giscus
      id="giscus"
      repo="AltiumDeveloper/ad-sdk-docs"
      repoId="R_kgDOVJ6oXQ"
      category="General"
      categoryId="DIC_kwDOVJ6oXc4DK7FF"
      mapping="pathname"
      strict="1"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme="preferred_color_scheme"
      lang="en"
      loading="lazy"
    />
  );
}
