## 发布脚本
基于`lerna publish`的原理写的脚步，优化了lerna无法单个子项目发布的问题。

## 项目目录结构

`ci/publish.js`为nodejs脚本

```bash
├── README.md
├── ci
│   └── publish.js
├── lib
│   ├── correction-comments
│   │   ├── CHANGELOG.md
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── src
│   │   └── yarn-error.log
│   ├── correction-feedback
│   │   ├── CHANGELOG.md
│   │   ├── README.md
│   │   ├── package.json
│   │   └── src
│   ├── correction-grade
│   │   ├── CHANGELOG.md
│   │   ├── README.md
│   │   ├── package.json
│   │   └── src
├── package.json
├── lerna.json
├── tsconfig.json
├── yarn.lock
└── zyb.config.js
```

## 脚本依赖

- `globby`: 类似`fast-glob`的全局匹配工具库，用于批量匹配文件

- `inquirer`: 命令行交互工具库

- `fs-extra`: 文件操作工具库

- `semver`: 版本号工具库

- `lerna`: npm包发布管理工具库
