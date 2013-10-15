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

## What it does

Loads the same environment variables that would be present for `npm run-script
<blah>`, but executes arbitrary bash command lines (even on windows! Thanks
to [bashful](https://github.com/substack/bashful)).

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

MIT
