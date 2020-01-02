# Field Validation - fieldv8n

## Why did I need an N+1 solution

When searching for form validators, most solutions focused on Object schema
validation. Also it was hard to find the right mix of features:

- asynchronous validation,
- (ease of creating) custom validators;
- same package for backend and frontend;
- composability, reusability.

I was also seeking for a solution where I can **separate field concerns from form
concerns** for the following reasons:

- Validate a field after user finished typing or jumps to next field.
- Cross field dependency where one field is driving what one or more following
  fields will display.
- Dynamically attach fields.
- Create a standalone hook for React components.

Schema validators tend to act as type-checking mechanisms. I am not interested in a value
being a `string` or not, rather is it an email address or not? Yes, an email address most
possibly must be a `string`, but it is a very specialized one where the `string` type is
an implementation detail of it's representation. And also the input value will come from
an HTML `<input>` element where `type=` will be `text` or `email` that in the end outputs
a `string` value. If I need type-safety I'll go with TypeScript.

## Design

### Full asynchronous validation

Composing/chaining synchronous and asynchronous functions requires the composition/chain of functions
to be asynchronous. This is how JavaScript works:
[What Color is Your Function?](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)

The use cases I was working with almost all the time required to call an API at
some point in the validation chain where I would use an asynchronously fetched
result.

I would like to provide validation result to the user before she/he leaves the field.
To do that I need to "guess" when the user finished typing and then validate a maybe partial,
maybe complete input value. Maybe the simplest way is to debounce my input value validations which
requires an asynchronous workflow.

Asynchronous functions are based on synchronous ones, so as a superset most possibly will
satisfy future needs, so I will not need a workaround or having more implementation modes.

### No built-in validators

If I want a flexible validation "framework" it seems essential to separate the validators
from the core framework. And after all, some use cases might need an ISO compliant email check
and others only need to ensure that the user has an "@" character and naybe one "." after the "@"
in her/his email address to verify intention.

So if I don't check types and cannot define a good set of standard validators, why even
include them in the library? Go write your own validators, create a package from your
commonly used ones. Follow the [YAGNI](https://martinfowler.com/bliki/Yagni.html)
principle as does the `fieldv8n` design.

### Goal

IMHO a successful software should resemble to `*nix` functions like `grep`. It's small, it has
one task which it does well. It only needs little maintenance, it shall be long-lived and
rewrite is a clear sign of failure here.

## Install

`fieldv8n` package comes in 3 different flavors:

- ES module
- CommonJS module
- IIFE module

...

## Features

- Fork
- Register validator
- Create initable validator
...

## How to use

...
