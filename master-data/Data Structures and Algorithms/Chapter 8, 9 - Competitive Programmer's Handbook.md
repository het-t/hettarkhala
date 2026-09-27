---
title: Chapter 8, 9 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-17
status: finished
description: 
---

Amortized analysis can be used to analyze algorithms that contain operations whose 
time complexity varies.
Instead of focusing on individual operations, focus on total time used to all complete
all such operations during complete execution of the algorithm.

# Two pointers method 

Sub-array sum: find subarray with target sum.
2SUM problem: find two elements from the array whose sum equals target sum.

# Range queries
`sum(a, b)` calculate the sum of values in range $$[a, b]$$

`min(a, b)` calculate the minimum of values in range $$[a, b]$$

`max(a, b)` calculate the maximum of values in range $$[a, b]$$

Naive way is to loop over given range to calculate the answer, this way $$q$$ queries
will take $$O(nq)$$ time.

## Static array queries

Array values are never updated between the queries.

# Binary indexed tree - Fenwick tree

It is dynamic variant of a prefix sum array.

It allows updating a value which is not efficiently possible in prefix array as 
all prefix values will have to be recalculated.

Binary indexed tree is usually represented as an array, we assume that all arrays are 
one-indexed.

Let `p(k)` denote the largest power of two that divides `k`, we store a binary indexed
tree as an array tree such that 

$$ 
tree[k] = sum(k-p(k) + 1, k)
$$

![Fenwick tree](https://github.com/het-t/hettarkhala/blob/main/master-data/assets/fenwick%20tree.jpg)

$$sum(a, b) = sum(1, b) - sum(1, a-1)$$ can be calculated in $$O(log n)$$ time.

We can calculate value of `p(k)` using formula `p(k) = k & -k`.


# Segment tree

It supports two operations: processing a range query and updating an array value, both in $$O(long n)$$ time.
It can support sum queries minimum and maximum queries and many other queries.

It supports more queries than binary indexed tree, and requires more memory.

It is a binary tree such that nodes at the bottom most level are elements, and other nodes contain information
needed for processing range queries.

Let size of the array is of power of 2 - if it is not we can add few extra elements, 
and zero based indexing is used.

Each internal tree node corresponds to an array range whose size is a power of two.

The key idea is that any range can be represented as sum of 2's power.

Segment tree is represented as array of `2n` elements.

![segment tree](https://github.com/het-t/hettarkhala/blob/main/master-data/assets/segment%20tree.jpg)

Node at position `k` has its left child at position `2k` and right child at position `2k+1`.

```cpp
int sum(int a, int b) {
  a += n;
  b += n;
  int s = 0;
  while (a <= b) {
    if (a%2 == 1) s += tree[a++];
    if (b%2 == 0) s += tree[b--];
    a /= 2; b /= 2;
  }
  return s;
}
```

At each stage search moves one level higher in the tree, and before that the values of the nodes that
do not belong to the higher range are added to the sum.


To update value at position `k` by `x`
```cpp
void add(int k, int x) {
  k += n;
  tree[k] += x;
  for (k /= 2; k >= 1; k /= 2) {
    tree[k] = tree[2*k]+tree[2*k+1];
  }
}
```

# Additional techniques

## Index compression 

Array based data structures has limitation that array elements are indexed using consecutive integers.
If our data structure needs large indices, underlying array will be required to house that many elements,
which can cause high memory consumption. 

We can use **index compression** where original indices are replaced by smaller indices. This can be done if 
we know all the indices needed during the algorithm beforehand.

## Range updates

Range update can be performed by performing two update operations.
