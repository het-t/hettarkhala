---
title: Chapter 6 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-16
status: finished
description: Greedy algorithm - Hoffman coding.
---

Constructs a solution to the problem by always making a choice that looks like the best
at the moment. Greedy algorithm never takes back its choice, but directly constructs 
the final solution.

It does not necessarily product an optimal solution.

# Data compression

**Binary code** assigns for each character of string a **codeword** that consists of bits.

String can be compressed using the binary code by replacing each character by the 
corresponding codeword.

Variable length codewords can be used to make data compression efficient, this requires 
finding optimal codewords.

## Huffman coding

Builds a binary tree based on the frequencies of the characters in the string, each 
character's codeword can be read  by following a path from the root to the 
corresponding node.

Codewords are assigned such that most occurring character is assigned shortest codeword.

![Huffman coding](https://github.com/het-t/hettarkhala/blob/main/master-data/assets/huffman%20coding%20-%20codeword%20binary%20tree.jpg)
