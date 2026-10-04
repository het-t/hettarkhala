---
title: Chapter 19, 20 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-20
status: inprogress
description: Paths and circuites.
---

**Eulerian path** is a path that goes through each edge exactly once.

**Hamiltonian path** is a path that goes through each node exactly once.

**Eulerian cycle** is an Eulerian path that starts and ends at the same node.

# Eulerian paths
## Existence 

Existence of Eulerian path and Hamiltonian path depends on the degrees of the nodes.

### Undirected graph

Undirected graph can have Eulerian path exactly when all the edges belong to the same strongly
connected component and

the degree of each node is even

or the degree of exactly two nodes is odd and the degree of all 
other nodes is even.

In first case where all nodes have even degree, Eulerian path is also a Eulerian circuit. 
In second case nodes with odd degree are the starting and ending nodes of an Eulerian path, which is
not Eulerian circuit.

### Directed graph

For directed graph focus is on indegrees and outdegrees of nodes.

Directed graph have Eulerian path exactly when all the edges belong to the same connected 
component and 

in each node the indegree equals the outdegree or 

in one node, indegree is one larger than the outdegree (end of the Eulerian path), in another node 
outdegree is one larger than the indegree (start of the Eulerian path), and all the other nodes have
equal indegree and outdegree.

In first case Eulerian path is Eulerian circuit.

## Hierholzer's algorithm

It is an efficient method for constructing an Eulerian circuit, we assume that the graph contains 
an Eulerian circuit.

First algorithm constructs a circuit that contains some of the edges of the graph. After this algorithm
extends the circuit step by step by adding subcircuits to it. The process continues until all edges have 
been added to the circuit.

Algorithm extends the circuit by always finding a node x that belongs to the circuit, but has an outgoing
edge that is not included in the circuit. The algorithm constructs a new path from node x that only 
contains edges that are not yet in the circuit. Sooner or later, the path will return to node x, which
creates a subcircuit.

# Hamiltonian paths

Path that goes through all nodes of the graph exactly once.

If a Hamiltonian path begins and ends at the same node, it is called Hamiltonian cycle.

## Existence

It is NP-hard problem to test if a graph contains a Hamiltonian path exists in the graph. No 
efficient method exists for that.

Simple observation is that if the graph is complete, there is an edge between all pairs of the nodes
it also contains a Hamiltonian path.

**Dirac's theorem** if the degree of each node is at least $$n/2$$ the graph contains a 
Hamiltonian path.

**Ore's theorem** if the sum of degrees of each non-adjacent pair of nodes is at least $$n$$ the graph
contains a Hamiltonian path.

Common property in these theorems is that they guarantee the existence of a Hamiltonian path if the graph
has a large number of edges.

## Construction

There exists no method to construct Hamiltonian path, as if there exists one, we can create such a path
and see whether it exists.

Simple way to search for a Hamiltonian path is to use a backtracking algorithm that goes through 
all $$n!$$ permutations of the nodes of the graph.

# De Bruijn sequences

De Bruijn sequence is a string that contains every string of length $$n$$ exactly once as a substring, 
for a fixed alphabet of $$k$$ characters. Length of such a string is $$k^n + n - 1$$ characters.

Each De Bruijn sequence corresponds to a Eulerian path in a graph. Idea is to construct a graph
where each node contains a string of $$n-1$$ characters and each edge adds one character to the string.

# Flows and cuts

**Finding a maximum flow** - what is the maximum amount of flow we can send from a node to another node?

**Finding a minimum cut** - what is minimum-weight set of edges that separates two nodes of the graph?

Input for both of these problems is weighted directed graph with two special nodes: source node - a node
with no incoming edges, and a sink node - node with no outgoing edges.

## Maximum flow

Send as much flow as possible from source to sink.

Weight of each edge is the capacity that restricts the flow that can go through that edge. At each node 
incoming flow must be equal to outgoing flow.

## Minimum cut

Remove a set of edges from the graph such that there will by no path from source to sink after the 
removal and the total weight of removed edges is minimum.

Turns out that a maximum flow and a minimum cut are always equally large.

# Ford-Fulkerson algorithm

Finds the maximum flow in a graph. It begins with empty flow and at each step finds a path from the source 
to the sink that generates more flow. Finally when algorithm cannot increase the flow anymore, the maximum
flow has been found.

Uses special representation of the graph where each edge has reverse edge in another direction
weight of each edge indicates how much flow we could route through that edge. At the start weight
of each edge equals the capacity of the edge and the weight of each reverse edge is zero.

It consists of multiple rounds. On each round the algorithm finds a path from the source to the sink
such that each edge on the path has a positive weight. If multiple of such paths are possible, we can
choose any of it.

After choosing a path, flow increases by $$x$$, minimum edge-weight on the path. In addition, weight
of each edge on the path decreases by $$x$$ and the weight of each reverse edge increases by $$x$$.

Idea is that increasing the flow decreases the amount of flow that can go through the edge in the future.
On the other hand, it is possible to cancel flow later using the reverse edges of the graph if it
turns out that it would be beneficial to route the flow in another way.

Flow increases as long as there is a path from the source to the sink through positive-weight edges.

Algorithm does not specify how we should choose the paths that increases the flow. A simple way to find 
paths is to use DFS, 

**Edmonds-Karp algorithm** chooses each path so that the number of edges on the path is as small as 
possible. This can be done by using BFS instead of DFS for finding paths. Time complexity is $$O(m^2 n)$$

**Scaling algorithm** uses DFS to find paths where each edge weight is at least a threshold value. 
Initially threshold is some large number for example sum of all edge weights. When a path cannot be found
threshold value is divided by 2. Time complexity is $$O(m^2 log c)$$ where **c** is the initial threshold value.

## Minimum cuts

Once the Ford-Fulkerson algorithm has found a maximum flow, it has also determined a minimum cut. 

Let A be the set of nodes that can be reached from the source using positive weight edges. Now the 
minimum cut consists of the edges of the original graph that start at some node in A, end at some node
outside A, and whose capacity is fully used in the maximum flow.





