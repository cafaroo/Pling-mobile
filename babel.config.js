module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-modules-commonjs',
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@shared': './src/shared',
            '@domain': './src/domain',
            '@application': './src/application',
            '@utils': './src/utils',
            '@components': './components',
            '@constants': './constants',
            '@hooks': './hooks',
            '@services': './services',
            '@styles': './styles',
            '@types': './types',
            '@assets': './assets',
            '@domain': './src'                  // Nytt tydligt domänalias          }
        }
      ]
    ],
    env: {
      test: {
        plugins: ['@babel/plugin-transform-modules-commonjs']
      }
    }
  };
}; 