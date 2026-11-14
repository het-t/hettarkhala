---
title: Anti-entropy and Dissemination. 
author: Alex Petrov
date: 2026-10-20
status: finished
description: Read repairs, Merkle trees, Bitmap vectors, Gossip.
---

Message containing schema changes, membership information, node states, failures, cluster-wide metadata are generally infrequent and small, but have 
to be propagated as quickly and reliably as possible. These messages can generally by propagated to all nodes in the cluster using one of three 
approaches: 

1. broadcast from one process to all others.
2. periodic peer-to-peer information exchanges, peers connect pairwise and exchange messages.
3. cooperative broadcast, where message recipients become broadcasters and help to spread the information quicker and more reliably.

Broadcast is the most straightforward approach but it works well in small clusters only, in larger clusters, it can get expensive because of the 
overdependence of single process. Individual process may not always know about the existence of all other processes in the network. 

Some updates may fail to propagate. The coordinator will do its best and deliver the messages to all available participants, and then anti-entropy 
mechanisms will bring nodes back in sync in case there were any failures.

**Entropy** is a property that represents the measure of disorder in the system. Here is represents degree of state divergence between the nodes. Anti-
entropy is usually used to bring the nodes back up-to-date in case the primary delivery mechanism has failed. It lowers convergence time bounds in 
eventually consistent systems. It can be implemented as background or foreground process. To repair we have to find and repair missing records by 
comparing replica states pairwise, we cannot just read whole dataset and compare record pairwise every time, so patterns in which data records can 
go out of sync and how these records are accessed have to taken into consideration to implement efficient mechanism to repair them.

# Read repairs

At read time we contact all replicas, we can check for any stale responses and update those replicas. This repairs only requested data, and we don't 
have to query and compare whole dataset.

We don't have to update all replicas, quorums can be used to provide tunable consistency, at read time we only updates enough replicas so that 
consistency level can be maintained. This means even after read repair some replicas still might not have updated value.

Read repair can be implemented as **blocking request**, during which operation waits until the coordinator repairs replicas. It improves consistency 
but reduces availability.

# Digest reads

Instead of issuing a full read request to each node, generally single replica is queried for complete record, other replicas are sent **digest** 
requests, to just return the hash value of stored record, which is then compared by coordinator against earlier returned complete record's hash 
value. If all matches, we can say all replicas are up-to-date else updates are sent back to lagging replicas.

Generally non-cryptographic hash functions such as MD5 are used, to reduce computation and hence latency. Collisions are ignored, assuming that 
separate anti-entropy mechanism will handle out-of-sync data records.

# Hinted handoff

A write-side repair mechanism. If the target node fails to acknowledge the write, the write coordinator or one of the replicas stores a special 
record, called **hint** which is replayed to the actual target node as soon as it comes back up. Some databases use **sloppy quorums** together with 
hinted handoff. 

# Merkle trees

Read repair can fix inconsistencies in the currently queried data. Cold data needs to be handled by different strategy. Merkle trees compose a compact
hashed representation of the local data, building a tree of hashes. Lowest level of this hash tree is built by scanning an entire table holding data 
records, and computing hashes of record ranges. Higher tree levels contains hashes of the lower-level hashes, building hierarchical representation 
that allows us to quickly detect inconsistencies by comparing the hashes.

Just by comparing root level hashes, we can tell if there is any inconsistency. By comparing hashes pairwise from top to bottom, it is possible to 
locate ranges holding differences between the nodes and repair data records contained in them.

# Bitmap version vectors 

It can be used to resolve data conflicts based on **recency** - each node keeps a per-peer log of operations that have occurred locally or were 
replicated. During anti-entropy logs are compared and missing data is replicated to the target node.

To track replica states, we use node-local logical clocks, each clock represents a set of dots, representing writes this node has seen directly 
(coordinated by the node itself) or transitively (coordinated by and replicated from the other nodes). If some writes are not replicated from 
other nodes, the clock will contain gaps. To get two nodes back in sync, they can exchange logical clocks, identify gaps represented by the missing
dots, and then replicate data records associated with them.

We need to reconstruct the data records each dot refers to. This information is stored in a dotted causal container which maps dots to causal 
information for a given key. This way, conflict resolution captures causal relationship between the writes.

During exchange with other nodes, it will receive the missing updates the other value has seen. As soon as all the nodes in the system have seen 
consecutive values up to the index, the version vector can be truncated up to this index.

It captures the causal relation between the value writes and allows nodes to precisely identify the data points missing on the other nodes. If the 
node was down for extended time period, peer nodes cannot truncate the log, since data still has to be replicated to the lagging node once it comes 
back up.

# Gossip dissemination 

Gossip protocols have **reach** of a broadcast and the **reliability** of anti-entropy. Gossip protocols are probabilistic procedures based on how 
rumors are spread in human society or how disease propagate in the population. Rumors spread while the population still has an interest in hearing 
them, disease propagate until there are no more susceptible members in the population.

Process that holds a record that has to be spread around is said to be **infective**. Any process that has not received the update yet is then **susceptible**. Infective processes not willing to propagate the new sate after a period of dissemination are said to be **removed**. 

Instead of maintaining global list of recipients and requiring a single coordinator to broadcast messages to each other participants, this class of 
algorithms models completeness using the **loss of interest** function. Efficiency is then determined by how quickly it can **infect** as many nodes 
as possible, while keeping overhead caused by redundant messages to minimum.

## Gossip mechanics

Process select peers at random and exchange currently hot information with them. Whenever a process receives a message it will try to pass it down to 
peers. As peers are selected at random there will always be some overlap. Amount of time system takes to reach convergence is called **latency**. 
There might be short period where all peers are notified but gossip will still continue. 

As nodes notice they are receiving the same information again and again, the message will start losing importance and nodes will have to eventually 
stop relaying it. Interest loss can be computed **probabilistically** or using **threshold**. Both have to take cluster size and fanout in 
consideration.

# Overlay networks

Nonepidemic approaches can distribute the message with non-probabilistic certainty, less redundancy and more efficiently, gossip algorithms are 
praised for their scalability but requires some message redundancy for reliability. 

Middle ground for this two approaches is to construct a **temporary** fixed topology in a gossip protocol. This can be achieved by creating an 
**overlay network** of peers.

Nodes in the system can form **spanning trees**, having such graph we can pass messages optimally. But if there is some broken link, message will not 
propagate to large part of the system. To handle this we can mix both approaches - fixed topologies and tree-based broadcast. When the system is in 
**stable** state, and fall back to **gossip** for failover and system recovery.

# Hybrid gossip 

**Push/lazy push multicast trees** - Plumtrees work by creating a spanning tree overlay of nodes to actively distribute messages with the smallest overhead. Under normal conditions node send full messages to just small subset of peers provided by the peer sampling service.

Lazy-push step: each node sends the full message to the small subset of nodes and for the rest of the nodes, it lazily forward only the message Id, 
if that node has never seen the message it can query its peer for the complete message.

In case of failure, protocol falls back to the gossip approach through lazy-push steps. 

# Partial views

When the **churn** - measure of the number of joining and leaving nodes in the system - is high, broadcasting messages to all known peers and 
maintaining a full view of the cluster get expensive and impractical. To avoid this **peer sampling service** is used. This service maintains 
**partial view** of the system, which is periodically refreshed using gossip.

Hybrid Partial View protocol maintains a small **active** view and a larger **passive** view of the cluster. Nodes from the active view create an 
overlay that can be used for dissemination. Passive view is used to maintain a list of nodes that can be used to replace the failed ones from the 
active view.

Periodically nodes exchange their active and passive views, nodes add the members from both passive and active view they receive from their peers to 
their passive views, cycling out the oldest values to cap the size.
