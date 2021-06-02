# Field Validation - fieldv8n

## BREAKING CHANGE

**Version 0.2.0 introduces a breaking change.**

## Why did I need an N+1 solution?

When searching for form validators, most solutions focused on Object schema
validation. Also it was hard to find the right mix of features:

- asynchronous validation,
- (ease of creating) custom validators;
- same package for backend and frontend;
- composability, reusability.

I was also seeking for a solution where I can **separate field concerns from form
concerns** for the following reasons:

- Validate a field after user finished typing or jumps to next field, without
  having to be concerned about what happens when other fields get validated
  in the process.
- Cross field dependency where one field is driving what one or more following
  fields will display.
- Dynamically attach fields.
- Create a standalone hook for React components.

Schema validators tend to act as type-checking mechanisms. I am not interested
in a value being a `string` or not, rather is it an email address or not? Yes,
an email address most possibly must be a `string`, but it is a very specialized
one where the `string` type is an implementation detail of it's representation.
And also the input value will come from an HTML `<input>` element where `type=`
will be `text` or `email` that in the end outputs a `string` value. If I need
type-safety I'll go with TypeScript.

## Design

### Full asynchronous validation

Composing/chaining synchronous and asynchronous functions requires the
composition/chain of functions to be asynchronous. This is how JavaScript works:
[What Color is Your Function?](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)

The use cases I was working with almost all the time required to call an API at
some point in the validation chain, where I would use an asynchronously fetched/calulated
result. It would be a hassle to provide sync and async modes.

I would like to provide validation result to the user before she/he leaves the field.
To do that I need to "guess" when the user finished typing and then validate a
maybe partial, maybe complete input value. Maybe the simplest way is to debounce
my input value validations which requires an asynchronous workflow.

Asynchronous functions are based on synchronous ones, so as a superset most
possibly will satisfy future needs, so I will not need a workaround or having
more sync and async modes.

### No built-in validators

If I want a flexible validation "framework" it seems essential to separate the
validators from the core framework. And after all, some use cases might need an
ISO compliant email check and others only need to ensure that the user has an
"@" character and maybe one "." after the "@" in her/his email address to verify
intention.

So if I don't check types and cannot define a good set of standard validators,
why even include them in the library? Go write your own validators, create a
package from your commonly used ones. Follow the
[YAGNI](https://martinfowler.com/bliki/Yagni.html)
principle as does the `fieldv8n` design.

#### What should a validator function test?

A chain of validator functions should test the complete input value,
and each validator function should only test one property of it.
Build-up your validations incrementally.

**A very basic example how to validate an email address:**

1. `CONTAINS_AT_CHAR`: On error, inform the user she/he missed to include "@".
2. `DOMAIN_CONTAINS_DOT`: On error, inform the user that the missing dot character
   let's us guess she/he mistyped the domain part.
3. `NO_ILLEGAL_CHARACTER_IN_NAME`: On error, inform user about characters that need
   to be removed form the part before the "@".
4. `NO_ILLEGAL_CHARACTER_IN_DOMAIN`: On error, inform user about characters that
   need to be removed form the part after the "@".

**What not to validate?**

A simple answer to this is: Don't validate anything that can be safely marshaled
away or escaped by some simple operations before validating the data or sending
it to your API.

E.g. don't validate whitespace before and after the email address. Maybe it was
copy-pasted with the surrounding whitespace. Trim the value.

Rule of thumb is to not block the user's workflow when not necessary.

### Tell, don't ask

- You can use an input field without a form tag and still create meaningful functionality.
- A form's role is to send data on user inducted submission as defined by its `method`
  and `action` attributes.
- The form shouldn't care how to validate a field.
- An input field should tell the form if it can send the data.
- An input field shouldn't care when the data is sent. Only tell what is the
  status of the data to be sent.

### Goal

Formalize my workflow for creating validators and validating field data.

## Install

`fieldv8n` package is compiled with TypeScript, type definitions are included.

```sh
npm i -P fieldv8n
```

## Usage

Using `fieldv8n` is fairly easy. It only has a handful concepts to be understood.

- `fieldv8n` is just a framework for running input field validations, as a
  consequence it doesn't offer any built-in validator functions. Just as test
  frameworks don't offer no test cases for your code.
- You create a validation chain by composing standalone validator functions. Standalone
  validator functions should describe one property of the validated input value.
- Validators can work directly with the input value or be set to accept an initial
  configuration value.

### Validator

A validator contains the domain logic for validating a property of the input value.
A validator shall not validate the complete input value, just the minimum amount
of it that you can give a name. Or reversed, we could use Uncle Bob's "extract
till you drop" philosophy to create a validator that only has one task.

You create a validator by passing a config object to `fieldv8n.validator`.

- A validator needs a name, called `identifier`. An identifier must be all caps,
  can contain underscore, but cannot start or end with and underscore.
  Identifier is a `string`.
- You explicitly have to tell whether this is an initable validator by
  providing the `initable` property.
- Last you need to add an initable or non-initable of your choice `method`.
  If your validator is initable, your method needs to return a function
  on the first call and then accept an input value. **It doesn't matter whether
  the validation takes place synchronously or asynchronously, it will be evaluated
  asynchronously anyway (by the runner).**
- `method` needs to return a literal boolean value or a promise that will
  resolve to a boolean.

```ts
import { validator } from "./fieldv8n";
// import { FinalValidator, InitableValidator } from "./fieldv8n";

const IS_BAZ = validator({
  identifier: "IS_BAZ",
  initable: false,
  method: (x: string) => x === "baz",
}); // as FinalValidator

const CONTAINS = validator({
  identifier: "CONTAINS",
  initable: true,
  method: (a: string) => (b: string): boolean => new RegExp(a).test(b),
}); // as InitableValidator
```

#### Unit test

You can easily unit test your validators. You call `.validate` or
`.init` then `.validate` depending on initable type.

```js
test("your validators", () => {
  expect(IS_BAZ.validate("foo")).toBe(false);

  const CONTAINS_FOO = CONTAINS.init("foo");
  expect(CONTAINS_FOO.validate("foobar").toBe(true);
});
```

#### API details

Validators (returned by `validator(config)`) can take 3 shapes:

1. Non-initable
2. Initable
3. An initable that was inited.

Transformations:

- validator({...}) -> non-initable
- validator({...}) -> initable -> inited (non-initable)

**Common interface:**

- Returns the identifier by `.type`.
- You can ask whether it's initable with `.isInitable`.

**Initable interface:**

- `.wasInited` returns false.
- `.init` call allows to transform validator to inited state. (Returns a new object.)

**Inited interface:**

- Call `.validate` with the value you would like to validate.
- `.initParams` returns the array of arguments given to `.init` in the previous stage.
- `.wasInited` returns true.
- Caution: `.isInitable` returns true!

**Non-initable:**

- Call `.validate` with the value you would like to validate.

## Composing validators

You create a composition of validators by passing validator objects to `fieldv8n.create`.

You can either pass non-initable, initable or inited validators to `fieldv8n.create`,
because it let's you defer the initialization phase of a validator to after the
`create` call.

**Using non-initable validators:**

```js
import { create, validator } from "./fieldv8n";

const STARTS_FOO = validator({
  identifier: "STARTS_FOO",
  initable: false,
  method: (x: string) => x.startsWith("foo"),
});

const ENDS_BAZ = validator({
  identifier: "ENDS_BAZ",
  initable: false,
  method: (x: string) => x.endsWith("baz"),
});

const FOO_STAR_BAZ = create([STARTS_FOO, ENDS_BAZ]);
```

**Using initable validators:**

When creating a composition of initable validators or the composition contains
one, you can init the resulting validator.

- Init is idempotent and pure.
- When a composition consists of only non-initable validators, it behaves as
  identity function.

`init` accepts an array of tuples, where the length of the array must match the
number of initable validators.

A tuple's first member is the validator's identifier, and the second member is
the array of arguments the validator's init function awaits.

```js
import { create, validator } from "./fieldv8n";

const STARTS_WITH = validator({
  identifier: "STARTS_WITH",
  initable: true,
  method: (y: string) => (x: string) => x.startsWith(y),
});

const CONTAINS = validator({
  identifier: "CONTAINS",
  initable: true,
  method: (a: string) => (b: string): boolean => new RegExp(a).test(b),
});

const ENDS_WITH = validator({
  identifier: "ENDS_WITH",
  initable: true,
  method: (y: string) => (x: string) => x.endsWith(y),
});

const initable = create([STARTS_WITH, CONTAINS, ENDS_WITH]);

initable.types // ["STARTS_WITH", "CONTAINS", "ENDS_WITH"]
initable.isInitable // true

const FOO_BAR_BAZ = initable.init([
  ["STARTS_WITH", ["foo"]],
  ["CONTAINS", ["bar"]],
  ["ENDS_WITH", ["baz"]],
]);

FOO_BAR_BAZ.types // ["STARTS_WITH", "CONTAINS", "ENDS_WITH"]
FOO_BAR_BAZ.isInitable // false
```

## Validation

Composed validators are not directly runnable. You need the `fieldv8n.run` function.
It will validate the members of the validator composition one-by-one (iterates over
array of validators from the first element to last).

`fieldv8n.run` needs a handler to be passed which is called at each stage of
the validation process or only once when validation process is finished.

```js
import { run, create, validator } from "./fieldv8n";

const STARTS_FOO = validator({
  identifier: "STARTS_FOO",
  initable: false,
  method: (x: string) => x.startsWith("foo"),
});

const ENDS_BAZ = validator({
  identifier: "ENDS_BAZ",
  initable: false,
  method: (x: string) => x.endsWith("baz"),
});

const FOO_STAR_BAZ = create([STARTS_FOO, ENDS_BAZ]);

const handler: EventCallback = (result, done) => {
  console.log({ result, done });
};

run({
  validation: FOO_STAR_BAZ,
  value: "foobarbaz",
  onChange: handler,
  onlyOnCompleted: true, // optional parameter
})
```

TODO: Extend with remaining methods.

## Error (exception) handling

TODO: Add back examples and rewise Exception handling section.

Exception handling is a sensitive topic. However here I think directing both
validation and runtime errors thrown during `.validate()` to a different branch
will help uncover unhandled cases.

Validation and runtime error share a common interface, except when a runtime
error occurs, `runtimeError` property will be present on the `invalidData`
object. From the user's perspective it doesn't matter why a validator is
failing, the most important thing is to notify the user about the failure,
however inconvenient it might be that she/he can never input a valid value.

Runtime errors should be sent to a tracking service.

## What to avoid?

Consumers of the package are discouraged to use *typeof* like type checks. These
information is already hidden by the implementation and you most possibly will
not even have a reason to use them.
