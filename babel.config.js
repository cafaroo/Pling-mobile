module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-modules-commonjs',
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@/domain': './src/domain',
            '@/application': './src/application',
            '@/infrastructure': './src/infrastructure',
            '@/ui': './src/ui',
            '@/shared': './src/shared',
            '@/assets': './assets'
          }
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