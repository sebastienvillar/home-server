const PythonShell = require('python-shell');
const { promisify } = require('util');
const runAsync = promisify(PythonShell.run).bind(PythonShell);

exports.read = async function(pin, retries) {
  const options = {
    mode: 'json',
    scriptPath: 'src/lib/devices/thermometer/',
    args: [pin, retries]
  };

  return runAsync('main.py', options);
}