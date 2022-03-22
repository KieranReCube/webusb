let device
function connect(){
    navigator.usb.requestDevice({ filters: [{  }] })
    .then(device => {
        console.log(device.productName);      // "Arduino Micro"
        console.log(device.manufacturerName); // "Arduino LLC"
    })
    .catch(error => { console.error(error); });
    navigator.usb.getDevices().then(devices => {
        devices.forEach(device => {
          console.log(device.productName);      // "Arduino Micro"
          console.log(device.manufacturerName); // "Arduino LLC"
        });
    })
    device.open();
}