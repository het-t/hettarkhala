---
title: Failure detection.
author: Alex Petrov
date: 2026-10-14
status: inprogress
description: 
---

For a system to appropriately react to failures, 
failures should be detected in timely manner.

Detecting failures in asynchronous systems is extremely difficult 
as it is impossible to tell whether the process is working slow
or has failed.

Dead, failed, crashed - process that has stopped executing.

Unresponsive, slow, faulty - **suspected** process working slower.

Slowness is indistinguishable from failure, hence there is always a
tradeoff between wrongly marking slow process as failed(false positive)
and delaying marking unresponsive alive process as dead(false negative).

**Failure detector** is a local subsystem responsible for identifying 
failed or unreachable processes to exclude from the algorithm while 
guarantying liveness and preserving safety.

**Liveness** guarantees that a specific intended event **must** occur.
If a process is dead, failure detector must mark it failed.

**Safety** guarantees that a specific unintended event **must not** occur.
If failure detector has marked some process as failed, it has to be 
in fact dead.

**Completeness** - every nonfaulty member should eventually notice the process failure, 
and the algorithm should be able to make progress and eventually 
reach its final result.

Algorithm can be judged by its **efficiency** - how quickly it marks
processes, and **accuracy** - how correctly processes are marked. These 
parameters are in fact tunable, and inversely correlated to each other.
Efficient failure detector algorithm cannot be very accurate and vice versa.

# Heartbeats and pings

**Ping** sends messages to remote processes checking if they are still
alive by expective a response within a specified time period.

**Heartbeat** actively notifies its peers that it is still running
by sending messages to them.

Each process maintains a list of other processes and update it with 
the last response time for each process. If a process fails to respond
to a ping message for a longer time, it is marked as **suspected**.

Both are ultimately same things main difference is who is sender and receiver, 
and what is the message.

# Timeout-free failure detector

Hear-beat a timeout-free failure detector is an algorithm that only 
counts heartbeats and allows the application to detect process failures
based on the data in the heartbeat counter vectors.

Algorithm assumes that each process is aware of the existence of all 
other processes in the network.

Each process maintains a list of neighbors and counters associated 
with them. Processes start by sending heartbeat messages to their 
neighbors. Each message contains a path that the heartbeat has traveled
so far. 

When the process receives a new heartbeat message, it increments counters
for all participants present in the path and sends the heartbeat to the 
ones that are not present there, appending itself to the path. Propagation 
stops as soon as all participants receives the heartbeat.

Heartbeat counters represents global and normalized view of the system.
We might end up marking a process reachable even when the direct link
between processes is faulty.









