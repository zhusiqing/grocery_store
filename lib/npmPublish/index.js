const { execSync } = require('child_process');
const { join } = require('path');
const globby = require('globby');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const semver = require('semver');

const rootPath = join(__dirname, '../');
const libPath = join(rootPath, 'lib');
const versions = [
  {
    name: 'Patch (0.0.1)',
    value: 'patch',
  },
  {
    name: 'Minor (0.1.0)',
    value: 'minor',
  },
  {
    name: 'Major (1.0.0)',
    value: 'major',
  },
  {
    name: 'Prerelease (0.0.0-beta.1)',
    value: 'prerelease',
  },
  {
    name: 'Custom',
    value: 'custom',
  },
];
const getPackagePath = () => {
  const packagePaths = globby.sync(libPath, {
    cwd: rootPath,
    onlyDirectories: true,
    deep: 1,
  });
  const pkgs = packagePaths.map(item => {
    const pkgPath = join(item, '/package.json');
    const pkg = fs.readJsonSync(pkgPath);
    return {
      name: pkg.name,
      version: pkg.version,
      path: item,
      pkgPath,
      newVersion: '',
    };
  });
  return pkgs;
};
const choosePackage = async packages => {
  const answer = await inquirer.prompt({
    type: 'checkbox',
    name: 'packages',
    message: '选择你要发布的包',
    choices: [...packages],
  });
  const findPkgs = packages.filter(el => answer.packages.includes(el.name));
  return findPkgs;
};
const customVersion = async publishPackages => {
  for (const publishPackage of publishPackages) {
    console.log(`\n${publishPackage.name}目前版本：${publishPackage.version}`);
    const { version } = await inquirer.prompt({
      type: 'input',
      name: 'version',
      message: `输入${publishPackage.name}要发布的版本`,
    });
    publishPackage.newVersion = version;
  }
};
const confirmChange = async () => {
  const answer = await inquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: '确认要发布吗？',
    default: false,
  });
  return answer;
};

const chooseVersion = async () => {
  const answer = await inquirer.prompt({
    type: 'list',
    name: 'version',
    message: '选择你要发布的版本',
    choices: versions,
  });
  return answer;
};
const checkVersion = (publishPackages, version) => {
  publishPackages.forEach(publishPackage => {
    const isBeta = version === 'prerelease';
    const tagHistory = execSync('git tag').toString('utf-8');
    const tags = tagHistory.split('\n').filter(el => {
      return ~el.indexOf(publishPackage.name);
    });
    tags.sort((a, b) => {
      const parseA = semver.parse(a.replace(publishPackage.name + '@', ''));
      const parseB = semver.parse(b.replace(publishPackage.name + '@', ''));
      const numA =
        parseA.major * 1000000 +
          parseA.minor * 10000 +
          parseA.patch * 100 +
          parseA.prerelease[1] || 0;
      const numB =
        parseB.major * 1000000 +
          parseB.minor * 10000 +
          parseB.patch * 100 +
          parseB.prerelease[1] || 0;
      return numB - numA;
    });

    const preTag = tags[0];
    const preVersion = preTag.replace(publishPackage.name + '@', '');
    const parsePreVersion = semver.parse(preVersion);
    let newVersion = '';
    if (isBeta) {
      if (parsePreVersion.prerelease.length) {
        parsePreVersion.prerelease[1] = parsePreVersion.prerelease[1] + 1;
        newVersion = `${parsePreVersion.major}.${parsePreVersion.minor}.${
          parsePreVersion.patch
        }-${parsePreVersion.prerelease.join('.')}`;
      } else {
        newVersion = `${parsePreVersion.major}.${parsePreVersion.minor}.${parsePreVersion.patch}-beta.0`;
      }
    } else {
      const versionArr = [
        parsePreVersion.major,
        parsePreVersion.minor,
        parsePreVersion.patch,
      ];
      if (!parsePreVersion.prerelease.length) {
        switch (version) {
          case 'patch':
            versionArr[2] = versionArr[2] + 1;
            break;
          case 'minor':
            versionArr[1] = versionArr[1] + 1;
            versionArr[2] = 0;
            break;
          case 'major':
            versionArr[0] = versionArr[0] + 1;
            versionArr[1] = 0;
            versionArr[2] = 0;
            break;
          default:
            break;
        }
      }
      newVersion = versionArr.join('.');
    }
    publishPackage.newVersion = newVersion;
    console.log(`${publishPackage.name}: ${preVersion} -> ${newVersion}`);
  });
};
const updateVersion = async publishPackages => {
  publishPackages.forEach(publishPackage => {
    const json = fs.readJsonSync(publishPackage.pkgPath, {
      encoding: 'utf-8',
    });
    json.version = publishPackage.newVersion;
    fs.writeJsonSync(publishPackage.pkgPath, json, {
      spaces: 2,
    });
  });
};
const npmPublish = publishPackages => {
  publishPackages.forEach(publishPackage => {
    execSync(`cd ${publishPackage.path} && npm publish`, {
      stdio: 'inherit',
    });
  });
};
const gitAdd = publishPackages => {
  const paths = publishPackages.map(el => el.pkgPath).join(' ');
  execSync(`git add ${paths}`, { stdio: 'inherit' });
};
const gitCommit = publishPackages => {
  const log = publishPackages
    .map(el => ` - ${el.name}@${el.newVersion}`)
    .join('\n');
  execSync(`git commit -m 'chore(release): publish\n${log}'`, {
    stdio: 'inherit',
  });
};
const gitTag = publishPackages => {
  publishPackages.forEach(el => {
    const tag = `${el.name}@${el.newVersion}`;
    execSync(`git tag -a ${tag} -m '${tag}'`, { stdio: 'inherit' });
  });
};
const gitPull = () => {
  execSync('git pull', { stdio: 'inherit' });
};
const gitPush = () => {
  execSync('git push', { stdio: 'inherit' });
};

const publish = async () => {
  gitPull();
  const packages = getPackagePath();
  const publishPackages = await choosePackage(packages);
  if (publishPackages.length === 0) {
    console.log('没有选择要发布的包');
    return;
  }
  const { version } = await chooseVersion();
  if (!version) {
    console.log('没有选择发布的版本');
    return;
  }
  if (version === 'custom') {
    await customVersion(publishPackages);
  } else {
    checkVersion(publishPackages, version);
  }
  const { confirm } = await confirmChange();
  if (!confirm) return;
  updateVersion(publishPackages);
  npmPublish(publishPackages);
  gitAdd(publishPackages);
  gitCommit(publishPackages);
  gitTag(publishPackages);
  gitPush();
  console.log('\n');
  publishPackages.forEach(publishPackage => {
    console.log(`${publishPackage.name}: ${publishPackage.newVersion}`);
  });
};

publish();
