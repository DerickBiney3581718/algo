// postcss.config.js
import postcssPresetEnv from "postcss-preset-env";

export default {
  plugins: [
    postcssPresetEnv({
      stage: 2, // Enables stable future-CSS drafts (like nesting)
      features: {
        "nesting-rules": true, // Crucial for organizing complex UI selectors
      },
    }),
  ],
};
