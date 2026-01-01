// 优化版的 start.js
const { spawn } = require('child_process');

// 启动 Next.js
const child = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true
});

// 监听子进程的关闭事件
child.on('close', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    process.exit(code);
});

// 关键点：当 PM2 试图停止这个脚本时，
// 我们要手动把停止信号传递给 Next.js 子进程
const stopSignals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

stopSignals.forEach(signal => {
    process.on(signal, () => {
        console.log(`Received ${signal}, stopping child process...`);
        // 因为开启了 shell: true，我们需要杀掉整个进程组
        try {
            process.kill(-child.pid, signal); 
        } catch (e) {
            // 忽略错误，有时候子进程已经没了
        }
        process.exit();
    });
});