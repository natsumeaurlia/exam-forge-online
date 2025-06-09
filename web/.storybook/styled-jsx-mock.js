// styled-jsx のモック実装
// Storybook で styled-jsx の StyleRegistry が必要な場合のダミー実装

import React from 'react';

// StyleRegistry のモック実装
export const StyleRegistry = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

// その他の styled-jsx エクスポートのモック
export const style = () => ({});
export const css = () => ({});
export const resolve = () => ({});

// デフォルトエクスポート
export default {
  StyleRegistry,
  style,
  css,
  resolve,
};
