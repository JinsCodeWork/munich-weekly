module.exports = {
  apps: [
    {
      name: 'munich-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/munich-weekly/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
