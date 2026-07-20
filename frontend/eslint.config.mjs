import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // eslint-plugin-react@7.x still calls removed context.getFilename() during
    // auto-detection; pin the version until the plugin supports ESLint 10.
    settings: {
      react: {
        version: "19",
      },
    },
  },
];

export default eslintConfig;
