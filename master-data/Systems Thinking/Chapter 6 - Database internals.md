---
title: B-Tree variants.
author: Alex Petrov
date: 2026-10-08
status: finished
description: B-Tree variants.
---

B-Tree variants have few things in common: tree structure, balancing through splits 
and merges and lookup and delete algorithms. Details related to concurrency and on-disk
page representation, links between nodes and maintenance processes may vary between 
implementations.

# Copy-on-write

instead of complex latching mechanisms copy-on-write is used to guarantee data 
integrity in presence of concurrent operations.

Whenever the page is about to be modified its contents are copied, instead of original
page copied page is modified and parallel tree hierarchy is created.

Old tree versions remains accessible for concurrent readers, write accessing modified 
pages have to wait till preceding write operations are complete.

The pointer to topmost page is atomically updated when the new page hierarchy is 
updated - so no operation can observe page in incomplete state.

More space and processor time is required as old records are retained and can be 
reclaimed only after all concurrent operations using the old pages complete.

Since B-Trees are generally shallow these downsides are outweighed by simplicity and 
advantages of these approach.

# Abstracting node updates

To update the page on the disk, we have to first update its in-memory representation.
We can access the cached version of the node directly, do it through the wrapper object
or create its in-memory representation native to the implementation language.

Managing on-disk pages, cached pages and their in-memory representation separately 
allows them to have different life cycles, which can be exploited for various 
optimizations.

# Lazy B-Trees

B-Trees that reduces the cost of updates using lightweight, concurrency and update 
friendly in-memory data structures to buffer updates and propagate them with delay.

Wired tiger uses different representation for in-memory and on-disk pages, it 
materialize pages in-memory as soon as they are paged in and use this structure to 
store updates until we are ready to flush them.

Clean page consists of just an index initially constructed from the on-disk page image,
updates are first saved into the update buffer.

Update buffers are accessed during reads - contents are merged with the original
on-disk page contents to return the most updated data.

When the page is flushed, update buffer contents are reconciled with page contents and 
persisted on disk overwriting the original page.

Since structural modifications splits and merges are done by background process
reads and updates do not have to wait for them to complete.

## Lazy-Adaptive tree

Instead of having separate buffer for individual nodes, nodes can be grouped into 
subtrees and we can attach an update buffer for batching operations to each subtree.

When inserting a data record, new entry is first added to the root node update buffer,
when this buffer becomes full, it is emptied by copying and propagating the changes to 
the buffers in the lower tree levels. This operation can continue recursively if the 
lower levels fill up as well, until it reaches the leaf nodes. 

There bulk inserts, updates and deletes are performed applying all changes to the tree 
contents and its structure at once. 

Instead of performing subsequent updates on pages separately, pages can be updated in
a single run requiring fewer disk accesses and structural changes since splits and 
merges propagate to the higher levels in batches as well.

Above approaches maintains some sort of additional in-memory data structure for 
buffering and requires a reconcilliation process to merge buffered operations with 
stale on disk data. Alternative approach is to group updates targeting different nodes 
together by using append-only storage and merge processes. Do no longer have to locate 
the node to make modifications, any update can simply be appended.

# FD-Trees

Buffering helps avoid many small random writes and performs a single larger write 
instead.

FD-Tree consists of a small mutable head tree and multiple immutable sorted runs. 
Random writes are only allowed on head tree a small B-Tree buffering the updates.

As soon as this tree fills up its contents are transferred to the immutable run. If 
the size of newly written run exceeds the threshold it is merged with next level, 
propagating data records from the upper level to lower levels.

FD-Trees do not update pages in place, and the same page may be stored on several 
levels, thus for deletion tombstones are stored, once these tombstones reach leaf level
we can discard them, as it is guaranteed that there are no items they can shadow anymore.

Three major problems with B-Trees are write amplification, space amplification and 
complexity of solving concurrency problems and dealing with latches.

# BW-Trees

Buffering updates helps with writes and space amplification but offers no solution 
to concurrency issues.

## Update chains 

Buzzword tree - BW-Tree writes a base node separately from its modification. Delta
nodes representing modifications form a chain - a linked list from the newest
modification through older ones, with the base node in the end.

During reads all deltas have to be traversed and applied to the base node to 
reconstruct the actual node state. 

## Consolidation and garbage collection 

As delta chains grows, reads become expensive.

We need to keep the delta chain length within reasonable threshold. Once it is breached
we apply deltas to the base node, and write down new consolidated base node at new 
location. 

To reclaim the space used by old delta chains and base node, epoch based technique is 
used. Readers do not register themselves hence there is no way to tell if the page is 
live. We can safely reclaim any garbage page once all the readers have higher epoch 
then the epoch when the page was marked as garbage. As it is guaranteed that later 
readers have never seen those nodes, as they were no longer addressable after that 
point.







