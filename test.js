let hello = () => new Promise((resolve, reject) => {

  console.log('-> ', 'sync hello');
  resolve();
});

hello().then(() => {
  return new Promise((resolve, reject) => {

    setTimeout(() => {
      console.log('-> ', 'async hello');
      resolve();
    }, 1000)

  });
}).then(() => {
  console.log('-> ', '3rd hello');
});


