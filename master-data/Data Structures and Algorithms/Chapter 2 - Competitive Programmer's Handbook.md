---
title: Chapter 2 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-12
status: completed
description: Time complexity and Kadane’s algorithm.
---

# Maximum subarray sum 
Given an array of n numbers find maximum subarray sum - largest possible sum of a sequence of consecutive values in the array.
## Algorithm 1
Naively implement three nested loops to iterate over all subarrays to find maximum sum.
Time complexity: $$O(n^3)$$

## Algorithm 2
Get rid of inner most loop and track sum in 2nd nested loop itself.
Time complexity: $$O(n^2)$$

## Algorithm 3 - Kadane's algorithm
The problem can be broken down into two subproblems, finding the maximum sub subarray that ends at position $$k$$ there are two possibilities:
1. The subarray only contains the element at position $$k$$.
2. The subarray consists of subarray that ends at position $$k-1$$ and followed by element at position $$k$$.
Time complexity: $$O(n)$$


# Estimating efficiency

| Input size | Required time complexity |
|------------|--------------------------|
| n $$\le$$ 10 | O(n!) |
| n $$\le$$ 20 | O(2^n) |
| n $$\le$$ 500 | O(n^3) |
| n $$\le$$ 5000 | O(n^2) |
| n $$\le$$ 10^6 | O(n $$\log$$ n) or O(n) |
| n is large | O(1) or O($$\log$$ n) |
