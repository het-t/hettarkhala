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
aborted transactions.

# Buffer management

Most database uses both memory: slower persistent storge and faster main memory.
To reduce number of accesses to persistent storage pages are cached in memory.
When the page is requested again by the storage layer, its cached copy is returned.

Cached pages available in memory can be reused under the assumption that no other process
has modified the data on disk. This approach is sometimes referenced as **virtual disk**.

More common name is **page cache** or **buffer pool**.

Un-cached pages are said to be paged in when they are loaded from disk. If any changes 
are made to the cached page, it is said to be dirty, until these changes are flushed
back on disk.

Since memory region where cached pages are held is usually substantially smaller than an 
entire dataset, the page cache eventually fills up and in order to page in a new page, 
one of the cached pages has to be **evicted**.

## Caching semantics

All changes made to buffers are kept in memory until they are eventually written back to the disk.
No other process is allowed to make changes to the backing file.

When page is requested, first we check if it is cached, in which case the cached page contents
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
is inspected.

If the access bit is 0, the page becomes a candidate and is scheduled for eviction.

If the page is currently referenced, its access bit remains unchanged. It is assumed that 
referenced page cannot have access bit 0.

Sometimes it may be more practical to consider usage frequency rather than recency as a predictive factor. For database under heavy load, 
recency is not very indicative as
it only represents the order in which items are accessed.

## LFU

To improve we can start tracking page reference events rather than page-in events.

A frequency-based page eviction policy does precisely this: instead of evicting pages
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

Database systems are built on top of several hardware and software layers having their
own stability and reliability problems.

Database themselves as well as underlying components may fail.

WAL - write ahead log or commit log is an append only auxiliary disk-resident 
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
in the log buffer and are flushed on disk in a force operation. Forces happen when 
log buffer fill up and can be requested by the transaction manager or a page cache.

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
to be incomplete. Pages are flushed asynchronously and once this is done, 
**last_checkpoint** record is updated with the LSN of the **begin_checkpoint** record
and in case of crash the recovery process will start from there.

## Operation vs data log

Shadow paging - a copy on write technique ensures data durability and transaction 
atomicity. New Contents are placed into new unpublished shadow page and made visible 
by pointer flip from the old page to the new one holding updated contents.

Updates can be represented by before and after images or by corresponding 
undo and redo operations.

Physical log stores complete page state or byte-wise changes to it.

Logical log stores operations that have to be performed against current state to 
move records or pages from one state to the other. It is critical to track exact 
state of the pages that physical and logical records can be applied to.

Mostly combination of both physical and logical logging is used, 
logical logging for undo - for concurrency and performance
and physical logging for redo - to improve recovery time.

## Steal and force policies 

Defines policies that determines when the changes made in memory have to be made persistent on disk.

Choice of policy have impact on which recovery methods can be used
steal policy - allows flushing modified pages even before the transaction is committed,
no steal policy - does not allow to flush any uncommitted transaction's content on disk
force policy - requires all modified pages to be flushed on disk before the transaction is committed
no force policy - allows the transaction to be committed even if all the modified pages are not flushed 
on disk

no steal allows to implement recovery just by storing redo entries, old copy is stored on disk and 
modification is stored in log 
with no force we can buffer several changes by deferring them, pages have to be cached during this period 
hence bigger page cache is needed
if force policy is used recovery don't need any additional operations, as pages committed by these 
transactions are already flushed on disk, downside is that transactions take longer to commit as I/O 
increases

Until the transaction commit, we have to store enough information to undo its results
if any pages touched by the transaction are flushed we have to store undo information until the 
transaction commits, if pages are not flushed we have to store redo information until transaction commits.

## ARIES

It implements steal/no-force policy.

Uses physical logs for redo operations - pointer switches improve performance as it takes less time 

Uses logical logs for undo operations - as undo operations can be performed on pages individually, logical
logs improves concurrency

Uses WAL records to implement repeating history during recovery to reconstruct complete database state 
before undoing uncommitted transactions and creates compensation log records during undo

Recovery proceeds in 3 steps 
1. Analysis phase identifies dirty pages in the page cache and transactions that were in progress at the
   time of crash. Information about dirty pages is used to identify the starting point of redo phase. List
   of in progress transactions is used during undo phase to rollback incomplete changes.
2. Redo phase repeats the history up to the point of crash and restores the database to previous state.
   This phase is done for both incomplete transactions as well as for ones that were completed but changes
   were not flushed on disk.
3. Undo phase rolls back all the incomplete transactions and restores the database to the last consistent
   state. All operations are rollbacked in reverse order, in case the database crashes again during
   recovery, operations that undo transactions are also logged as well to avoid repeating them.

# Concurrency control

Concurrency control is set of techniques for handling interactions between 
concurrently executing operations.

### Optimistic concurrency control 

Allows transactions to execute concurrent read and write operations and 
determines whether or not the result of the combined execution is serializable.

Transactions do not block each other, maintain histories of their operations 
and check these histories for possible conflicts before commit. If conflict is 
observed one of the conflicting transactions is aborted.

### Multi-version concurrency control 

Guarantees consistent view of database at some point in the past identified 
by the timestamp by allowing multiple timestamped versions of the records to be 
present. MVCC can be implemented using validation techniques, allowing only one 
of the updating or committing transactions to win, as well as with lockless 
techniques such as timestamp ordering or lock based ones, such as two phase 
locking.

### Pessimistic concurrency control 

Both lock-based and nonlocking conservative methods are available.

Lock based approaches require transactions to maintain locks on database records
to prevent other transactions from modifying and accessing locked records until 
the transaction releases its locks. 

This can result in deadlock when multiple transaction wait for each other to 
release a lock.

Set of problems that we're trying to solve, how transactions overlap and what 
consequences this overlapping has.

## Serializability 

**Schedule** is a list of operations required to execute a set of transactions 
from the database system perspective. 

A schedule is **complete** if it contains all operations from every transaction 
executed in it.

**Correct** schedule are logical equivalents to the original lists of 
operations, but their parts can be executed in parallel or get reordered for 
optimization purposes, as long as this does not violate ACID properties and the 
correctness of the results of individual transactions.

Schedule is **serial** when transaction in it are executed completely 
independent and without interleaving - every transaction is fully executed 
before the next one starts.

Always executing transactions in serial order, significantly reduces throughput 
and hurt performance.

Schedule is **serializable** if it is equivalent to some complete serial 
schedule over the same set of transactions.

## Transaction isolation 

Isolation levels specifies how and when parts of the transaction can and should
become visible to other transactions. It describe the degree to which 
transactions are isolated from other concurrently executing transactions.

To prevent incomplete or temporary writes from propagating over transaction
boundaries, we need additional coordination and synchronization which negatively
impacts the performance.

## Read and write anomalies 

SQL standard refers to and describes **read anomalies** that can occur during
execution of concurrent transaction: dirty, nonrepeatable and phantom reads.

**Dirty read** is a situation where transaction can read uncommitted changes 
from other concurrently executing transaction which later rollbacks the changes.

**Non repeatable reads** occur when same transaction tries to read record for 
multiple times and do not get the same result each time.

**Phantom reads** is equivalent to non-repeatable reads but holds for range 
queries.

There are write anomalies with similar semantics: lost update, dirty write and 
write skew.

**Lost update** occurs when wo transactions T1, T2 both attempts to update the 
value of V. T1 and T2 read the value of V. T1 updates V and commits, then T2 
updates V and commits. T1, T2 are not aware of each other, hence if both are 
permitted to commit the results of T1 will be overwritten by the results of T2 
and update from T1 will be lost.

**Dirty write** occurs when one of the transactions takes an uncommitted value
modify it and saves it, all based on the value that was never committed.

**Write skew** occurs when each individual transaction respects the required 
invariants but their combinations does not satisfy these invariants. T1, T2 
modify values of two accounts A1 and A2. A1 starts with 100, A2 starts with 
150. Account value is allowed to be negative, as long as their sum is non-
negative. T1 and T2 each attempt to withdraw 200 from A1 and A2, respectively. 
At the start sum is 250, both transactions assume they are preserving the 
invariant and are allowed to commit, in the end A1 is -100 and A2 is -50, which 
clearly violates the requirement to keep a sum of the accounts non-negative.

## Isolation levels

Read uncommitted - dirty reads are allowed 
Read committed - dirty reads are not allowed, repeatable reads and phantom 
reads are allowed
Repeatable read isolations levels - phantom reads are allowed

Strongest isolation level is serializability. It guarantees that transaction
outcomes will appear in some order as if transactions were executed serially. 

Serializability is a property of multiple operations executed in arbitrary 
order. It does not imply or attempt to impose any particular order on executing 
transactions.

In **snapshot isolation** transaction can observe the state changes performed by
all transactions that were committed by the time it has started. Each 
transaction takes a snapshot of data and execute queries against it. If any 
values modified by the transaction is changed by some other transaction, the 
transaction is rolled back. 

**Write skew** anomaly is possible under snapshot isolation, since if two 
transactions read from local state, modify independent records and preserve 
local invariants they both are allowed to commit.

# Optimistic concurrency control

It assumes that transaction conflicts occur rarely and instead of locks we can 
validate transactions to prevent read/write conflicts with concurrently 
executing transactions to ensure serializability.

Transaction is split into 3 phases:

#### Read phase
Transaction executes its steps in its own private context, without having any
of the changes visible to other transactions. After this phase all the 
dependencies - read set is known as well as the side effects the transaction 
produces - write set.

#### Validation phase 
Read and write sets of concurrent transactions are checked for the presence of 
possible conflicts between their operations that might violate serializability.

If some out of date data is read or it would overwrite some of the value written
by other concurrent transactions that committed during its read phase, its
private context is cleared and read phase is restarted. 

Validation phase preserves ACID properties.

#### Write phase
If validation phase has not determined any conflicts, transaction can commit its
write set from the private context to the database state.

Validation phase can be done by checking for conflicts with the transactions 
that have already been committed - backward oriented or with the transactions
transactions that are currently in the validation phase - forward oriented.

Validation and write phases of different transactions should be done atomically.
No transaction is allowed to commit while some other transaction is in being 
validated.

This approach is efficient if conflicts are rare, because it conflict is 
observed whole read phase which is the most expensive phase is retried.

# Multi-version concurrency control

It is a way to achieve transactional consistency by allowing multiple record 
versions using monotonically incremented transaction IDs or timestamps.

It distinguish between committed and uncommitted versions, last committed 
version is assumed to be current. Goal of the transaction manager is to have at 
most one uncommitted value at a time.

# Pessimistic concurrency control

These schemes determine transaction conflicts while they are running and block
or abort their execution.

Simplest lock free scheme is **timestamp ordering** where each transaction 
has a timestamp.  

Transaction manager maintains **max_read_timestamp** and 
**max_write_timestamp** per value, describing read and write operations 
executed by concurrent transacations.

Read operations that attempt to read a value with a timestamp lower than 
**max_write_timestamp** are aborted, as they're trying to read stale values.

Write operations that attempt to write a value with a timestamp lower than 
**max_read_timestamp** are aborted, as it will conflict with the recent read.

**Thomas write rule** - write operations with timestamp value lower than 
**max_write_timestamp** are allowed since we can safely ignore the outdated 
written values.

# Lock based concurrency control

These are a form of pessimistic concurrency techniques.

Explicit locks on the database objects are used rather than resolving schedules
like timestamp ordering does.

Downside is contention and scalability issues.

Two phase locking separates lock management into two phases:
1. Growing phase - during which all locks required by the transaction are
   acquired and no locks are released.
2. Shrinking phase - during which all locks acquired during the growing phase
   are released.


### Deadlocks

If the lock cannot be granted immediately, a transaction has to wait until the 
lock is released. 

Two transactions might end up waiting for each other to release the locks - 
deadlock.

Simplest way to handle deadlocks is to introduce timeouts and abort long running
transactions under the assumption that they might be in a deadlock.

Deadlock can be detected by using waits-for-graph, if there is a cycle there is 
a deadlock.

Deadlock detection can be performed continuously or periodically. 

If transaction T1 attempts to acquire a lock held by T2, and T1 has higher
priority, T1 started before T2.

Wait-die: T1 is allowed to block and wait for the lock. Otherwise T1 is aborted 
and restarted. Transaction can only be blocked by a transaction with a 
higher timestamp.

Wound-wait: T2 is aborted and restarted. A transaction can be blocked only by a
transaction with a lower timestamp.

### Locks

Locks are used to isolate and schedule overlapping transactions and manage
database contents but not the internal storage structure, and are acquired on 
the key. 

Lock can guard a key or range of keys and is generally stored outside the tree 
implementation.

### Latches

Guards physical representation. 

Latches guard the physical tree representation during these operations and are 
obtained on the page level. 

### Reader writer lock

We do not need to isolate all the processed from each other, we just have to
make sure that reader do not overlap with writers, or multiple writers do not 
overlap with each other.

To achieve this level of granularity we can use a readers-writer lock or RW 
lock.

RW lock allow multiple readers to access the object concurrently, and only 
writers have to obtain exclusive access to the object.

### Latch crabbing

Trivial approach is to grab all the latches on the way from the root to the 
target leaf. This creates concurrency bottleneck and can be avoided in most 
cases. Latch crabbing is simple method that allows holding latches for less time
and releasing them as soon as it is clear that the executing operation does not
require them anymore. 

On the read path, as soon as the child node is located and its latch is acquired
the parent node's latch can be released.

During insert parent latch can be released if the operation is guaranteed not to
result in any structural changes that can propagate to it. Parent latch can be 
released if the child node is not full.

During deletes, if the child node holds enough elements and operation will not 
cause sibling nodes to merge, the latch on the parent node is released.

This approach is optimistic - most inserts and deletes do not cause structural 
changes that propagate multiple levels up, the probability of structural changes
decreases at higher levels.

