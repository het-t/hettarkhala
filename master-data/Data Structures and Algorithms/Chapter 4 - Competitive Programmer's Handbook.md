---
title: Chapter 4 - Data structures
author: Antti Laaksonen
date: 2026-09-15
status: finished
description: Dynamic arrays, sets, maps, stacks, queues and priority queues data structures.
---

# Dynamic arrays

Array whose size can be changed during the execution of the program.
Internal implementation of a vector uses and ordinary array. If the size of the vector 
increases and the array becomes too small, a new array is allocated and all the elements 
are moved to the new array.
This does not happen very often and the average time complexity of `push_back` is $$O(1)$$.

String structure is also a dynamic array that can be used almost like vector.

`substr(k, x)` returns the substring that begins at position k and has length x.

`find(x)` find the position of the first occurrence of character x.

# Set structures

Maintains collection of **distinct** elements.

There are two set implementations: 
1. ordered set `set` based on balanced binary tree - operations work in $$O(log n)$$ time,
2. `unordered_set` uses hashing and its operations work in $$O(1)$$ time.

Ordered set maintains order of the elements in collection.

`multiset` and `unordered_multiset` work like `set` and `unordered_set` but they 
can contain multiple instances of an element, where `erase` removes all the 
occurrences of given item. To remove only one occurrence `erase` should be provided
iterator to the item.

# Map structures
Generalized array that contains key-value-pairs.

keys in a map can be of any data type and they do not have to be consecutive values.

`map` is based on balanced binary tree and accessing elements take $$O(log n)$$ time.

`unordered_map` uses hashing and accessing elements take $$O(1)$$ time on average.

If the value of the key is requested but the map does not contain it, the key is automatically added to the map with a default value.

`count` checks if a key exists in a map.

# Iterator and ranges 
Iterator is a variable that points to an element in a data structure.

`begin` points to the first element, and `end` points the position **after** the last element - hence the range defined by the iterators is half-open.

The element to which an iterator points can be accessed using the **\*** symbol. 

Iterators can be moved forward (++) and backward (--).

# Other structures

## Bitset

Array whose each value is either 0 or 1, each element requires only one bit.

It can be created using string as 
```cpp
bitset<10> s(string("0010011010")); 
```

`count` returns number of 1s.

## Deque

Dynamic array whose size can be efficiently changed at both ends of the array in $$O(1)$$.

## Stack

Provides $$O(1)$$ time operation to add and remove element from the top.

## Queue

Provides $$O(1)$$ time operation to add element at the end and remove element from the front.

It is only possible to access first and last element of a queue.

## Priority queue

Maintains collection of elements, insertion and depending on type of the queue, retrieval 
and removal of minimum or maximum is supported.

Insertion and removal take $$O(log n)$$ time, and retrieval takes $$O(1)$$ time.

Usually implemented with heap data structure.

By default elements are sorted in decreasing order, provides `push`, `pop` and 
`top` functions.

To create priority queue that stores elements in increasing order 
```cpp
priority_queue<int,vector<int>,greater<int>> q
```

