const path = require('path')

const buildEslintCommand = filenames => {
  // Get the relative paths from the web directory, not root
  const webDir = path.dirname(__filename)
  const files = filenames
    .map(f => path.relative(webDir, f))
    .join(' --file ')
  return `cd "${webDir}" && npx next lint --fix --file ${files}`
}

const buildPrettierCommand = filenames => {
  const webDir = path.dirname(__filename)
  const files = filenames
    .map(f => path.relative(webDir, f))
    .join(' ')
  return `cd "${webDir}" && npx prettier --write ${files}`
}

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, buildPrettierCommand],
}
