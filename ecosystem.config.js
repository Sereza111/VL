module.exports = {
  apps: [{
    name: 'vl-app',
    script: 'server.js',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
<<<<<<< HEAD
      PORT: '10001'
=======
      PORT: '10004'
>>>>>>> 03f74a820e1c48590eca44e10919f45b58bba4cf
    }
  }]
};