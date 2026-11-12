---
title: Leader election.
author: Alex Petrov
date: 2026-10-17
status: inprogress
description: Bully's algorithm.
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


