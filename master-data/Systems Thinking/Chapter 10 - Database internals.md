---
title: Leader election.
author: Alex Petrov
date: 2026-10-17
status: finished
description: Bully algorithm, optimizations to reduce message passing and ring topology.
---

Existence of the coordinator process reduces overall peer-to-peer message passing, by means of centralized process coordinator. 

Generally processes in distributed systems are uniform and any of them can assume leadership role, but long-lived stable processes are preferred.

**Liveness** of leader election algorithm guarantees that **most of the time** there will be a leader, and election will eventually complete.
**Safety** guarantees there may be **at most one** leader.

Election is triggered when the system initialize, leader is elected for the first time, leader crashes. It has to be deterministic and exactly one leader
should be chosen, and this decision should be effective for all the processes.

Having single leader might become bottleneck, so data is partitioned into non-intersecting independent replica sets, each set has its own leader.

# Bully algorithm/Monarchical leader election 

Each process is assigned a **rank**. During election processes with higher ranks are preferred.

Leader election is initiated when one of the processes notices that there is no leader in the system.
1. The process sends election messages to processes with higher ranks.
2. Process waits, allowing higher ranked processes to respond, if none responds it assumes that no higher ranked process is live and assumes itself as
   leader and notifies other processes about new leader.
3. If any higher-ranked process responds, it is chosen as leader and all other processes are notified about it.

It violates safety property, it is very easy in case of network partitions and broken links to end up with multiple disjoint clusters of processes each 
with its own elected leader. This situation where multiple processes thinks themselves as leader is called **split brain**.

Another problem is if higher ranked proceses are unstable, system can go into permanent state of reelection, reducing availability. 

# Next-in-line failover

Each elected leader provides a list of failover nodes. When one of the process detects a leader failure, it starts a new election round by sending a 
message to the highest-ranked alternative from the list provided by the failed leader. If one of the proposed alternative is up, it becomes new leader.

# Candidate/Ordinatry optimization

Number of messages can be reduced by splitting nodes into two subsets: candidates and ordinary. Only one of the candidates can become leader.

# Invitation algorithm

It allows processes to **invite** other processes to join their groups. This allows multiple leaders by definition, since each group has its own 
leader.

Each process starts as a leader of a new group, where only member is the process itself. Group leaders contacts peers that do not belong to their 
groups, inviting them to join. If contacted peer is group leader itself, two groups are merged otherwise group's leader's ID is returned, to allow 
direct contact.

# Ring algorithm 

All nodes in system form a ring and are aware of ring topology, all its predecessor and successors. When process detects the leader failure, it starts 
the new election round. Election message is forwarded across the ring - each process contacts its successor. If the node is unavailable, the process 
skips the unreachable node and attempts to contact the nodes after it in the ring, until one of them responds. 

Message is passed around the ring, collecting live nodes data, as it reaches the node who started election, the highest ranked node from the collected 
live node set is chosen as a leader. 

The ring might get partitioned into multiple disjoint parts, with each part potentially electing its own leader. Hence, ring algorithm do not 
guarantee safety property.
