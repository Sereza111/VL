#!/usr/bin/env node

/**
 * Скрипт для проверки безопасности приложения knigavl.ru
 * Проверяет наличие токенов в коде, переменные окружения и другие уязвимости
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

// Паттерны для поиска токенов и ключей
const SECURITY_PATTERNS = [
  {
    name: 'Telegram Bot Token',
    pattern: /\d{8,10}:[a-zA-Z0-9_-]{35}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'JWT Secret',
    pattern: /jwt[_-]?secret[\s]*[:=][\s]*['"][^'"]{16,}['"]/gi,
    severity: 'HIGH'
  },
  {
    name: 'Database Password',
    pattern: /password[\s]*[:=][\s]*['"][^'"]{3,}['"]/gi,
    severity: 'HIGH'
  },
  {
    name: 'API Key',
    pattern: /api[_-]?key[\s]*[:=][\s]*['"][^'"]{16,}['"]/gi,
    severity: 'MEDIUM'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
    severity: 'CRITICAL'
  }
];

// Файлы и папки для исключения из проверки
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  '*.log',
  '.env.example',
  'security-check.js'
];

class SecurityChecker {
  constructor() {
    this.issues = [];
    this.checkedFiles = 0;
    this.startTime = Date.now();
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logIssue(severity, message, file = null, line = null) {
    const issue = { severity, message, file, line, timestamp: new Date().toISOString() };
    this.issues.push(issue);
    
    const severityColors = {
      'CRITICAL': 'red',
      'HIGH': 'magenta',
      'MEDIUM': 'yellow',
      'LOW': 'cyan'
    };
    
    const color = severityColors[severity] || 'white';
    const location = file ? (line ? ` (${file}:${line})` : ` (${file})`) : '';
    this.log(`[${severity}] ${message}${location}`, color);
  }

  shouldSkipFile(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  checkFileForSecrets(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      SECURITY_PATTERNS.forEach(({ name, pattern, severity }) => {
        lines.forEach((line, index) => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.logIssue(
                severity,
                `Найден ${name}: ${match.substring(0, 20)}...`,
                filePath,
                index + 1
              );
            });
          }
        });
      });

    } catch (error) {
      if (error.code !== 'EISDIR') {
        this.logIssue('LOW', `Ошибка чтения файла: ${error.message}`, filePath);
      }
    }
  }

  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        
        if (this.shouldSkipFile(fullPath)) {
          return;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (stat.isFile()) {
          this.checkedFiles++;
          this.checkFileForSecrets(fullPath);
        }
      });
    } catch (error) {
      this.logIssue('LOW', `Ошибка сканирования директории: ${error.message}`, dirPath);
    }
  }

  checkEnvironmentVariables() {
    this.log('\n🔍 Проверка переменных окружения...', 'blue');
    
    const requiredEnvVars = [
      'MAIN_BOT_TOKEN',
      'SUPPORT_BOT_TOKEN',
      'MYSQL_PASSWORD',
      'JWT_SECRET'
    ];
    
    const optionalEnvVars = [
      'REDIS_URL',
      'SESSION_SECRET',
      'ADMIN_USER_IDS'
    ];
    
    // Проверяем обязательные переменные
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        this.logIssue('HIGH', `Отсутствует обязательная переменная окружения: ${envVar}`);
      } else {
        this.log(`✅ ${envVar} установлена`, 'green');
      }
    });
    
    // Проверяем опциональные переменные
    optionalEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        this.logIssue('LOW', `Рекомендуется установить переменную окружения: ${envVar}`);
      } else {
        this.log(`✅ ${envVar} установлена`, 'green');
      }
    });
  }

  checkFilePermissions() {
    this.log('\n🔒 Проверка прав доступа к файлам...', 'blue');
    
    const sensitiveFiles = [
      '.env',
      'config/database.js',
      'server.js',
      'bots.js'
    ];
    
    sensitiveFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          const mode = stats.mode;
          
          // Проверяем, что файл не доступен для записи другим пользователям
          if (mode & parseInt('002', 8)) {
            this.logIssue('MEDIUM', `Файл ${file} доступен для записи другим пользователям`);
          } else {
            this.log(`✅ ${file} имеет корректные права доступа`, 'green');
          }
        }
      } catch (error) {
        this.logIssue('LOW', `Ошибка проверки прав доступа для ${file}: ${error.message}`);
      }
    });
  }

  checkDependencyVulnerabilities() {
    this.log('\n📦 Проверка зависимостей...', 'blue');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Список известных уязвимых версий (пример)
      const vulnerablePackages = {
        'node-telegram-bot-api': {
          versions: ['< 0.61.0'],
          severity: 'MEDIUM',
          description: 'Устаревшая версия с потенциальными уязвимостями'
        }
      };
      
      Object.keys(dependencies).forEach(pkg => {
        if (vulnerablePackages[pkg]) {
          this.logIssue(
            vulnerablePackages[pkg].severity,
            `Уязвимая зависимость: ${pkg}@${dependencies[pkg]} - ${vulnerablePackages[pkg].description}`
          );
        }
      });
      
      this.log(`Проверено ${Object.keys(dependencies).length} зависимостей`, 'cyan');
    } catch (error) {
      this.logIssue('LOW', `Ошибка проверки зависимостей: ${error.message}`);
    }
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 ОТЧЕТ О БЕЗОПАСНОСТИ', 'cyan');
    this.log('='.repeat(60), 'cyan');
    
    this.log(`\n📁 Проверено файлов: ${this.checkedFiles}`);
    this.log(`⏱️  Время выполнения: ${duration}ms`);
    this.log(`📋 Найдено проблем: ${this.issues.length}\n`);
    
    // Группируем проблемы по серьезности
    const groupedIssues = this.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) {
        acc[issue.severity] = [];
      }
      acc[issue.severity].push(issue);
      return acc;
    }, {});
    
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    severityOrder.forEach(severity => {
      if (groupedIssues[severity]) {
        this.log(`${severity}: ${groupedIssues[severity].length} проблем`, 
          severity === 'CRITICAL' ? 'red' : 
          severity === 'HIGH' ? 'magenta' : 
          severity === 'MEDIUM' ? 'yellow' : 'cyan');
      }
    });
    
    // Рекомендации
    this.log('\n📝 РЕКОМЕНДАЦИИ:', 'blue');
    
    if (groupedIssues['CRITICAL'] && groupedIssues['CRITICAL'].length > 0) {
      this.log('🚨 КРИТИЧЕСКИЕ проблемы требуют немедленного исправления!', 'red');
    }
    
    if (groupedIssues['HIGH'] && groupedIssues['HIGH'].length > 0) {
      this.log('⚠️  Проблемы высокой важности следует исправить в ближайшее время', 'magenta');
    }
    
    this.log('\n🔧 Для исправления проблем безопасности:', 'blue');
    this.log('1. Перенесите все токены и секреты в переменные окружения');
    this.log('2. Используйте файл .env для локальной разработки');
    this.log('3. Добавьте .env в .gitignore');
    this.log('4. Замените скомпрометированные токены через @BotFather');
    this.log('5. Обновите уязвимые зависимости');
    
    // Возвращаем код выхода на основе найденных проблем
    const exitCode = groupedIssues['CRITICAL'] ? 2 : 
                     groupedIssues['HIGH'] ? 1 : 0;
    
    this.log(`\n✅ Проверка завершена с кодом: ${exitCode}`, 
      exitCode === 0 ? 'green' : exitCode === 1 ? 'yellow' : 'red');
    
    return exitCode;
  }

  run() {
    this.log('🔍 ПРОВЕРКА БЕЗОПАСНОСТИ knigavl.ru', 'cyan');
    this.log('=' .repeat(40), 'cyan');
    
    // Проверяем файлы на токены и секреты
    this.log('\n📂 Сканирование файлов на наличие секретов...', 'blue');
    this.scanDirectory('./');
    
    // Проверяем переменные окружения
    this.checkEnvironmentVariables();
    
    // Проверяем права доступа к файлам
    this.checkFilePermissions();
    
    // Проверяем зависимости
    this.checkDependencyVulnerabilities();
    
    // Генерируем отчет
    const exitCode = this.generateReport();
    
    process.exit(exitCode);
  }
}

// Запускаем проверку
if (require.main === module) {
  const checker = new SecurityChecker();
  checker.run();
}

module.exports = SecurityChecker;