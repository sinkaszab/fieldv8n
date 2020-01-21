# Field Validation - fieldv8n

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
more implementation modes.

### No built-in validators

If I want a flexible validation "framework" it seems essential to separate the
validators from the core framework. And after all, some use cases might need an
ISO compliant email check and others only need to ensure that the user has an
"@" character and naybe one "." after the "@" in her/his email address to verify
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

1. `containsAtChar`: On error, inform the user she/he missed to include "@".
2. `domainContainsDot`: On error, inform the user that the missing dot character
   let's us guess she/he mistyped the domain part.
3. `noIllegalCharacterInName`: On error, inform user about characters that need
   to be removed form the part before the "@".
4. `noIllegalCharacterInDomain`: On error, inform user about characters that need
   to be removed form the part after the "@".

**What not to validate?**

A simple answer to this is: Don't validate anything that can be safely marshaled
away or escaped by some simple operations before validating the data or sending
it to your API.

E.g. don't validate whitespace before and after the email address. Maybe it was
copy-pasted with the surrounding whitespace. Trim the value.

A harder decision is what to do when you encounter space character inside the
email address. Maybe the user wanted to type a different character, maybe not.
A good solution is to make the user verify the email address (by sending
her/him an verification email, where you also provide option for checking the
status of the process.) In this case you can safely remove inner whitespaces.

Another way is to make the user review the address before sending the form. That
way you can separate filling and reading processes for the user, there is a higher
chance errors will be caught and then provide option to correct the fields.
Don't make wild guesses and block the user in her/his interaction with a
doubtful validation error.

You see a "@@@" or ".."? Use marshaling to get rid of multiplicated functional parts.
You don't see into the user's head. If you would, you didn't need to ask for her/his
email address. Again reduce to one "@" or "." and make the user verify the data.

### Tell, don't ask

- You can use an input field without a form tag and still create meaningful functionality.
- A form's role is to send data on user inducted submission as defined by its `method`
  and `action` attributes.
- The form shouldn't care how to validate a field.
- An input field should tell the form if it can send the data.
- An input field shouldn't care when the data is sent. Only tell what is the
  status of the data to be sent.

### Goal

IMHO a successful software should resemble to `*nix` functions like `grep`.
It's small, it has one task which it does well. It only needs little
maintenance, it shall be long-lived and rewrite is a clear sign of failure here.

## Install

`fieldv8n` package comes in 3 different flavors, bundled by Rollup:

- ES module
- CommonJS module
- IIFE module

Import Common.js style:

```js
const { make, registerValidator } = require("fieldv8n");
```

ES Module style import:

```js
import { make, registerValidator } from "fieldv8n";
```

## Usage

Using `fieldv8n` is fairly easy. It only has a handful concepts to be understood.

- `fieldv8n` is just a framework for running input field validations, as a
  consequence it doesn't offer any built-in validator functions. Just as test
  frameworks offer no test cases for your code.
- You create a validation chain by composing standalone validator functions. Standalone
  validator functions should describe one property of the validated input value.
- You can fork a validation chain before it's evaluated to extend it. This works
  similar to the class design with inheritance pattern.
- Validators can work directly with the input value or be set to accept an initial
  configuration value.

### Register a simple validator

```js
registerValidator({
  name: "atCharPresent",
  type: "HAS_ONE_AT_CHAR",
  method: email => email.match(/@/g).length === 1,
});
```

`name: String`: Prefer using valid JavaScript property naming. You will use this
to refer to your validator in the validation chain.

`type: any`: Validation result will refer to this. You will use this when you
create your validation message to be displayed to the user. Think of Redux
reducer action types.

`method: Function`: A unary function whose return value will be used to make a
"boolean" decision for the validation result. A falsy result will make the
validation chain raise a validation error on the failing validator type.

### Register an initable validator

```js
registerValidator({
  name: "maxCharacters",
  type: "CHAR_LIMIT",
  method: n => str => str.length <= n,
  initable: true,
});
```

`initable: Bool|any`: When truthy, the validator will be handled as initializable
and you can set an initializer value for the validator in the validation chain
to work with on the to be validated value.

`method: Function`: On the first invocation your method must accept an initializer
value and return another unary function that accepts the value to be validated.

### Compose a validation chain

```js
// Returns a fieldv8n instance:
const newInstance = make();

// Start a composition of validators:
const newChain = newInstance.compose();

// Attach validators to the composition:
const validation = newChain
  .onlyLetters // You have to register this validator before using it.
  .allUpperCase // This is the `name` property of the registered validator.
  .maxChars(256) // Call an initable validator.
  .noRepeatingLetter;

// Run validation inside an async function:
try {
  await validation.validate();
  // Run effect to display input value was valid.
  displayInputIsValid();
} catch (error) {
  // Run effect to display input value failed validation.
  displayInputIsInvalid(error.type, error.value);
}
```

#### A more real-life example

```js
// Create a validation chain:
const emailValidation = make()
  .compose()
  .containsAtChar
  .containsDotInDomain
  .noIllegalCharacter
```

```js
// Use with async/await construct:
const validateEmail = (onInvalid, onValid) => async emailAddress => {
  try {
    const validData = await emailValidation.validate(emailAddress);
    onValid(validationResult);
  } catch (invalidData) {
    onInvalid(invalidData);
  }
};
```

```js
// Use with Promise chaining:
const validateEmail = (onInvalid, onValid) => emailAddress =>
  emailValidation.validate(emailAddress)
    .then(validData => onValid(validData))
    .catch(invalidData => onInvalid(invalidData));
```

**Shape of ValidData and InvalidData:**

```js
// Shape of valid validation result:
const validData = {
  value: "hello@hello.com", // Input field value.
  type: "NO_ILLEGAL_CHAR", // Type of the last validator in the chain.
  history: [
    "IS_VALUE",
    "CONTAINS_AT_CHAR",
    "CONTAINS_DOT_IN_DOMAIN",
  ], // Rest valid validator types in order of validation.
};

// Shape of invalid validation result:
const invalidData = {
  value: "hello@hellocom",
  type: "CONTAINS_DOT_IN_DOMAIN", // Type of the invalid validator.
  history: [
    "IS_VALUE",
    "CONTAINS_AT_CHAR",
  ],
  error: InvalidData|ValidatorRuntimeError, // Extends Error.
  runtimeError: Error, // Optional, the Error thrown by bad validator method.
};
```

### Fork validation chain

You can fork and extend a validation by calling `.compose()` on an existing
chain. When forking, the source will stay intact, further validators can be
attached which will not be inherited by the previously forked validation chain.
However instead attaching new validators to the source of the fork, forking one
more time is the preferred solution.

```js
const evenIntValidation = make()
  .compose()
  .isInteger
  .isEven;

const evensInRangeValidation = evenIntValidation
  .compose()
  .greaterThan(50)
  .lessThan(100);

evenIntValidation.validate(20); // valid
evensInRangeValidation.validate(20) // invalid
```

## Error (exception) handling

Exception handling is a sensitive topic. However here I think directing both
validation and runtime errors thrown during `.validate()` to a different branch
will help uncover unhandled cases.

Validation and runtime error share a common interface, except when a runtime
error occurs, `runtimeError` property will be present on the `invalidData`
object. From the user's perspective it doesn't matter why a validator is
failing, the most important thing is to notify the user about the failure,
however inconvenient it might be that she/he can never input a valid value.

Runtime errors should be sent to a tracking service.

```js
const validateEmail = (onInvalid, onValid) => async emailAddress => {
  try {
    const validData = await emailValidation.validate(emailAddress);
    onValid(validationResult);
  } catch (invalidData) {
    if (invalidData.runtimeError) {
      logRuntimeError(invalidData);
    }
    onInvalid(invalidData);
  }
};
```

## What to avoid?

Consumers of the package are discouraged to use *typeof* like type checks. These
information is already hidden by the implementation and you most possibly will
not even have a reason to use them.
