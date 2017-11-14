let func1 = (name) =>{

  return new Promise((resolve , reject) =>{

    setTimeout(()=>{

      console.log('-> ',name);

      resolve('resolved');
    })

  });

};


let a = func1('ehsan');

// a;