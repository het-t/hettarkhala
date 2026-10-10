---
title: B-Tree basics.
author: Alex Petrov
date: 2026-10-02
status: inprogress
description: 
---

# Binary search trees

root node
comparison of values in node, left subtree and right subtree

## Tree balancing

pathological tree
balanced tree
rotation for balancing

## Trees for disk-based storage

fanout
what makes BTS unfit for on-disk data structure
practical challenges of representing BST on-disk
good properties tree we want to achieve
high fanout 
low height

# Disk based structures

## Hard disk drives
sequential I/O

## Solid state drives
memory cells strings arrays pages blocks planes dies
SSD can have one or more dies
cell can hold one or multiple bits of data
pages vary in size between devices 
smallest unit that can be written or read is page
only empty memory cells can be changed to update them they have to be erased first
smallest erase entity is block that holds multiple pages - often called erase block
pages in empty block have to be written sequentially
FTL-Flash translation layer is responsible to map page ids to their physical location, tracking emtpy
written and discarded pages
during garbage collection 

block device abstraction in HDD and SSD
writing only full blocks and combining subsequent writes to the same block help to 
reduce the number of required I/O operations, this can be achieved by immutability and buffering

## On-disk structures

to follow a pointer to the specific location entire block has to be fetched,
we can change layout the data structure to take advantage of it


# Ubiquitous B-Trees
occupancy 
fanout 

## B-Tree hierarchy 
grouped into 3 groups
Root node: node with no parents and is at the top of the tree
Leaf node: bottom layer nodes that have no child nodes
Internal nodes: all other nodes connecting root with leaves

B-Trees consist of multiple nodes. Each node holds up to N keys and N+1 pointers to the child nodes,

Higher fanout helps to amortize the cost of structural changes required to keep the tree 
balanced and to reduce the number of seeks by storing keys and pointers to child nodes in a 
single block or multiple consecutive blocks. Balancing operations are performed when nodes are 
almost full or empty.


## Separator keys

keys stored in B-Tree nodes are called index entries, separator keys, or divider cells. 
they split the tree into subtrees - called branches or subranges

sibling pointers for efficient range scans
pointes in both directions

B-Trees reserve extra space inside nodes for future insertions and updates tree storage utilization
can get as low as 50%, but is usually higher. 
Higher occupancy does not negatively influence B-Tree performance

## B-Tree lookup complexity
two standpoints 
number of block transfers and number of comparisons done during lookup

## B-Tree lookup algorithm
exact match used for point queries, updates and deletion, finding predecessor is useful for range
scans and inserts

## B-Tree node splits
to insert the value into a B-Tree
first locate the target leaf node and find the insertion point

overflowed node
split conditions for leaf node and internal nodes

## B-Tree node merges
underflows

