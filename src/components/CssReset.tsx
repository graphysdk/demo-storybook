import { css, Global } from '@emotion/react';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

/**
 * Provides thin, opinionated browser CSS resets suitable for Graphy.
 * Inspired by Modern Normalize and Tailwind Preflight.
 *
 * https://github.com/sindresorhus/modern-normalize
 * https://tailwindcss.com/docs/preflight
 */
export const ResetStyles = () => (
  <Global
    styles={css`
      /**
      Use a better box model (opinionated).
      */

      *,
      *:before,
      *:after {
        box-sizing: border-box;
      }

      /**
      Universal focus styles for users using keyboard navigation
      */

      *:focus {
        outline: none;
      }

      :root {
        color-scheme: normal;
      }

      /**
      1. Prevent adjustments of font size after orientation changes in iOS.
      2. Set font-size to make 1rem = 10px. (https://engageinteractive.co.uk/blog/em-vs-rem-vs-px)
      */

      html {
        text-size-adjust: 100%; /* 1 */
        font-size: 62.5%; /* 2 */
      }

      /**
      Remove body margin in all browsers, and apply body-level styles.
      */

      body {
        color: #1a1a1a;
        font-family: ${FONT_FAMILY};
        font-size: 1.4rem;
        line-height: 1.5;
        margin: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;

        // Disabled overscroll so that sticky elements do not leave a gap when overscrolling
        overscroll-behavior-y: none;
      }

      code {
        font-family: ${FONT_FAMILY};
      }

      /**
      1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
      2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
      */

      table {
        text-indent: 0; /* 1 */
        border-color: inherit; /* 2 */
      }

      /**
      1. Change the font styles in all browsers.
      2. Remove the margin in Firefox and Safari.
      3. Reset padding for all browsers
      */

      button,
      fieldset,
      input,
      optgroup,
      select,
      textarea {
        font: inherit; /* 1 */
        margin: 0; /* 2 */
        padding: 0; /* 3 */
        color: inherit;
      }

      /**
      Remove browser default decoration for fieldset.
      */

      fieldset {
        border: none;
      }

      /**
      Remove browser defaults for hyperlinks.
      */
      a {
        color: inherit;
        text-decoration: none;
      }

      /**
      Remove the inheritance of text transform in Edge and Firefox.
      1. Remove the inheritance of text transform in Firefox.
      */

      button,
      select {
        /* 1 */
        text-transform: none;
      }

      /**
      Set a sensible cursor for elements with button role.
      */

      [role='button'],
      button {
        cursor: pointer;
      }

      /**
      Remove default button appearance
      */

      button {
        border: 0;
        padding: 0;
        background-color: transparent;
        font: inherit;
        text-align: inherit;
      }

      /**
      Remove default margins.
      */

      blockquote,
      dd,
      dl,
      figure,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      hr,
      p,
      pre {
        margin: 0;
      }

      /**
      Remove default styles from lists.
      */

      ol,
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      /**
      Adds default height to root elements.
      */

      html,
      body,
      #root,
      #__next {
        height: 100%;
      }

      [hidden] {
        display: none;
      }
    `}
  />
);
