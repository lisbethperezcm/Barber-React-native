<<<<<<< HEAD
module.exports = function (api) {
  api.cache(true);
  return {
  presets: ['babel-preset-expo'],
    plugins: [

      ['module-resolver', { alias: { '@': './' } }], // 👈 alias @ al root del proyecto

    ],
     // 👇 Asegura que esta config se aplique a los paquetes de @expo con TS
   /* babelrcRoots: [
      ".",
      "node_modules/@expo/*"
    ],*/
  };
};
=======
module.exports = function (api) {
  api.cache(true);
  return {
  presets: ['babel-preset-expo'],
    plugins: [

      ['module-resolver', { alias: { '@': './' } }], // 👈 alias @ al root del proyecto

    ],
     // 👇 Asegura que esta config se aplique a los paquetes de @expo con TS
   /* babelrcRoots: [
      ".",
      "node_modules/@expo/*"
    ],*/
  };
};
>>>>>>> ca2dc02 (init: proyecto limpio sin historial y .gitignore configurado)
