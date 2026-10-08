module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-configura el plugin de react-native-worklets
    // cuando está instalado (ver docs de react-native-reanimated para SDK 57).
    presets: ['babel-preset-expo'],
  };
};
