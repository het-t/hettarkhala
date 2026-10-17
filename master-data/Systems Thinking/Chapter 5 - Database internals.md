---
title: Transaction processing and recovery.
author: Alex Petrov
date: 2026-10-05
status: inprogress
description: 
---

**Transaction** is an indivisible logical unit of work in a database management system,
allowing to represent multiple operations as a single step.

Database transaction has to preserve atomicity, consistency, isolation, and durability.
These properties are collectively called ACID.

### Atomicity

Transaction steps are indivisible, either all the steps associated with the transaction
execute successfully or none of them do. They never do apply partially. Each transaction
can either commit - make all changes from write operations visible, or abort - rollback
all side effects. After abort transaction can be retried.

### Consistency

It is an application specific guarantee, it brings database from one valid state 
to another valid state, maintaining all database invariants.

It is the most weakly defined property, it is only property that is controlled by the user
and not only by the database itself.

### Isolation

Multiple transactions execute concurrently without any interference, as if there 
were no other transactions executing at the same time. 

Isolation defines when the changes to the database state may become visible, and what
changes may become visible to the concurrent transactions. Many databases uses 
weaker isolation level for performance reasons.

### Durability

Once the transaction is committed, all database state modifications have to be 
persisted on disk and be able to survive power outages, system failures and crashes.

On the node locally, the transaction manager coordinates, schedules and tracks 
transactions and their individual steps.

Lock manager guards access to these resource and prevents concurrent accesses that 
would violate data integrity. Whenever a lock is requested the lock manager checks 
if it is already held by any other transaction in shared or exclusive mode, and 
grants access to it if the requested access level results in no contradiction.
Exclusive lock can be held by at most one transaction at any given moment, other
transactions requesting them have to wait until locks are released or whenever
the transaction terminates, the lock manager notifies one of the pending transactions 
and let it acquire the lock and continue.

Page cache serves as an intermediary between persistent storage and the rest of the
storage engine. It stages state changes in main memory and serves as a cache for the pages 
that haven't been synchronized with persistent storage. All changes to a database 
state are first applied to the cached pages.

**Log manager** holds history of operations - log entries applied to cached pages but 
not yet synchronized with persistent storage to guarantee they won't be lost in 
case of a crash. The log is used to reapply these operations and reconstruct the cached 
state during startup. Log entries can also be used to undo changes done by the 
abortes transactions.

# Buffer management

Most database uses both memory: slower persistent storge and faster main memroy.
To reduce number of accesses to persistent storage pages are cached in memory.
When the page is requested again by the storage layer, its cached copy is returned.

Cached pages available in memory can be reused under the assumption that no other proces
has modified the data on disk. This approach is sometimes referenced as **virtual disk**.

More common name is **page cache** or **buffer pool**.

Uncached pages are said to be paged in when they are loaded from disk. If any changes 
are made to the cached page, it is said to be dirty, until these changes are flushed
back on disk.

Since memory region where cached pages are held is usually substantially smaller than an 
entire dataset, the page cache eventually fills up and in order to page in a new page, 
one of the cached pages has to be **evicted**.

## Caching semantics

All changes made to buffers are kept in memory until they are eventually written back to the disk.
No other process is allowed to make changes to the backing file.

When page is requested, first we check if it cached, in which case the cached page contents
are returned. If page contents are not yet cached, the cache translates the logical 
page address or page number to its physical address, loads contents in memory, and returns
cached version to the storage engine. Once returned buffer with cached page contents is said 
to be **referenced**, and storage engine has to hand it back to the page cache or dereference 
it once it is done. Page cache can be instructred to avoid evicting pages by 
**pinning** them.

If the page is modified it is marked as dirty. A dirty flag set on the page indicates 
that its contents are out of sync with the disk and have to be flushed for durability.

## Cache eviction 

Due to limited capacity of page cache, old pages have to be evicted. If page contents are in sync 
with the disk and the page is not pinned or referenced it can be evicted right away.
Dirty pages have to be flushed before they can be evicted. Referenced pages should 
not be evicted while some other thread is using them.

Triggering flush on every eviction might be bad for performance, so many databases 
use a separate background process that cylces through the dirty pages that are likely to 
be evicted updating their disk versions.

If the database crashes all data that was not flushed is lost. To make sure all changes are 
persisted, flushes are coordinated by the **checkpoint** process. The checkpoint process
controls the write-ahead log (WAL) and page cache, and ensures that they work in lockstep.

Only log records associated with operations applied to cached pages that were flushed 
can be discarded from the WAL.

There is always trade-off between several properties:
1. postpone flushes to reduce the number of disk accesses
2. preemptively flush page to allow quick eviction
3. pick pages for eviction and flush in the optimal order
4. keep cache size within its memory bounds
5. avoid losing the data as it is not persisted to the primary storage

## Locking pages in cache
B-Trees get narrower toward the top, higher-level nodes are hit for most of the reads.
Splits and merges also eventually propogate to the higher level nodes. This means there is 
always at least a part of a tree that can significantly benefit from being cached.

## Page replacement
When page capacity is reached to load new pages, old ones have to be evicted.
For this we say that pages should be evicted according to the eviction policy.
It attempts to find pages that are least likely to be accessed again any time soon.
When the page is evicted from the cache, the new page can be loaded in its place.

Ideal page replacement policy will require a crystal ball to predict the order in which 
pages are going to be accessed and evict only pages that will not be touched for the 
longest time. Since requests do not necessarily follow any specific pattern or distribution,
precisely predicting behavior can be complicated but using a right page replacement 
policy help to reduce the number of evictions.

It seems logical that increasing number of pages in cache, page evictions can be reduced, 
but if the page replacement policy is not optimal, it might cause more eviction 
this is called **Beladys anomaly**, this makes situation worse.

## FIFO and LRU

Most naive page-replacement strategy is first-in, first out. It maintains a queue of 
page IDs in their insertion order, adding new pages to the tail of the queue.
Whenever page cache is full, it takes the element from the head of the queue to find
the page that was paged in at the farthest point in time.
Natural extension is least-recently used. It maintains a queue of eviction candidates 
in insertion order, but allows to place a page back to the tail of the queue on repeated
accesses, as if this was the first time it was paged in.

2Q maintains two queues and puts pages into the first queue during the initial access
and moves them to the second hot queue on subsequent access, allowing you to distinguish 
between the recently and frequently accessed pages. 
LRU-K identifies frequently referenced pages by keeping track of the last K accesses, and 
using this information to estimate access times on a page basis.

## Clock
In some situations efficiency may be more important than precision.
CLOCK algorithm variants are often used as compact, cache-friendly and concurrent 
alternatives to LRU.

Clock-sweep holds references to pages and associated access bits in a circular buffer.

Many variants use counters instead of bits to account for frequency. Every time the
page is accessed, its access bit is set to 1.

Algorithm works by going around the circular buffer, checking access bits

If the access bit is 1, and the page is unreferenced it is set to 0 and the next page
is inspected

If the access bit is 0, the page becomes a candidate and is scheduled for eviction.

If the page is currently referenced, its access bit remains unchanged. It is assumed that 
referenced page cannot have access bit 0.

Sometimes it may be more practical to consider usage frequency rather than recency as a predictive factor. For database under heavy load, recency not be very indicative as
it only represents the order in which items are accessed.

## LFU

To improve we can start tracking page reference events rather than page-in events.

A frequency based page eviction policy does precisely this: instead of evicting pages
based on page-in recency, it orders pages by usage frequency.

Preserving an entire history might be prohibitively expensive for practical purposes.

Admission - maintaining newly added elements, implemented using LRU policy
Probation - holding elements most likely to get evicted
Protected - holding elements that are to stay in the queue for a longer time

Rather than choosing which elements to evict every time, this approach chooses which 
ones to promote for retention. Only the items that have a frequency larger than the
item that would be evicted as a result of promoting them, can be moved to the probation
queue. On subsequent accesses, items can get moved from probation to the protected 
queue. If the protected queue is full, one of the elements from it may have to be 
placed back into probation. More frequently accessed items have a higher chance of 
retention, and less frequently used one are more likely to be evicted.

# Recovery

Database systems are build on top of several hardware and software layers have their
own stability and reliability problems.

Database themselves as well as underlying components may fail.

WAL - write ahead log or commit log is an append only auxiliary disk - resident 
structure for crash and transaction recovery.

Page cache allows buffering changes to page contents in memory. Until the cached 
contents are flushed back to disk, the only disk-resident copy preserving the 
operation history is stored in the WAL.

WAL ensures that data makes it to the persistent storage and is available in case of 
crash, as uncommitted data is replayed from the log and the pre-crash database state 
is fully restored.

# Log semantics

Write ahead log is append only and immutable, so all writes to the log are sequential, 
so readers can safely access its contents up to the latest write threshold while the 
writer continues appending data to the log tail.

Every record in the write ahead log has a unique monotonically increasing log 
sequence number (LSN), the LSN is usually represented by an internal counter or 
timestamp.

Log records do not necessarily occupy an entire disk block, their contents are cached 
in the log buffer, and are flushed on disk in a force operation. Forces happens when 
log buffer fill up, and can be requested by the transaction manager or a page cache.

All records have to be flushed on disk in LSN order.

Besides individual operation records, WAL holds records indicating transaction 
completion. A transaction can't be considered committed until the log is forced up to 
the LSN of its commit record.

Some systems use compensating log records during undo and store them in the log, to 
make sure the system continue functioning correctly after a crash during rollback or 
recovery.

WAL is usually trimmed whenever a checkpoint is reached.

Checkpoints are a way for a log to know that log records up to certain mark are fully
persisted and are not required anymore, this significantly reduces the amount of work 
required during the database startup. Process that forces all dirty pages to be 
flushed on disk is generally called sync checkpoint.

Flushing entire contents on disk is rather impractical and require pausing all running
operations until the checkpoint is done. Most databases implement fuzzy checkpoints.
**last_checkpoint** pointer stored in the log header contains the information about 
last successful checkpoint. Fuzzy checkpoint begins with a special **begin_checkpoint**
log record specifying its start, and ends with **end_checkpoint** log record, 
containing information about dirty pages, and contents of a transaction table.

Until all the pages specified by this record are flushed, the checkpoint is considered
to be incomplete. Pages are flushed asynchronously and once this is one, **last_checkpoint** record is updated with the LSN of the **begin_checkpoint** record
and in case of crash the recovery process will start from there.
