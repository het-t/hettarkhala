---
title: Chapter 3 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-14
status: completed
description: Sorting.
---

# Bubble sort
Naive algorithm use two nested loops to compare adjacent pairs and swap when necessary.
**Inversion**: a pair of array elements in wrong order.
If the array is in reverse order, largest number of inversions is possible

$$
1 + 2 + \ldots + (n-1)
= \frac{n(n-1)}{2}
= O(n^2)
$$

Time complexity: $$O(n^2)$$

# Merge sort
It is based on recursion and implementes divide and conquer technique.
It sorts a subarray $$[a \ldots b]$$ as follows:
1. If $$a == b$$ do nothing, as subarray is already sorted.
2. Calculate position of the middle element $$k = \lfloor \frac{a+b}{2} \rfloor$$.
3. Recursively sort the subarrays $$[a \ldots k]$$ and $$[k+1 \ldots b]$$.
4. Merge the sorted subarrays into a sorted subarray.

Time complexity: $$O(n \log n)$$

Any sorting algorithm that are based on comparing array elements can't have better 
worst-case time complexity.

# Counting sort
Assume that every element in the array in an integer between 0 and $$c$$ and $$c = O(n)$$.

Create bookkeeping array whose indices are the elements in the array and value represents the frequency in the array.

Then use this bookkeeping array to construct new sorted array.

Time complexity: $$O(n)$$

# Sorting in C++
`sort` function can be used.

Default sorting order is increasing, but reverse order is also possible.

`sort` function requires that a **comparison operator** defined for the data type of the elements to be sorted.

User defined structs do not have a comparison operator automatically. It should be defined inside the struct as function `operator<` with parameter of the same type.
It should return true if the element is smaller than the parameter and false otherwise.

`sort` function can also take external comparison function as a callback function.

# Binary search

Requires sorted arrays.

Time complexity: $$O(log n)$$

## Method 1 
```cpp
int a = 0, b = n-1;
while (a <= b) {
  int k = (a+b)/2;
  if (array[k] == x) {
    // x found at index k
  }
  if (array[k] > x) b = k-1;
  else a = k+1;
  }
```

## Method 2
Efficient way is to make jumps and slow the speed when we get closer to the target element.
```cpp
int k = 0;
for (int b = n/2; b >= 1; b /= 2) {
  while (k+b < n && array[k+b] <= x) k += b;
}
if (array[k] == x) {
  // x found at index k
}
```

# C++ functions
`lower_bound`: returns iterator to the first array element whose value is at least x.

`upper_bound`: returns iterator to the first array element whose value is larger than x.

`equal_range`: returns both above iterators.

These functions assume that array is sorted.
