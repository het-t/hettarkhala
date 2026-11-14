---
title: Anti-entropy and Dissemination. 
author: Alex Petrov
date: 2026-10-20
status: inprogress
description: 
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

# Read-repairs




