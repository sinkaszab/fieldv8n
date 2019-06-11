# Field Validations

## Goals

- Validations should be composed.
- All validations should happen asynchronously.
- First fail will exit composed chain and propagate result.
- Validation error shouldn't be an Exception, failing validation
  is an expected scenario, that is the whole purpose of validation.
