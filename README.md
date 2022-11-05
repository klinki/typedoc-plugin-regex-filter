# typedoc-plugin-regex-filter

TypeDoc plugin for filtering reflections based on regular expression.

## Usage

Install plugin:

```bash
npm install --save-dev typedoc-plugin-regex-filter
```

Use:

```bash
typedoc --removeRegex "^_(.*)" --removeRegexExclude
```

## Configuration

- removeRegex: string - regular expression used for filtering, default `^_(.*)`
- removeRegexExclude: boolean - exclude matching reflections from docs output, default `false`
- removeRegexMarkAsPrivate: boolean - mark matching reflections as private in docs output, default `true`
- removeRegexLogMatches: boolean - write matching reflections to log output, default `false`
