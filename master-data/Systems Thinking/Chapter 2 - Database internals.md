---
title: B-Tree basics.
author: Alex Petrov
date: 2026-10-02
status: inprogress
description: B-Tree operations and on-disk management.
---

# Binary search trees

Binary search trees are rooted binary tree, each tree node have at most 2 children nodes. It is sorted tree. 
Each node can store key, all nodes in the left subtree have keys smaller than node's key, and each node in the
right subtree have keys greater than the node's key.

We can search for particular key by going from root node to leaf node at each step comparing search key with 
node's key and deciding on which subtree to continue search within. Thus the search space is halved at each level
and total time complexity for search operation is $$O(log n)$$.

## Tree balancing

In worst case we can end up with a tree that looks like linked list called pathological tree. 
In that case we end up loosing all the benefits of binary trees.

To mitigate this we have to make sure that tree is balanced and we don't end up all with 
most of the nodes in one side.

This can be done by performing rotations at node. If after any operation, we observe that the node is unblanced.

## Trees for disk-based storage

Unbalanced trees have a worst-case complexity of $$O(n)$$. Balanced trees give us an 
average $$O(log N)$$.

Due to low Fanout - maximum allowed number of children per node, we have to perform 
balancing, relocate nodes and update pointers rather frequently.

This increased maintenance costs make BSTs impractical for on-disk data structures.

There is no order of insertions there is no guarantee that a newly created node is 
written close to its parent which means that node child pointers may span across severl
disk pages - this is locality issue.

Another issue is with following child pointers, due to low fanout we have to perform 
$$O(log N)$$ seeks to locate the searched element and subsequently perform the same 
number of disk transfers.

A version of the tree that would be better suited for disk implementation has to exhibit
following properties:
high fanout to improve locality of neighboring keys 
and low height to reduce number of seeks during retrieval.

# Disk based structures

## Hard disk drives

On spinning disk random seeks increases costs because they requires disk rotation and 
head movements to position the read/write head to the desired location. Once the 
expensive part is done reading or writing contiguous bytes is relatively cheap.

Smallest transfer unit is sector, at least an entire sector can be read or written.

That is why sequential I/O is preferred over random reads.

## Solid state drives

SDD don't have moving parts. It is built of memory cells connected to strings (typically 
of 32 to 64 cells per string), combined into arrays, combined into pages, combined into
blocks, combined into planes, placed onto die.

Depending on technology each memory cell can store 64 to 512 pages. SSDs can have one
or more dies.

Smallest unit that can be written or read is page. However we can only make modifications
to empty memory cells, so before modifying content of memory cell they have to be erased
first. 

The smallest erase entity is block also called erase block. Pages in an empty block have 
to be written sequentially.

FTL-Flash translation layer is responsible of mapping page ids to their physical 
location, tracking empty, written and discarded pages during garbage collection.

During garbade collection FTL finds blocks it can safely erase. Some blocks might still
contain live pages, in that case FTL relocates the live pages from these blocks to new 
locations and updates the mapping to point to new location and only then erases unused
blocks.

Block device abstraction in HDD and SSD hides an internal disk structure and 
buffers I/O operations internally, so when we're reading a single word from a block 
device whole block is containing it is read.

Writing only full blocks and combining subsequent writes to the same block help to 
reduce the number of required I/O operations, this can be achieved by immutability and 
buffering.

## On-disk structures

To follow a pointer to the specific location entire block has to be fetched,
we can change layout the data structure to take advantage of it.

## B-Tree hierarchy 

B-Tree consist of multiple nodes. Each node holds up to N keys and N+1 pointers to the 
child nodes group into 3 categories:

Root node: node with no parents and is at the top of the tree
Leaf node: bottom layer nodes that have no child nodes
Internal nodes: all other nodes connecting root with leaves

Relationship between the node capacity and the number of keys it actually holds is called
occupancy. 

Higher fanout helps to amortize the cost of structural changes required to keep the tree 
balanced and to reduce the number of seeks by storing keys and pointers to child nodes in a 
single block or multiple consecutive blocks. Balancing operations are performed when nodes are 
almost full or empty.

## Separator keys

Keys stored in B-Tree nodes are called index entries, separator keys, or divider cells. 
they split the tree into subtrees - called branches or subranges.

Some B-Trees stores sibling pointers for efficient range scans, some 
even stores pointers in both directions to allow efficient range scans in both directions.

B-Trees reserve extra space inside nodes for future insertions and updates,
thus tree storage utilization can get as low as 50%, but is usually higher. 
Higher occupancy does not negatively influence B-Tree performance.

## B-Tree lookup complexity

There are two standpoints:
number of block transfers and number of comparisons done during lookup.

In terms of number of transfers, the logarithm base is N - number of keys per node.
There are K times more nodes on each new level, and following a child pointer reduces the search 
space by the factor of N. 

From the perspective of number of comparisons the base is 2, since searching a key inside 
each node is done using binary search. Every comparison halves the search space.

## B-Tree lookup algorithm

Objective is to find the search key or its predecessor.
Finding an exact match is used for point queries, updates and deletion, finding predecessor is 
useful for range scans and inserts.

## B-Tree node splits
To insert the value into a B-Tree we first have to locate the target leaf node and find the 
insertion point. After the leaf node is located the key and value are appended to it.

If the target node does not have enough room available, we say that the node has overflowed, and 
has to be split into two nodes to fit the new data. More precise conditions are as below:

1. For leaf nodes if the node can hold up to N key value pairs and inserting one more key-value pair
   brings it over its maximum capacity N.

2. For non leaf nodes: if the node can hold up to N+1 pointers and inserting one more pointer
   brings it over its maximum capacity N+1.

Split algorithm:

1. Allocate a new node.
2. Copy half of the elements from the splitting node to the newly created one.
3. Placel the new element into corresponding node.
4. At the parent of the split node, add a separator key and a pointer to the new node.
5. If the parent is at full capacity perform the algorithm recursively.

   
## B-Tree node merges

If neighbor nodes have too few nodes (their occupancy falls below threshold) the sibling nodes are 
merged - this situation is called underflow.

If two neighbor nodes have same parent and their contents can be accommodated into a single node
they have to be merged to restore balance.

Precise conditions:

1. For leaf nodes: if a node can hold up to N key-value pairs and a combined number of key-value
   pairs in two neighboring nodes is less than or equal to N.
   
2. For non leaf nodes if a node can hold up to N+1 pointers and a combined number of pointer in two
   neighboring nodes is less than or equal to N+1.

Contents of one node is moved to another one, and a key and pointer from parent node is removed. 
This can cause recursive underflow on upper levels.

Merge algorithm:

1. Copy all elements from the right node to the left node.
2. Remove the right node pointer from the parent.
3. Remove the right node.
   
