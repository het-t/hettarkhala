# Numbers
## Integers
A signed 32-bit `int` has a value range of

$$
-2^{31} \ldots 2^{31}-1
$$

or approximately

$$
-2 \times 10^9 \ldots 2 \times 10^9
$$

A 64-bit `long long` has a value range of

$$
-2^{63} \ldots 2^{63}-1
$$

or approximately

$$
-9 \times 10^{18} \ldots 9 \times 10^{18}
$$

## Floating-point numbers

It is risky to compare floating-point numbers using the `==` operator because floating-point calculations can introduce small rounding errors.
Instead two numbers can be considered equal if their difference is sufficiently small:

$$
|a-b| < \epsilon
$$

# Shortening Code

## Type names

`typedef` gives a shorter name to a datatype.
Example:
```cpp
typedef pair<int, int> pi;
```

## Macros
Macro means that certain strings in the code will be replaced **before compilation**.

Example:

```cpp
#define PB push_back
```

After defining this macro,

```cpp
v.push_back(t);
```

can be written as:

```cpp
v.PB(t);
```

# Mathematics

## Logic

### Predicate

Predicate is an expression whose truth value depends on its parameters.

For example,

$$
P(x): x > 5
$$

is a predicate. Its truth value depends on the value of \(x\).

### Quantifier

Quantifier specifies how a predicate applies to the elements of a set.

The two common quantifiers are:

* $$\forall\$$: for all
* $$\exists\$$: there exists

For example, if

$$
P(x): x > 0
$$

then

$$
\forall x \in \mathbb{R}\, P(x)
$$

means "for every real number \(x\), \(x>0\)" which is false.

Whereas

$$
\exists x \in \mathbb{R}\, P(x)
$$

means "there exists a real number \(x\) such that \(x>0\)" which is true.
