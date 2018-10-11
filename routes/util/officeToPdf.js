var msopdf = require('node-msoffice-pdf');
var exec = require('child_process').exec;

var child = exec('java -jar C:/Main.jar',
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