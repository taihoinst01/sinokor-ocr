var msopdf = require('node-msoffice-pdf');
var exec = require('child_process').exec;

var child = exec('java -jar C:/Main.jar',
  function (error, stdout, stderr){
    console.log('Output -> ' + stdout);
    if(error !== null){
      console.log("Error -> "+error);
    }
});
 
//sso key value : Vy3zFyENGINEx5F1zTyGIDx5FDEMO1zCy1539564980zPy86400zAy23zEyP7D2Wpx2Bf0dkRRoplRJmZ0Q3Za7WHjeSKx78rg3x78rcDe0bGsQMsAlvwOn7rqK48NEQpA8pi2x7A0PVVN0NZg4x7As0RJFx79YbNw0MoHnIx7Aj7x797CB8bx7A0QYP68D763IdCx2FEWx79UXEIVT6TgScx7A64SUjXXf55fMVMbaUfQ2frENHx2BPtQf2A81Px79GGIt6dB5uQ1D8x7AWjAR9KuA5KfjGOgZjbSDbkqGnPGAx3Dx3DzKyF8x78ICfDirBJ4BDeVx78e5S1x7AaUSDYhrZlx79Wbl1x78FbugXOagNG0cfIx787hj2x78Hd33QDbx00x00x00x00x00zSSy00002479000zUURy1f9d134b0e195793zMyfsNjWrhSdZkx3Dz

var childLibre = exec('"C:/Program Files/LibreOffice/program/python.exe" c:/util/unoconv/unoconv.py -f pdf -o c:/tmp/text.pdf c:/tmp/text.xlsx',
  function (error, stdout, stderr){
    console.log('Output -> ' + stdout);
    if(error !== null){
      console.log("Error -> "+error);
    }
});

msopdf(null, function(error, office) { 

    if (error) {
      console.log("Init failed", error);
      return;
    }

   /*
     There is a queue on the background thread, so adding things is non-blocking.
   */

   office.excel({input: "./nodejs/test.xlsx", output: "outfile.pdf"}, function(error, pdf) {
       if (error) {
           console.log("Woops", error);
       } else {
           console.log("Saved to", pdf);
       }
   });


   office.close(null, function(error) {
       if (error) {
           console.log("Woops", error);
       } else {
           console.log("Finished & closed");
       }
   });
});