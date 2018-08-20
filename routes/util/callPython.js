console.time("function A");
var PythonShell = require('python-shell');


var options = {
    mode: 'text',
    pythonPath: '',
    pythonOptions: ['-u'],
    scriptPath: './referenceSource/ml/typosentence',
    args: ['value1 semple']
};

PythonShell.run('typo.py', options, function (err, results) {
    if (err) throw err;
    console.log('results: %j', results);
});

console.timeEnd("function A");
console.time("function B");
options.args = ['ddddd eeeeee']

PythonShell.run('typo.py', options, function (err, results) {
    if (err) throw err;
    console.log('results: %j', results);
});

console.timeEnd("function B");