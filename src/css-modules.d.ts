/* eslint-disable import-x/no-default-export */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
