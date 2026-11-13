---
title: Replication and consistency.
author: Alex Petrov
date: 2026-10-19
status: inprogress
description: 
---

**Consistency models** explain visibility semantics and behavior of the system in the presence of multiple copied of data.

**Fault tolerance** is a property of a system that can continue operating correctly in the presence of failures of its components. Primary goal
is to introduce redundancy in mission-critical components. Usually, this redundancy is completely transparent to the end user.

**Data replication** is a way of intoducing redundancy by maintaining multiple copies of data in the system. Since updating multiple copies
atomically is problem equivalent to consensus, it is costly to perform this operation for every operation in the database. 

When talking about replication, we care most about three events: write, replica update and read. In some cases, replicas are updated after the 
write has finished from user's perspective.

# Achieving availability

To make system highly available, we need to design it in a way that allows handling failures or unavailability of one or more participants 
gracefully. For that we need to introduce redundancy and replication, as soon as we add redundancy we face the problem of keeping several copies
of data in sync and have to implement recovery mechanisms. 

# Infamous CAP

**Availability** is a property that measures the ability of the system to serve an eventual response for every request successfully. 
**Linearizability** here can be expressed as a sequence of instantaneous operations that preserves the original operation order. It simplifies 
reasoning about the possible states and makes a distributed system appear as if it was running on a single machine.

CAP theorem discuss tradeoff between consistency and availability in presence of network partitions. We can build systems that guarantee strong 
consistency while providing best efforts availability, or guarantees availability while providing best effort consistency. Best efforts here implies
that if everything works the system will not purposefully violate any guarantees, but these guarantees are allowed to be weakened and violated 
in presence of network partitions.

Hence two types of systems can be built: consistent and partition tolerant, available and partition tolerant.

**PACELEC conjecture** an extension of CAP states that in presence of network partitions there is a choice between consistency and availability, 
else even if the system is running normally, we still have to make a choice between latency and consistency.

# Harvest and yield

CAP talks about strongest forms of consistency and availability: linearizability and ability of system to eventually respond to every request.
This forces us to make hard trade-off between the two properties. 

Instead of defining system as either consistent or available we can tune two parameters: harvest and yield, to provide weaker guarantees.

**Harvest** - defines how complete the query is, for some applications it can be still better to return incomplete response then failing the request.

**Yield** - specifies the number of requests that were completed successfully, compared to total number of attempted requests.

# Shared memory 

Single unit of storage accessible for read or write operations is called **register**.
Every operation is identified by its **invocation** and **completion** events. Operation is **failed** if the process that invoked it crashes 
before it completes. If two operations invocation-completion period overlaps, they are **concurrent** else **sequential**.

Depending on how the register behaves in the presence of concurrent operations, registers can be distinguished in 3 types:

**Safe** - reads may return arbitrary values within the range of the register during a concurrent write operations.

**Regular** - read operation can return only the value written by the most recent completed write or the value written by the write operation 
that overlaps the current read.

**Atomic** - it guarantees linearizability - every write operation has a single moment before which every read operation returns and old value 
and after which every read operation returns a new value. 

# Ordering

In distributed systems it is hard to know when exactly something has happened, and have that information available across whole cluster. So we 
have to define each operation in terms of its **invocation** and **completion** events.

Processes can execute read, write operations on shared registers. Each process executes its own set of operations sequentially. Combination of 
sequential process executions form a global history, in which operations can be execute concurrently.

Potential difficulties are: operations may overlap and effects of the non-overlapping calls might not be visible immediately.

# Consistency models

Consistency models can be thought of as contract between participants - what each replicas has to do to satisfy the required semantics, and what 
users can expect while issuing read and write operations.

**Single operation consistency models** assumes each process executes operation on single data object at a time.

Consistency models distinguish between "all possible histories" of interleaving operations and "histories permissible under model X".
We can think of consistency from the perspective of state, which state invariants are acceptable and establish allowable relationships between
copies of the data placed onto different replicas. Alternative is to consider operations consistency, it provides outside view on the data store,
describes operations and puts constraints on the order in which they occur.

# Strict consistency 

It is equivalent of complete replication transparency - any write by any process in instantly available for the subsequent reads by any process. It is 
just a theoretical model and it's not possible to implement.

# Linearizability 

It is the strongest single object, single operationc consistency model. Effects of the write become visible to all readers exactly once at some point 
int time between its start and end, state transition or side effects of partial updates cannot be observed.

Linearizability respects both process local operation order and the order of operation running in parallel relative to other processes, and defines a 
**total order** of the events.

This order should be **consistent** - every read of the shared value should return the latest value written to the shared variable preceding this read, 
or the value of a concurrent write. It also implies mutual shared exclusion - only one write can proceed at a time.

Even though operations are concurrent and have some overlap, they appear to be sequential. No operations are instantaneous but still appear atomic.

## Liniearization point 

Important trait of linearizability is visibility - once the operation is complete, everyone must see it, and the system cannot travel back in time. It 
prevents stale reads and requires reads to be monotonic. Operations are not instaneous but their effects have to become visible at some point in time, 
making it look like instantaneous. That time point is called **linearization point** - it serves as cutoff, after which operation effects become 
visible to all clients.

## Cost of linearizability 

Linearizability requires coordination and ordering. It can be implemented by consensus.

Linearizability is regarded as local property and implies composition of independently implemented and verified elements. Combining linearizable 
histories produces a history that is also linearizable. 

# Sequential consistency 

Sequential consistency allows ordering operations as if they were executed in some sequential order, while requiring operations of each individual 
process to be executed in same order they were performed by the process.

Processes can observe operations execute by other processes in the order consistent with their own history, but this view can be arbitrarily stale from
the global perspective. Order of execution between processes is undefined as there is no shared notion of time, but all processes observe the 
operations in the same order.

Linearizability requires local order of each process and global order to be consistent - it respects a real-time operation order. Unlike 
linearizability serializability is not composable.

# Causal consistency

All processes have to see **causally related** operations in the same order. Concurrent writes with no causal relationship can be observed in a 
different order by different processors.

If writes are causally dependent, even if later write propagates faster than the former one, it is not made visible until all of its dependencies 
arrive, and the event order is reconstructed from the logical timestamps. A happend-before relationship is established logically.

This provides us session guarantees - monotonic reads, monotonic writes, read-your-writes, writes-follow-reads.







