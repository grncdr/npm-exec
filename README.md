# npm-exec

**Warning** this is just getting started, but is already somewhat usable.

## Usage

```
cd mymodule
npm-exec 'echo $npm_package_name'
# mymodule
cd node_modules/mydependency
npm-exec 'echo $npm_package_name'
# mydependency
```

A more compelling example, notice how none of the testing tools need to be installed globally:

```
$ cd mymodule
$ npm install -D browserify coverify testling tape

$ cat <<EOF > index.js
module.exports = function (x) { return x * x }
EOF

$ cat <<EOF > test.js
var mymodule = require('./');
require('tape')('my browserified test', function (t) {
  t.equals(9, mymodule.doSomething(3))
  t.end()
})
EOF

$ npm-exec 'browserify -t coverify test.js | testling | coverify'
```

## What it does

Loads the same environment that would be present for `npm run-script <blah>`,
but executes arbitrary bash command lines. (even on windows! Thanks to
[bashful](https://github.com/substack/bashful)). This includes modifying
`$PATH` so scripts in `node_modules/.bin` will be used before global modules.

## What it might do

Allow saving of command lines into package.json automatically (like `npm install
--save` does now). E.g. you might run: `npm-exec --save test "mocha tests/*"`
and after that your `npm test` command would be all set up.

## Watch out for your shell!

Your shell will expand environment variables first, so if you want to reference
npm package variables in your command line, they need to be wrapped in single
quotes.

## Install

`npm install -g npm-exec`

It's really only useful if it's installed globally (boo! hiss!) maybe it will get
integrated into `npm` one day. Follow [the issue][issue-3313] that prompted me
to write this module for more information.

[issue-3313]: https://github.com/isaacs/npm/issues/3313

## License

BSD
