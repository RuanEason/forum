const { spawn } = require('child_process');
const child = spawn('npm', ['run', 'start'], {
    shell: true, 
    stdio: 'inherit'
});