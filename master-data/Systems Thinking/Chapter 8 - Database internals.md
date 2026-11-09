---
title: Distribute systems.
author: Alex Petrov
date: 2026-10-12
status: inprogress
description: Fallacies and difficulties in distributed systems.
---

In distribute systems we have multiple **participants** communicating with each other by exchanging **messages**, through **communication links**
between them. Processes can access time using a **clock**, it can be **logical clock** like monotonically increasing counter, or a **physical 
clock (wall clock)** like one accessible thorough operating system, which have some physical notion to it.

Due to inherent difficulties and complexity involved in communication links between nodes, everything in distribute systems is unreliable.
Communication channels may break, delay or reorder messages, this makes knowing the exact state of the remote process more complicated.

**Distribute algorithms** are specially designed algorithms have notion of local and remote state and execution and work despite unreliable 
network and component failures. Algorithms are described in terms of **state** and **steps** with **transitions** between them. Each process
executes algorithm steps locally, and these local executions combinedly constitutes distributes execution over several participants.

Algorithms defines participant roles, messages passed, timing assumptions, states, transitions, failure models.

Distributed algorithms serves many purposes:

**Coordination** - supervise and direct the execution on several participant processes.

**Cooperation** - multiple participant comes together to complete a shared task.

**Dissemination** - information is spread across interested parties rapidly and reliably by message passing.

**Consensus** - participant processes comes on a unanimous agreement.

