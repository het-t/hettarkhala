---
title: Chapter 5 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-16
status: finished
description: Generating permutations and subsets.
---

# Complete search

## Generating subsets

### Method 1 
```cpp
void search(int k) {
  if (k == n) {
    // process subset
  } 
  else {
    search(k+1);
    subset.push_back(k);
    search(k+1);
    subset.pop_back();
  }
}
```

### Method 2
```cpp
for (int b = 0; b < (1<<n); b++) {
  vector<int> subset;
  for (int i = 0; i < n; i++) {
    if (b&(1<<i)) subset.push_back(i);
  }
}
```

## Generating permutations

### Method 1
```cpp
void search() {
  if (permutation.size() == n) {
    // process permutation
  } 
  else {
    for (int i = 0; i < n; i++) {
      if (chosen[i]) continue;
      chosen[i] = true;
      permutation.push_back(i);
      search();
      chosen[i] = false;
      permutation.pop_back();
    }
  }
  }
```

### Method 2
```cpp
vector<int> permutation;
for (int i = 0; i < n; i++) {
  permutation.push_back(i);
}
do {
  // process permutation
} while (next_permutation(permutation.begin(),permutation.end()));
```


## Backtracking

Begins with an empty solution and extends the solution step by step. The search 
recursively goes through all different ways how a solution can be constructed.

