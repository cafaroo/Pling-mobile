# Cursor Rules Developer Guide

## Overview

`.cursorrules` files are powerful configuration files that help tailor AI behavior to your project's specific needs. This guide explains how to effectively use them to improve code quality, maintain consistency, and boost productivity.

## File Structure

`.cursorrules` files use YAML format and should be placed in your project root or specific directories where you want the rules to apply.

```yaml
version: 1.0
rules:
  # Global rules that apply to all files
  global:
    naming:
      components: PascalCase
      hooks: camelCase
      utils: camelCase
    imports:
      preferred:
        - react
        - react-native
        - expo-router
      grouping:
        - type: builtin
          pattern: "^(react|react-native).*"
        - type: external
          pattern: "^@/"
        - type: relative
          pattern: "^[./]"

  # File-specific rules
  files:
    "**/*.tsx":
      structure:
        - imports
        - types
        - component
        - styles
      componentOrder:
        - state
        - effects
        - handlers
        - render

    "**/*.test.tsx":
      testing:
        framework: jest
        patterns:
          - describe
          - it
          - expect
```

## Rule Categories

### 1. Code Style Rules

Define consistent coding styles across your project:

```yaml
style:
  indentation: 2
  quotes: single
  semicolons: always
  trailingComma: es5
  maxLineLength: 80
  bracketSpacing: true
```

### 2. Naming Conventions

Enforce consistent naming patterns:

```yaml
naming:
  components:
    pattern: "^[A-Z][a-zA-Z]*$"
    examples:
      - UserProfile
      - Button
  hooks:
    pattern: "^use[A-Z][a-zA-Z]*$"
    examples:
      - useState
      - useEffect
  utils:
    pattern: "^[a-z][a-zA-Z]*$"
    examples:
      - formatDate
      - calculateTotal
```

### 3. Project Structure

Define your project's organization:

```yaml
structure:
  directories:
    components:
      path: src/components
      rules:
        - "One component per file"
        - "Include component tests"
    hooks:
      path: src/hooks
      rules:
        - "Custom hooks only"
    utils:
      path: src/utils
      rules:
        - "Pure functions only"
```

### 4. Dependencies

Manage project dependencies:

```yaml
dependencies:
  recommended:
    react: "^18.0.0"
    "react-native": "^0.70.0"
    "expo": "^48.0.0"
  forbidden:
    - moment
    - lodash
  alternatives:
    moment: date-fns
    lodash: native methods
```

### 5. Documentation

Set documentation requirements:

```yaml
documentation:
  components:
    required:
      - description
      - props
      - examples
  functions:
    required:
      - description
      - parameters
      - return
  types:
    required:
      - description
      - properties
```

## Best Practices

### 1. Rule Organization

- Group related rules together
- Use clear, descriptive names
- Add comments for complex rules
- Keep rules focused and specific

```yaml
# Good organization
rules:
  components:
    # UI component rules
    ui:
      naming: PascalCase
      location: src/components/ui
      documentation: required

    # Feature component rules
    features:
      naming: PascalCase
      location: src/components/features
      documentation: required
```

### 2. Version Control

- Include `.cursorrules` in version control
- Document rule changes in commit messages
- Review rule changes with team members
- Test rule changes before committing

### 3. Team Collaboration

- Document rule rationale
- Establish rule review process
- Update rules based on feedback
- Maintain rule consistency

```yaml
# Team collaboration section
meta:
  lastUpdated: "2025-04-20"
  reviewers:
    - lead-developer
    - senior-engineer
  changelog:
    - date: "2025-04-20"
      author: "lead-developer"
      changes:
        - "Added new component structure rules"
        - "Updated naming conventions"
```

## Implementation Examples

### 1. React Native Components

```yaml
components:
  structure:
    order:
      - imports
      - types
      - constants
      - component
      - styles
    imports:
      order:
        - react
        - react-native
        - expo
        - external
        - internal
    styling:
      method: StyleSheet.create
      location: bottom
```

### 2. API Integration

```yaml
api:
  structure:
    location: src/services
    naming: camelCase
    required:
      - types
      - error handling
      - documentation
  patterns:
    - async/await
    - try/catch
    - status checking
```

### 3. State Management

```yaml
state:
  preferred:
    local: useState
    complex: useReducer
    global: context
  patterns:
    - immutable updates
    - action creators
    - selectors
```

## Troubleshooting

### Common Issues

1. Rule Conflicts
```yaml
# Resolution priority
priority:
  1: file-specific
  2: directory
  3: global
```

2. Performance Impact
```yaml
performance:
  caching: enabled
  debounce: 200ms
  exclude:
    - "node_modules"
    - "build"
```

3. Integration Problems
```yaml
integration:
  editors:
    - vscode
    - webstorm
  linters:
    - eslint
    - prettier
```

## Maintenance

### Regular Updates

- Review rules quarterly
- Update based on new requirements
- Remove obsolete rules
- Add new best practices

### Monitoring

```yaml
monitoring:
  metrics:
    - rule-violations
    - code-quality
    - team-adoption
  reporting:
    frequency: weekly
    format: markdown
```

## Advanced Features

### 1. Custom Rules

Create project-specific rules:

```yaml
custom:
  rules:
    componentNaming:
      pattern: "^[A-Z][a-zA-Z]*$"
      message: "Component names must be PascalCase"
      severity: error
```

### 2. Context-Aware Rules

Apply rules based on context:

```yaml
context:
  development:
    logging: verbose
    checks: all
  production:
    logging: error
    checks: critical
```

### 3. Rule Extensions

Extend existing rules:

```yaml
extends:
  - base-rules
  - react-rules
  - typescript-rules
overrides:
  - files: "*.test.tsx"
    rules:
      documentation: optional
```

## Security Considerations

### 1. Sensitive Data

```yaml
security:
  sensitive:
    patterns:
      - "API_KEY"
      - "SECRET"
    actions:
      - warn
      - block
```

### 2. Code Review

```yaml
review:
  required:
    - security
    - performance
    - accessibility
  automated:
    - linting
    - testing
```

## Conclusion

`.cursorrules` files are powerful tools for maintaining code quality and consistency. Use them effectively to:

- Enforce coding standards
- Improve team collaboration
- Increase productivity
- Maintain code quality
- Ensure security best practices

Remember to:
- Keep rules simple and focused
- Document changes and rationale
- Review and update regularly
- Get team buy-in
- Monitor effectiveness