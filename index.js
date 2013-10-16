var path         = require("path")
  , fs           = require('fs')
  , childProcess = require('child_process')
  , bash         = require('bashful')
  , Stream       = require('stream').Stream
  , PATH         = "PATH"
  ;

module.exports = shell;

// windows calls it's path "Path" usually, but this is not guaranteed.
if (process.platform === "win32") {
  PATH = "Path"
  Object.keys(process.env).forEach(function (e) {
    if (e.match(/^PATH$/i)) {
      PATH = e
    }
  })
}

function shell(conf, pkg, opts) {
  opts = opts || {};

  var cwd = opts.cwd || process.cwd()
    , env = makeEnv(pkg)
    , stdin  = opts.stdin  || process.stdin
    , stdout = opts.stdout || process.stdout
    , stderr = opts.stderr || process.stderr
    ;

  addConf(pkg.name, pkg.version, conf, env)

  env[PATH] = makePath(cwd, env[PATH])
  env.PWD = cwd

  if (opts.env) {
    for (var k in opts.env) {
      env[k] = opts.env[k]
    }
  }

  var sh = bash({
    env:   env,
    spawn: spawnWith([stdin, 'pipe', stderr]),
    read:  fs.createReadStream,
    write: fs.createWriteStream
  })
  return sh;
}

function makeEnv (data, prefix, env) {
  prefix = prefix || "npm_package_"
  if (!env) {
    env = {}
    for (var i in process.env) if (!i.match(/^npm_/)) {
      env[i] = process.env[i]
    }

  } else if (!data.hasOwnProperty("_lifecycleEnv")) {
    Object.defineProperty(data, "_lifecycleEnv",
      { value : env
      , enumerable : false
      })
  }

  for (var i in data) if (i.charAt(0) !== "_") {
    var envKey = (prefix+i).replace(/[^a-zA-Z0-9_]/g, '_')
    if (i === "readme") {
      continue
    }
    if (data[i] && typeof(data[i]) === "object") {
      try {
        // quick and dirty detection for cyclical structures
        JSON.stringify(data[i])
        makeEnv(data[i], envKey+"_", env)
      } catch (ex) {
        // usually these are package objects.
        // just get the path and basic details.
        var d = data[i]
        makeEnv( { name: d.name, version: d.version, path:d.path }
               , envKey+"_", env)
      }
    } else {
      env[envKey] = String(data[i])
      env[envKey] = -1 !== env[envKey].indexOf("\n")
                  ? JSON.stringify(env[envKey])
                  : env[envKey]
    }

  }
  return env
}

function addConf(name, version, conf, env) {
  var prefix = "npm_config_"
    , pkgConfig = {}
    , keys = conf.keys
    , pkgVerConfig = {}
    , namePref = name + ":"
    , verPref = name + "@" + version + ":"

  keys.forEach(function (i) {
    if (i.charAt(0) === "_" && i.indexOf("_"+namePref) !== 0) {
      return
    }
    var value = conf.get(i)
    if (value instanceof Stream || Array.isArray(value)) return
    if (!value) value = ""
    else if (typeof value !== "string") value = JSON.stringify(value)

    value = -1 !== value.indexOf("\n")
          ? JSON.stringify(value)
          : value
    i = i.replace(/^_+/, "")
    if (i.indexOf(namePref) === 0) {
      var k = i.substr(namePref.length).replace(/[^a-zA-Z0-9_]/g, "_")
      pkgConfig[ k ] = value
    } else if (i.indexOf(verPref) === 0) {
      var k = i.substr(verPref.length).replace(/[^a-zA-Z0-9_]/g, "_")
      pkgVerConfig[ k ] = value
    }
    var envKey = (prefix+i).replace(/[^a-zA-Z0-9_]/g, "_")
    env[envKey] = value
  })

  prefix = "npm_package_config_"
  ;[pkgConfig, pkgVerConfig].forEach(function (conf) {
    for (var i in conf) {
      var envKey = (prefix+i)
      env[envKey] = conf[i]
    }
  })
}

function makePath(cwd, oldValue) {
  var pathArr = []
    , p = cwd.split("node_modules")
    , acc = path.resolve(p.shift())

  // first add the directory containing the `node` executable currently
  // running, so that any lifecycle script that invoke "node" will execute
  // this same one.
  pathArr.unshift(path.dirname(process.execPath))

  p.forEach(function (pp) {
    pathArr.unshift(path.join(acc, "node_modules", ".bin"))
    acc = path.join(acc, "node_modules", pp)
  })
  pathArr.unshift(path.join(acc, "node_modules", ".bin"))

  // we also unshift the bundled node-gyp-bin folder so that
  // the bundled one will be used for installing things.
  pathArr.unshift(path.join(__dirname, "..", "..", "bin", "node-gyp-bin"))

  if (oldValue) pathArr.push(oldValue)
  return pathArr.join(process.platform === "win32" ? ";" : ":")
}

function spawnWith(stdio) {
  return function _spawn(cmd, args, opts) {
    opts.stdio = stdio
    return childProcess.spawn(cmd, args, opts)
  }
}
