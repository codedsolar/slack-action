const path = require('path');
const fs = require('fs');

module.exports = (request, options) => {
  const { defaultResolver } = options;

  if (defaultResolver) {
    try {
      return defaultResolver(request, options);
    } catch {
      // Fall through to custom ESM resolution
    }
  }

  if (
    request.startsWith('@actions/') ||
    request.startsWith('@octokit/') ||
    request.startsWith('universal-user-agent') ||
    request.startsWith('before-after-hook')
  ) {
    return resolveEsmPackage(request, options);
  }

  throw new Error(`Cannot find module '${request}'`);
};

function resolveEsmPackage(request, options) {
  const slashIdx = request.indexOf('/', 1);
  const secondSlash = request.indexOf('/', slashIdx + 1);

  let pkgName;
  let subPath;

  if (secondSlash === -1) {
    pkgName = request;
    subPath = '';
  } else {
    pkgName = request.slice(0, secondSlash);
    subPath = request.slice(secondSlash + 1);
  }

  const fromDir = options.basedir || options.rootDir;
  const pkgDir = findPackageDir(pkgName, fromDir, options.rootDir);

  if (!pkgDir) {
    throw new Error(`Cannot find package '${pkgName}'`);
  }

  const pkgJson = JSON.parse(
    fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'),
  );
  const exportKey = subPath ? `./${subPath}` : '.';
  const entry = pkgJson.exports?.[exportKey];

  if (entry?.import) {
    return path.join(pkgDir, entry.import);
  }

  if (typeof entry === 'string') {
    return path.join(pkgDir, entry);
  }

  if (pkgJson.main) {
    return path.join(pkgDir, pkgJson.main);
  }

  throw new Error(`No import export for '${request}'`);
}

function findPackageDir(pkgName, fromDir, rootDir) {
  let dir = fromDir;

  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', pkgName);

    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }

    if (dir === rootDir) {
      break;
    }

    dir = path.dirname(dir);
  }

  const rootCandidate = path.join(rootDir, 'node_modules', pkgName);

  if (fs.existsSync(path.join(rootCandidate, 'package.json'))) {
    return rootCandidate;
  }

  const pnpmBase = path.join(rootDir, 'node_modules/.pnpm');

  if (fs.existsSync(pnpmBase)) {
    const prefix = pkgName.replace('/', '+') + '@';
    const rootLink = path.join(rootDir, 'node_modules', pkgName);

    if (fs.lstatSync(rootLink, { throwIfNoEntry: false })?.isSymbolicLink()) {
      const realPath = fs.realpathSync(rootLink);
      const pnpmMatch = realPath.match(
        /node_modules\/\.pnpm\/(.+?)\/node_modules/,
      );

      if (pnpmMatch) {
        return path.join(pnpmBase, pnpmMatch[1], 'node_modules', pkgName);
      }
    }

    const matches = fs
      .readdirSync(pnpmBase)
      .filter((d) => d.startsWith(prefix));

    if (matches.length > 0) {
      matches.sort();
      return path.join(
        pnpmBase,
        matches[matches.length - 1],
        'node_modules',
        pkgName,
      );
    }
  }

  return null;
}
