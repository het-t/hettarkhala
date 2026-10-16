---
title: Implementing B-Tree.
author: Alex Petrov
date: 2026-10-04
status: finished
description: Page layout, page header and vacuum.
---

# Page header

Information about page that has to be accessed faster such as information used for navigation, maintenance, 
and optimizations can be stored inside page header.
ex: counts of cells, describes cell and page layout, lower and upper bounds of free memory space

## Magic numbers 

Random integer number that describes page, its layout, type, version etc is written with page content.

If at random position byte sequence matches this magic number, there is high chance 
that it is the start of the page. 

## Sibling links 

Some implementation store forward and backward links, pointing to the left and right sibling nodes. This
allows to refer to sibling nodes without ascending all the way up to common parent.

Only overhead is that these sibling nodes have to be updated whenever a non-rightmost nodes 
is split or merged. Since updates have to happen in sibling node instead of splitting node, 
additional locking is needed.

## Rightmost pointers

B-Tree separator key, split the tree into subtrees and navigate them, so there is always one more pointers
than there are keys.

Each separator key has a child pointer, while the last pointer is stored separately in the header, since 
it is not paired with any key.

If the rightmost node is split or merged the rightmost pointer has to be reassigned. 

## Node high key

Instead of storing right most pointer in page header, additionally **high key** is stored and the 
right-most pointer is assigned to it. The high key represents the highest value possible key that can be 
present in the subtree under the current node.

In this case pointers can be stored pairwise with corresponding keys, which makes key-pointer handling 
much simpler and removes many edge cases involving the right-most node.

## Overflow pages 

Node size and tree fanout are fixed and do not change dynamically. It is also hard to find the universally
optimal values for them. If variable size values are present and they are too large, only few values are 
stored in the page, if the values are tiny space is wasted.

B-Tree algorithm specifies that every node keeps fixed number of items. As some values have different
sizes, we might end up in a situation where according to the B-Tree algorithm the node is not full yet 
but there is no space left in fixed size page to store new elements.

To store variable size data more efficiently we can use linked pages. Each node keeps up to some fixed length
value inside the page and rest of the data is spilled out into **overflow** pages. Pointer to this overflow page 
is stored in page header. Original page is called **primary page**. If a single overflow page is not enough, it can be pointed to next overflow page, and whole
linked list like representation can be constructed. 

Most of the keys have high cardinality thus it makes sense to store only first few bytes of the data, for most
of the comparisons only trimmed part stores in primary page can be used.

# Binary search

Keys are maintained in sorted order so that during lookup operations binary search can be performed.

If the binary search returns positive number, it is the index of found key, if it returns negative number
its magnitude represents position at which this key should be inserted. Insertion can be performed by adding 
the new element and shifting next elements by one position.

# Propagating splits and merges

B-Tree node splits and merges can propagate to the parent nodes all the way up to the root node.
To effectively move upwards in level either parent pointers are maintained at each node, or **breadcrumb** is 
maintained (usually in form of in-memory stack).

# Rebalancing 

Many B-Tree implementations attempt to postpone merges and splits to amortized their
costs by rebalancing elements within the level, or by moving elements from more occupied nodes to 
less occupied nodes for as long as possible and if not performs merge or split as needed. This 
helps to maintain occupancy, and reduce number of levels at the cost of higher rebalancing cost.

Instead of splitting full node into two half full ones, some implementations split two nodes into three nodes
each 2/3 occupied.

# Right-only appends

Many database systems uses monotonically autoincremented keys as primary index keys. In this case all the 
insertions happens at the level of leaves, in the rightmost node. It opens up new optimization, we can cache
the rightmost page, if it has enough space new element is inserted otherwise it is split. By caching the 
rightmost node, whole **readpath** can be skipped.

If we expects more insertions to follow up instead of splitting rightmost page, creating new page storing only
one record can be considered, as it will be eventually filled up by insertions.

# Bulk loading

If we have to rebuild the tree or bulk load the presorted data, we can use the idea of right-only appends even further.

As data is already sorted in increasing order or index, all the insertions will happen in rightmost page only.
So we can just write down all records page-by-page, creating new page when current when gets full. In this case, 
we will have all the lowermost leaves pages even before any other upper level nodes are composed. After 
completely constructing leaves level, keys from the leaves are moved upwards to compose upper level nodes.
This way whole BTree can be build from bottom up way.

# Compression 

Storing raw uncompressed data can induce significant overhead and many databases uses compression 
to save space. Larger compression ratio can save more space but may take more RAM and CPU time to compress and 
decompress the data.

Compressing whole file is quite impractical, so generally compression is applied at page level. Each page is 
compressed independently, allowing to couple page compression with page loading and flushing.

Parameters to choose good compression method are 
1. memory overhead
2. compression performance
3. decompression performance
4. compression ratio

# Vacuum and maintenance

Processed other than user facing operations on B-Tree can be performed in background to improve performance, 
these processed maintains integrity, reclaim space, reduces overhead and keeps pages in order.

B-Tree is navigated from the root node, all the nodes that can be referenced are called **live pages** and all
other references are called **garbage**.

Due to frequence updates and deletion page might get **fragmented** - situation where page has enough total free
space to accommodate new record, but the free space is not continuous hence the insertion fails. 

During **compaction** we move page by page, rewrites tuples in logical order to improve prefetching during range scans,
and page is **defragmented** so that all the freed up space is contiguous.
